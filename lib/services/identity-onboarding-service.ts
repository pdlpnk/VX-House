import "server-only";

import { randomUUID } from "node:crypto";

import {
  createVerificationCode,
  normalizeEmail,
  type AuthenticatedPrincipal,
  type SessionCookieManager,
  type SessionTokenManager,
  VerificationCodeHasher,
} from "@/lib/auth";
import {
  ApplicationError,
  createTransactionalEventServices,
  hashCommandPayload,
  PrismaTransactionRunner,
} from "@/lib/application";
import type { PrismaClient } from "@/lib/db";
import type { LanguageCode, MarketCode, ProductRole } from "@/lib/db/generated/client";
import {
  PrismaAuthRepository,
  PrismaConsentDocumentRepository,
  PrismaConsentVersionRepository,
  PrismaEmailVerificationRepository,
  PrismaIdempotencyRepository,
  PrismaIdentityUserRepository,
  PrismaMarketRepository,
  PrismaOnboardingRepository,
  PrismaPartnerProfileRepository,
  PrismaPlayerProfileRepository,
  PrismaUserConsentRepository,
  PrismaUserProfileRepository,
} from "@/lib/repositories";
import { hashPassword } from "@/lib/auth/password";
import { SECURITY_EVENT_TYPES } from "@/lib/security";
import { validateRegistrationInput } from "@/lib/validation";
import type { EmailProvider } from "./email-provider";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_.:-]{8,160}$/;

export interface IdentityOnboardingConfig {
  readonly sessionIdleTtlSeconds: number;
  readonly sessionAbsoluteTtlSeconds: number;
  readonly verificationTtlSeconds: number;
  readonly resendCooldownSeconds: number;
  readonly maxVerificationAttempts: number;
  readonly maxActiveChallenges: number;
}

export interface RegistrationCommand {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
  readonly productRole: ProductRole;
  readonly marketCode: MarketCode;
  readonly preferredLanguage: LanguageCode;
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

function requireIdempotencyKey(value: string) {
  if (!IDEMPOTENCY_KEY.test(value)) {
    throw new ApplicationError("VALIDATION", "Некорректный ключ идемпотентности");
  }
}

function latestRequiredVersions<
  T extends { consentDocumentId: string; version: number; consentDocument: { isRequired: boolean } },
>(versions: readonly T[]) {
  const latest = new Map<string, T>();
  for (const version of versions) {
    if (!version.consentDocument.isRequired) continue;
    const current = latest.get(version.consentDocumentId);
    if (!current || version.version > current.version) latest.set(version.consentDocumentId, version);
  }
  return [...latest.values()];
}

export class IdentityOnboardingService {
  private readonly transactions: PrismaTransactionRunner;

