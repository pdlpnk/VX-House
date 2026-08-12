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
import type { DatabaseClient, PrismaClient } from "@/lib/db";
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
import { createLogger } from "@/lib/logger";
import { createProductNotification } from "./product-notification";
import { fromDatabaseLanguage } from "@/lib/i18n";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_.:-]{8,160}$/;
const logger = createLogger({ level: "info", context: { component: "identity-onboarding" } });

export interface IdentityOnboardingConfig {
  readonly sessionIdleTtlSeconds: number;
  readonly sessionAbsoluteTtlSeconds: number;
  readonly verificationTtlSeconds: number;
  readonly resendCooldownSeconds: number;
  readonly maxVerificationAttempts: number;
  readonly maxActiveChallenges: number;
}

export interface IdentityAnalyticsHooks {
  linkAnonymousSession(database: DatabaseClient, input: { anonymousId?: string | null; userId: string; email: string; productRole: ProductRole; occurredAt: Date }): Promise<unknown>;
  recordEmailConfirmed(database: DatabaseClient, input: { userId: string; authSessionId: string; occurredAt: Date }): Promise<unknown>;
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
    private readonly analytics?: IdentityAnalyticsHooks,
  ) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  async register(input: {
    command: unknown;
    idempotencyKey: string;
    now?: Date;
    correlationId?: string;
    analyticsAnonymousId?: string | null;
  }) {
    await this.purgeExpiredUnverifiedAccounts();
    const correlationId = input.correlationId ?? randomUUID();
    logger.info("registration_started", { correlationId });
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
        const existingUser = await new PrismaIdentityUserRepository(database).findSafeById(receipt.actorId);
        if (!existingUser) throw new ApplicationError("CONFLICT", "Регистрация недоступна");
        const existingProfile = await new PrismaUserProfileRepository(database).findByUserId(receipt.actorId);
        const session = await new PrismaAuthRepository(database).createSession({
          userId: receipt.actorId,
          tokenHash: token.hash,
          expiresAt: addSeconds(occurredAt, this.config.sessionIdleTtlSeconds),
          absoluteExpiresAt: addSeconds(occurredAt, this.config.sessionAbsoluteTtlSeconds),
        });
        await this.analytics?.linkAnonymousSession(database, { anonymousId: input.analyticsAnonymousId, userId: receipt.actorId, email: existingUser.email, productRole: command.productRole, occurredAt });
        return {
          userId: receipt.actorId,
          user: existingUser,
          session,
          profile: existingProfile as NonNullable<typeof existingProfile>,
          replayed: true,
        };
      }

      const users = new PrismaIdentityUserRepository(database);
      if (await users.findSafeByEmail(normalizedEmail)) {
        throw new ApplicationError("CONFLICT", "Не удалось создать доступ с указанными данными");
      }
      const user = await users.create({
        id: randomUUID(),
        email: normalizedEmail,
        displayName: command.displayName,
        passwordHash,
        createdAt: occurredAt,
      });
      logger.info("user_created", { correlationId, userId: user.id });
      const profiles = new PrismaUserProfileRepository(database);
      const market = await new PrismaMarketRepository(database).findActiveByCode(command.marketCode);
      if (!market) throw new ApplicationError("VALIDATION", "Выбранный рынок сейчас недоступен");
      const profile = await profiles.create({
        userId: user.id,
        productRole: command.productRole,
        marketId: market.id,
        preferredLanguage: command.preferredLanguage,
      });
      logger.info("profile_created", { correlationId, userId: user.id, productRole: command.productRole });
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
      logger.info("session_created", { correlationId, userId: user.id, sessionId: session.sessionId });
      const events = createTransactionalEventServices(database, occurredAt);
      const actor = { type: "user" as const, id: user.id, sessionId: session.sessionId };
      await events.security.record({
        type: SECURITY_EVENT_TYPES.registrationCreated,
        actor,
        target: { type: "user", id: user.id },
        metadata: {
          productRole: command.productRole,
          market: command.marketCode,
        },
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
      await this.analytics?.linkAnonymousSession(database, { anonymousId: input.analyticsAnonymousId, userId: user.id, email: normalizedEmail, productRole: command.productRole, occurredAt });
      shouldDeliverCode = true;
      const safeProfile = await profiles.findByUserId(user.id);
      return {
        userId: user.id,
        user,
        session,
        profile: safeProfile as NonNullable<typeof safeProfile>,
        replayed: false,
        expiresAt,
      };
    });
    logger.info("registration_committed", {
      correlationId,
      userId: result.userId,
      replayed: result.replayed,
    });

    let deliveryAvailable = true;
    if (shouldDeliverCode && "expiresAt" in result) {
      try {
        await this.emailProvider.sendVerificationCode({
          idempotencyKey: challengeId,
          userId: result.userId,
          email: normalizedEmail,
          code: verificationCode,
          expiresAt: result.expiresAt!,
          language: fromDatabaseLanguage(command.preferredLanguage),
        });
      } catch {
        logger.warn("verification_email_delivery_failed", { correlationId, userId: result.userId });
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

  async purgeExpiredUnverifiedAccounts(now = new Date()) {
    const cutoff = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const candidates = await this.database.user.findMany({
      where: {
        createdAt: { lt: cutoff },
        onboardingProgress: { status: { in: ["ACCOUNT_CREATED", "CONTACT_PENDING"] } },
        supportConversations: { none: {} },
      },
      select: { id: true },
      take: 250,
    });
    if (!candidates.length) return 0;
    const ids = candidates.map(({ id }) => id);
    const result = await this.transactions.run(async ({ database }) => {
      await database.idempotencyRecord.deleteMany({ where: { actorId: { in: ids } } });
      return database.user.deleteMany({ where: { id: { in: ids } } });
    });
    logger.info("expired_unverified_accounts_removed", { count: result.count });
    return result.count;
  }

  async requestVerificationCode(input: { principal: AuthenticatedPrincipal; now?: Date }) {
    const challengeId = randomUUID();
    const code = createVerificationCode();
    const codeHash = await this.codes.hash(challengeId, code);
    const result = await this.transactions.run(async ({ database, occurredAt }) => {
      const user = await new PrismaIdentityUserRepository(database).findSafeById(input.principal.userId);
      if (!user) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
      const profile = await new PrismaUserProfileRepository(database).findByUserId(input.principal.userId);
      const progress = await new PrismaOnboardingRepository(database).findByUserId(input.principal.userId);
      if (profile?.contactVerificationStatus === "VERIFIED" || progress?.status !== "CONTACT_PENDING") {
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
      return { email: user.email, expiresAt, resendAvailableAt, language: fromDatabaseLanguage(profile?.preferredLanguage) };
    });
    let deliveryAvailable = true;
    try {
      await this.emailProvider.sendVerificationCode({
        idempotencyKey: challengeId,
        userId: input.principal.userId,
        email: result.email,
        code,
        expiresAt: result.expiresAt,
        language: result.language,
      });
    } catch {
      logger.warn("verification_email_delivery_failed", {
        userId: input.principal.userId,
        reason: "resend",
      });
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
      const profile = await new PrismaUserProfileRepository(database).findByUserId(input.principal.userId);
      if (profile) {
        await new PrismaUserProfileRepository(database).markContactVerified(input.principal.userId, occurredAt);
        await createProductNotification(database, {
          userId: input.principal.userId,
          type: "identity.email_verified",
          title: "Электронная почта подтверждена",
          body: "Спасибо! Ваш аккаунт подтверждён.",
          relatedType: "USER_PROFILE",
          relatedId: profile.id,
          idempotencyKey: `email-verified:${challenge.id}`,
          actorId: input.principal.userId,
          occurredAt,
          systemMessage: { key: "system.emailVerified" },
        });
      }
      await new PrismaOnboardingRepository(database).update(input.principal.userId, {
        status: profile ? "CONSENTS_PENDING" : "CONTACT_VERIFIED",
      });
      await events.security.record({
        type: SECURITY_EVENT_TYPES.emailVerificationSucceeded,
        actor,
        target: { type: "email-verification", id: challenge.id },
        metadata: { method: "email_code" },
      });
      await this.analytics?.recordEmailConfirmed(database, {
        userId: input.principal.userId,
        authSessionId: input.principal.sessionId,
        occurredAt,
      });
      return { ok: true as const };
    });
    return outcome;
  }

  async getSnapshot(principal: AuthenticatedPrincipal, at = new Date()) {
    await this.purgeExpiredUnverifiedAccounts(at);
    const user = await new PrismaIdentityUserRepository(this.database).findSafeById(principal.userId);
    const profile = await new PrismaUserProfileRepository(this.database).findByUserId(principal.userId);
    const progress = await new PrismaOnboardingRepository(this.database).findByUserId(principal.userId);
    if (!user || !progress) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
    if (!profile) {
      const latestChallenge = await new PrismaEmailVerificationRepository(this.database).findLatest(principal.userId);
      return {
        status: progress.status,
        user,
        profile: null,
        requiredConsents: [],
        resendAvailableAt: latestChallenge?.resendAvailableAt ?? null,
        redirectTo: "/access",
      };
    }
    const consentVersions = new PrismaConsentVersionRepository(this.database);
    let versions = await consentVersions.listPublished({
      marketId: profile.market.id,
      language: profile.preferredLanguage,
      at,
    });
    if (!versions.length && profile.preferredLanguage === "EN") {
      versions = await consentVersions.listPublished({
        marketId: profile.market.id,
        language: profile.market.defaultLanguage,
        at,
      });
    }
    const required = latestRequiredVersions(versions);
    const accepted = await new PrismaUserConsentRepository(this.database).listAcceptedVersionIds(
      principal.userId,
      required.map(({ id }) => id),
    );
    const latestChallenge = await new PrismaEmailVerificationRepository(this.database).findLatest(principal.userId);
    return {
      status: progress.status,
      user,
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
      const consentVersions = new PrismaConsentVersionRepository(database);
      let versions = await consentVersions.listPublished({
        marketId: profile.market.id,
        language: profile.preferredLanguage,
        at: occurredAt,
      });
      if (!versions.length && profile.preferredLanguage === "EN") {
        versions = await consentVersions.listPublished({
          marketId: profile.market.id,
          language: profile.market.defaultLanguage,
          at: occurredAt,
        });
      }
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
      await createProductNotification(database, {
        userId: input.principal.userId,
        type: "onboarding.completed",
        title: "Пространство VX House открыто",
        body: profile.productRole === "PLAYER"
          ? "Теперь можно знакомиться с возможностями и выполнять задания."
          : "Профиль передан на проверку. Менеджер сообщит о следующем шаге здесь.",
        relatedType: "ONBOARDING",
        relatedId: input.principal.userId,
        idempotencyKey: `onboarding-completed:${input.principal.userId}`,
        actorId: input.principal.userId,
        occurredAt,
        systemMessage: { key: profile.productRole === "PLAYER" ? "system.managerReady" : "system.onboardingPartner" },
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