  constructor(
    private readonly database: PrismaClient,
    private readonly tokens: SessionTokenManager,
    private readonly cookies: SessionCookieManager,
    private readonly codes: VerificationCodeHasher,
    private readonly emailProvider: EmailProvider,
    private readonly config: IdentityOnboardingConfig,
  ) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  async register(input: {
    command: unknown;
    idempotencyKey: string;
    now?: Date;
  }) {
    requireIdempotencyKey(input.idempotencyKey);
    const command = validateRegistrationInput(input.command);
    const normalizedEmail = normalizeEmail(command.email);
    const passwordHash = await hashPassword(command.password);
    const requestHash = hashCommandPayload({
      displayName: command.displayName,
      email: normalizedEmail,
      productRole: command.productRole,
      marketCode: command.marketCode,
      preferredLanguage: command.preferredLanguage,
    });
    const challengeId = randomUUID();
    const verificationCode = createVerificationCode();
    const codeHash = await this.codes.hash(challengeId, verificationCode);
    const token = await this.tokens.issue();
    let shouldDeliverCode = false;

    const result = await this.transactions.run(async ({ database, occurredAt }) => {
      const idempotency = new PrismaIdempotencyRepository(database);
      const receipt = await idempotency.find("identity.register", input.idempotencyKey);
      if (receipt) {
        if (receipt.requestHash !== requestHash) {
          throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Команда регистрации уже использована");
        }
        const existingProfile = await new PrismaUserProfileRepository(database).findByUserId(receipt.actorId);
        if (!existingProfile) throw new ApplicationError("CONFLICT", "Регистрация недоступна");
        const session = await new PrismaAuthRepository(database).createSession({
          userId: receipt.actorId,
          tokenHash: token.hash,
          expiresAt: addSeconds(occurredAt, this.config.sessionIdleTtlSeconds),
          absoluteExpiresAt: addSeconds(occurredAt, this.config.sessionAbsoluteTtlSeconds),
        });
        return { userId: receipt.actorId, session, profile: existingProfile, replayed: true };
      }

      const users = new PrismaIdentityUserRepository(database);
      if (await users.findSafeByEmail(normalizedEmail)) {
        throw new ApplicationError("CONFLICT", "Не удалось создать доступ с указанными данными");
      }
      const market = await new PrismaMarketRepository(database).findActiveByCode(command.marketCode);
      if (!market) throw new ApplicationError("VALIDATION", "Выбранный рынок сейчас недоступен");

      const user = await users.create({
        id: randomUUID(),
        email: normalizedEmail,
        displayName: command.displayName,
        passwordHash,
        createdAt: occurredAt,
      });
      const profiles = new PrismaUserProfileRepository(database);
      const profile = await profiles.create({
        userId: user.id,
        productRole: command.productRole,
        marketId: market.id,
        preferredLanguage: command.preferredLanguage,
      });
      if (command.productRole === "PLAYER") {
        await new PrismaPlayerProfileRepository(database).createPending(profile.id);
      } else {
        await new PrismaPartnerProfileRepository(database).createPending(profile.id);
      }
      await new PrismaOnboardingRepository(database).create(user.id, "CONTACT_PENDING");
      const expiresAt = addSeconds(occurredAt, this.config.verificationTtlSeconds);
      await new PrismaEmailVerificationRepository(database).create({
        id: challengeId,
        userId: user.id,
        codeHash,
        maxAttempts: this.config.maxVerificationAttempts,
        expiresAt,
        resendAvailableAt: addSeconds(occurredAt, this.config.resendCooldownSeconds),
        createdAt: occurredAt,
      });
      const session = await new PrismaAuthRepository(database).createSession({
        userId: user.id,
        tokenHash: token.hash,
        expiresAt: addSeconds(occurredAt, this.config.sessionIdleTtlSeconds),
        absoluteExpiresAt: addSeconds(occurredAt, this.config.sessionAbsoluteTtlSeconds),
      });
      const events = createTransactionalEventServices(database, occurredAt);
      const actor = { type: "user" as const, id: user.id, sessionId: session.sessionId };
      await events.security.record({
        type: SECURITY_EVENT_TYPES.registrationCreated,
        actor,
        target: { type: "user", id: user.id },
        metadata: { productRole: command.productRole, market: command.marketCode },
      });
      await events.security.record({
        type: SECURITY_EVENT_TYPES.emailCodeRequested,
        actor,
        target: { type: "email-verification", id: challengeId },
        metadata: { reason: "registration" },
      });
      await idempotency.create({
        operation: "identity.register",
        key: input.idempotencyKey,
        actorId: user.id,
        requestHash,
        resultType: "User",
        resultId: user.id,
        createdAt: occurredAt,
      });
      shouldDeliverCode = true;
      const safeProfile = await profiles.findByUserId(user.id);
      if (!safeProfile) throw new ApplicationError("CONFLICT", "Профиль не создан");
      return { userId: user.id, session, profile: safeProfile, replayed: false, expiresAt };
    });

    let deliveryAvailable = true;
    if (shouldDeliverCode && "expiresAt" in result) {
      try {
        await this.emailProvider.sendVerificationCode({
          userId: result.userId,
          email: normalizedEmail,
          code: verificationCode,
          expiresAt: result.expiresAt!,
        });
      } catch {
        deliveryAvailable = false;
      }
    }
    return {
      ...result,
      deliveryAvailable,
      setCookie: this.cookies.create(token.value, this.config.sessionIdleTtlSeconds),
      redirectTo: "/access",
    };
  }

  async requestVerificationCode(input: { principal: AuthenticatedPrincipal; now?: Date }) {
    const challengeId = randomUUID();
    const code = createVerificationCode();
    const codeHash = await this.codes.hash(challengeId, code);
    const result = await this.transactions.run(async ({ database, occurredAt }) => {
      const profile = await new PrismaUserProfileRepository(database).findByUserId(input.principal.userId);
      if (!profile) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
      if (profile.contactVerificationStatus === "VERIFIED") {
        throw new ApplicationError("CONFLICT", "Контакт уже подтверждён");
      }
      const challenges = new PrismaEmailVerificationRepository(database);
      const latest = await challenges.findLatest(input.principal.userId);
      if (latest && latest.resendAvailableAt.getTime() > occurredAt.getTime()) {
        throw new ApplicationError("CONFLICT", "Повторная отправка временно недоступна", {
          retryAfterSeconds: String(Math.ceil((latest.resendAvailableAt.getTime() - occurredAt.getTime()) / 1000)),
        });
      }
      await challenges.revokeActive(input.principal.userId, occurredAt);
      const expiresAt = addSeconds(occurredAt, this.config.verificationTtlSeconds);
      const resendAvailableAt = addSeconds(occurredAt, this.config.resendCooldownSeconds);
      await challenges.create({
        id: challengeId,
        userId: input.principal.userId,
        codeHash,
        maxAttempts: this.config.maxVerificationAttempts,
        expiresAt,
        resendAvailableAt,
        createdAt: occurredAt,
      });
      const { security } = createTransactionalEventServices(database, occurredAt);
      await security.record({
        type: SECURITY_EVENT_TYPES.emailCodeRequested,
        actor: { type: "user", id: input.principal.userId, sessionId: input.principal.sessionId },
        target: { type: "email-verification", id: challengeId },
        metadata: { reason: "resend" },
      });
      return { email: profile.user.email, expiresAt, resendAvailableAt };
    });
    let deliveryAvailable = true;
    try {
      await this.emailProvider.sendVerificationCode({
        userId: input.principal.userId,
        email: result.email,
        code,
        expiresAt: result.expiresAt,
      });
    } catch {
      deliveryAvailable = false;
    }
    return { ...result, deliveryAvailable };
  }

  async verifyEmail(input: { principal: AuthenticatedPrincipal; code: string; now?: Date }) {
    const code = input.code.trim();
    if (!/^\d{6}$/u.test(code)) return { ok: false as const, code: "INVALID_CODE" as const };
    const outcome = await this.transactions.run(async ({ database, occurredAt }) => {
      const challenges = new PrismaEmailVerificationRepository(database);
      const challenge = await challenges.findLatest(input.principal.userId);
      const events = createTransactionalEventServices(database, occurredAt);
      const actor = { type: "user" as const, id: input.principal.userId, sessionId: input.principal.sessionId };
      if (!challenge) return { ok: false as const, code: "INVALID_CODE" as const };
      if (challenge.expiresAt.getTime() <= occurredAt.getTime()) {
        await challenges.revokeById(challenge.id, occurredAt);
        await events.security.record({
          type: SECURITY_EVENT_TYPES.emailVerificationFailed,
          actor,
          target: { type: "email-verification", id: challenge.id },
          metadata: { reason: "expired" },
        });
        return { ok: false as const, code: "EXPIRED_CODE" as const };
      }
      const valid = await this.codes.verify(challenge.id, code, challenge.codeHash);
      if (!valid) {
        const attempts = await challenges.incrementAttempt(challenge.id);
        const exhausted = attempts.attemptCount >= attempts.maxAttempts;
        if (exhausted) await challenges.revokeById(challenge.id, occurredAt);
        await events.security.record({
          type: SECURITY_EVENT_TYPES.emailVerificationFailed,
          actor,
          target: { type: "email-verification", id: challenge.id },
          metadata: { reason: exhausted ? "attempts_exhausted" : "invalid" },
        });
        return { ok: false as const, code: exhausted ? "ATTEMPTS_EXHAUSTED" as const : "INVALID_CODE" as const };
      }
      if ((await challenges.consume(challenge.id, input.principal.userId, occurredAt)).count !== 1) {
        return { ok: false as const, code: "INVALID_CODE" as const };
      }
      await challenges.revokeActive(input.principal.userId, occurredAt);
      await new PrismaUserProfileRepository(database).markContactVerified(input.principal.userId, occurredAt);
      await new PrismaOnboardingRepository(database).update(input.principal.userId, {
        status: "CONSENTS_PENDING",
      });
      await events.security.record({
        type: SECURITY_EVENT_TYPES.emailVerificationSucceeded,
        actor,
        target: { type: "email-verification", id: challenge.id },
        metadata: { method: "email_code" },
      });
      return { ok: true as const };
    });
    return outcome;
  }

  async getSnapshot(principal: AuthenticatedPrincipal, at = new Date()) {
    const profile = await new PrismaUserProfileRepository(this.database).findByUserId(principal.userId);
    const progress = await new PrismaOnboardingRepository(this.database).findByUserId(principal.userId);
    if (!profile || !progress) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
    const versions = await new PrismaConsentVersionRepository(this.database).listPublished({
      marketId: profile.market.id,
      language: profile.preferredLanguage,
      at,
    });
    const required = latestRequiredVersions(versions);
    const accepted = await new PrismaUserConsentRepository(this.database).listAcceptedVersionIds(
      principal.userId,
      required.map(({ id }) => id),
    );
    const latestChallenge = await new PrismaEmailVerificationRepository(this.database).findLatest(principal.userId);
    return {
      status: progress.status,
      profile,
      requiredConsents: required.map((version) => ({
        id: version.id,
        documentKey: version.consentDocument.key,
        title: version.consentDocument.title,
        version: version.version,
        contentHash: version.contentHash,
        accepted: accepted.some((item) => item.consentVersionId === version.id),
      })),
      resendAvailableAt: latestChallenge?.resendAvailableAt ?? null,
      redirectTo: this.resolveDestination(profile.productRole, progress.status, profile.accountStatus),
    };
  }

  async complete(input: {
    principal: AuthenticatedPrincipal;
    ageConfirmed: boolean;
    consentVersionIds: readonly string[];
    idempotencyKey: string;
  }) {
    requireIdempotencyKey(input.idempotencyKey);
    if (!input.ageConfirmed) throw new ApplicationError("VALIDATION", "Необходимо подтвердить совершеннолетие");
    const requestHash = hashCommandPayload({
      ageConfirmed: true,
      consentVersionIds: [...new Set(input.consentVersionIds)].sort(),
    });
    return this.transactions.run(async ({ database, occurredAt }) => {
      const idempotency = new PrismaIdempotencyRepository(database);
      const receipt = await idempotency.find("onboarding.complete", input.idempotencyKey);
      if (receipt) {
        if (receipt.actorId !== input.principal.userId || receipt.requestHash !== requestHash) {
          throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Команда завершения уже использована");
        }
        const progress = await new PrismaOnboardingRepository(database).findByUserId(input.principal.userId);
        if (!progress) throw new ApplicationError("NOT_FOUND", "Состояние onboarding не найдено");
        const profile = await new PrismaUserProfileRepository(database).findByUserId(input.principal.userId);
        if (!profile) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
        return { status: progress.status, redirectTo: this.resolveDestination(profile.productRole, progress.status, profile.accountStatus) };
      }

      const profiles = new PrismaUserProfileRepository(database);
      const profile = await profiles.findByUserId(input.principal.userId);
      if (!profile || profile.contactVerificationStatus !== "VERIFIED") {
        throw new ApplicationError("FORBIDDEN", "Сначала подтвердите электронную почту");
      }
      const versions = await new PrismaConsentVersionRepository(database).listPublished({
        marketId: profile.market.id,
        language: profile.preferredLanguage,
        at: occurredAt,
      });
      const required = latestRequiredVersions(versions);
      const requiredDocuments = await new PrismaConsentDocumentRepository(database).listRequired();
      const provided = new Set(input.consentVersionIds);
      if (required.length !== requiredDocuments.length || required.some(({ id }) => !provided.has(id))) {
        throw new ApplicationError("VALIDATION", "Не приняты актуальные обязательные согласия");
      }
      const consents = new PrismaUserConsentRepository(database);
      for (const version of required) {
        if (!(await consents.find(input.principal.userId, version.id))) {
          await consents.accept({
            userId: input.principal.userId,
            consentVersionId: version.id,
            source: "functional-integration-01",
            recordedAt: occurredAt,
          });
        }
      }
      const finalStatus = profile.productRole === "PARTNER" ? "PARTNER_APPROVAL_PENDING" : "COMPLETED";
      const accountStatus = profile.productRole === "PLAYER" ? "ACTIVE" : "PENDING";
      await profiles.setAccountStatus(input.principal.userId, accountStatus);
      await new PrismaOnboardingRepository(database).update(input.principal.userId, {
        status: finalStatus,
        ageConfirmedAt: occurredAt,
        profileReadyAt: occurredAt,
        completedAt: occurredAt,
      });
      const events = createTransactionalEventServices(database, occurredAt);
      await events.security.record({
        type: SECURITY_EVENT_TYPES.onboardingCompleted,
        actor: { type: "user", id: input.principal.userId, sessionId: input.principal.sessionId },
        target: { type: "user-profile", id: profile.id },
        metadata: {
          productRole: profile.productRole,
          outcome: profile.productRole === "PARTNER" ? "partner_approval_pending" : "completed",
        },
      });
      await idempotency.create({
        operation: "onboarding.complete",
        key: input.idempotencyKey,
        actorId: input.principal.userId,
        requestHash,
        resultType: "OnboardingProgress",
        resultId: input.principal.userId,
        createdAt: occurredAt,
      });
      return { status: finalStatus, redirectTo: profile.productRole === "PLAYER" ? "/dashboard" : "/partner" };
    });
  }

  resolveDestination(productRole: ProductRole, status: string, accountStatus: string) {
    if (["SUSPENDED", "CLOSED"].includes(accountStatus)) return "/access?state=restricted";
    if (status === "COMPLETED" && productRole === "PLAYER") return "/dashboard";
    if (["COMPLETED", "PARTNER_APPROVAL_PENDING"].includes(status) && productRole === "PARTNER") return "/partner";
    return "/access";
  }
}
