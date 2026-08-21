import "server-only";

import type { AuthenticatedPrincipal } from "@/lib/auth";
import {
  ApplicationError,
  createTransactionalEventServices,
  hashCommandPayload,
  PrismaTransactionRunner,
  requireApplicationAuthorization,
} from "@/lib/application";
import type { LanguageCode, MarketCode } from "@/lib/db/generated/client";
import type { PrismaClient } from "@/lib/db";
import { authorizationPolicies, authorizationRules } from "@/lib/policies";
import {
  PrismaConsentDocumentRepository,
  PrismaConsentVersionRepository,
  PrismaIdempotencyRepository,
  PrismaIdentityUserRepository,
  PrismaMarketRepository,
  PrismaPartnerProfileRepository,
  PrismaPlayerProfileRepository,
  PrismaUserConsentRepository,
  PrismaUserProfileRepository,
} from "@/lib/repositories";
import { validateCreateProfileInput } from "@/lib/validation";
import { avatarEmojiForVxId } from "@/lib/user-avatar";

const ownProfilePolicy = authorizationPolicies.all(
  "profile.self.manage",
  authorizationRules.authenticated(),
  authorizationRules.owner(),
);
const marketChangePolicy = authorizationPolicies.all(
  "profile.market.change",
  authorizationRules.authenticated(),
  authorizationRules.owner(),
  authorizationRules.permission(["profile.market.change"]),
);
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_.:-]{8,160}$/;

function requireIdempotencyKey(key: string) {
  if (!IDEMPOTENCY_KEY.test(key)) {
    throw new ApplicationError("VALIDATION", "Некорректный ключ идемпотентности");
  }
}

function authorizeSelf(principal: AuthenticatedPrincipal, policy = ownProfilePolicy) {
  requireApplicationAuthorization({ principal, policy, ownerId: principal.userId });
}

function verifyReceipt(
  receipt: { actorId: string; requestHash: string } | null,
  principal: AuthenticatedPrincipal,
  requestHash: string,
) {
  if (!receipt) return false;
  if (receipt.actorId !== principal.userId || receipt.requestHash !== requestHash) {
    throw new ApplicationError(
      "IDEMPOTENCY_CONFLICT",
      "Ключ идемпотентности уже использован для другой команды",
    );
  }
  return true;
}

function latestVersionsByDocument<
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

export class MarketApplicationService {
  constructor(private readonly database: PrismaClient) {}

  listActive() {
    return new PrismaMarketRepository(this.database).listActive();
  }
}

export class ProfileApplicationService {
  private readonly transactions: PrismaTransactionRunner;

  constructor(private readonly database: PrismaClient) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  createProfile(input: {
    principal: AuthenticatedPrincipal;
    idempotencyKey: string;
    profile: unknown;
  }) {
    requireIdempotencyKey(input.idempotencyKey);
    const profileInput = validateCreateProfileInput(input.profile);
    const requestHash = hashCommandPayload(profileInput);

    return this.transactions.run(async ({ database, occurredAt }) => {
      authorizeSelf(input.principal);
      const idempotency = new PrismaIdempotencyRepository(database);
      const receipt = await idempotency.find("profile.create", input.idempotencyKey);
      if (verifyReceipt(receipt, input.principal, requestHash)) {
        const replay = await new PrismaUserProfileRepository(database).findByUserId(input.principal.userId);
        if (!replay) throw new ApplicationError("CONFLICT", "Результат команды больше не существует");
        return replay;
      }

      const user = await new PrismaIdentityUserRepository(database).findSafeById(input.principal.userId);
      if (!user || user.disabledAt) throw new ApplicationError("NOT_FOUND", "Пользователь недоступен");
      const profileRepository = new PrismaUserProfileRepository(database);
      if (await profileRepository.findByUserId(input.principal.userId)) {
        throw new ApplicationError("CONFLICT", "Продуктовый профиль уже создан");
      }
      const market = await new PrismaMarketRepository(database).findActiveByCode(profileInput.marketCode);
      if (!market) throw new ApplicationError("VALIDATION", "Выбранный рынок сейчас недоступен");

      const profile = await profileRepository.create({
        userId: input.principal.userId,
        productRole: profileInput.productRole,
        marketId: market.id,
        preferredLanguage: profileInput.preferredLanguage,
      });
      if (profileInput.productRole === "PLAYER") {
        await new PrismaPlayerProfileRepository(database).createPending(profile.id);
        const avatarEmoji = avatarEmojiForVxId(user.vxId);
        if (avatarEmoji) await new PrismaIdentityUserRepository(database).assignPlayerAvatar(user.id, avatarEmoji);
      } else {
        await new PrismaPartnerProfileRepository(database).createPending(profile.id);
      }

      const result = await profileRepository.findByUserId(input.principal.userId);
      if (!result) throw new ApplicationError("CONFLICT", "Профиль не удалось подготовить");
      const { audit } = createTransactionalEventServices(database, occurredAt);
      await audit.record({
        actor: { type: "user", id: input.principal.userId, sessionId: input.principal.sessionId },
        action: "profile.created",
        target: { type: "user-profile", id: result.id },
        metadata: {
          productRole: result.productRole,
          market: result.market.code,
          preferredLanguage: result.preferredLanguage,
        },
      });
      await idempotency.create({
        operation: "profile.create",
        key: input.idempotencyKey,
        actorId: input.principal.userId,
        requestHash,
        resultType: "UserProfile",
        resultId: result.id,
        createdAt: occurredAt,
      });
      return result;
    });
  }

  updateLanguage(input: { principal: AuthenticatedPrincipal; preferredLanguage: LanguageCode }) {
    return this.transactions.run(async ({ database, occurredAt }) => {
      authorizeSelf(input.principal);
      if (!(["EN", "RU", "TR", "AZ"] as const).includes(input.preferredLanguage)) {
        throw new ApplicationError("VALIDATION", "Некорректный язык");
      }
      const result = await new PrismaUserProfileRepository(database).updateLanguage(
        input.principal.userId,
        input.preferredLanguage,
      );
      const { audit } = createTransactionalEventServices(database, occurredAt);
      await audit.record({
        actor: { type: "user", id: input.principal.userId, sessionId: input.principal.sessionId },
        action: "profile.language.changed",
        target: { type: "user-profile", id: result.id },
        metadata: { preferredLanguage: result.preferredLanguage },
      });
      return result;
    });
  }

  changeMarket(input: { principal: AuthenticatedPrincipal; marketCode: MarketCode }) {
    return this.transactions.run(async ({ database, occurredAt }) => {
      authorizeSelf(input.principal, marketChangePolicy);
      const market = await new PrismaMarketRepository(database).findActiveByCode(input.marketCode);
      if (!market) throw new ApplicationError("VALIDATION", "Выбранный рынок сейчас недоступен");
      const result = await new PrismaUserProfileRepository(database).changeMarket(
        input.principal.userId,
        market.id,
      );
      const { audit } = createTransactionalEventServices(database, occurredAt);
      await audit.record({
        actor: { type: "user", id: input.principal.userId, sessionId: input.principal.sessionId },
        action: "profile.market.changed",
        target: { type: "user-profile", id: result.id },
        metadata: { market: result.market.code },
      });
      return result;
    });
  }
}

export class ConsentApplicationService {
  private readonly transactions: PrismaTransactionRunner;

  constructor(private readonly database: PrismaClient) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  async listPublished(principal: AuthenticatedPrincipal, at = new Date()) {
    authorizeSelf(principal);
    const profile = await new PrismaUserProfileRepository(this.database).findByUserId(principal.userId);
    if (!profile) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
    return new PrismaConsentVersionRepository(this.database).listPublished({
      marketId: profile.market.id,
      language: profile.preferredLanguage,
      at,
    });
  }

  accept(input: {
    principal: AuthenticatedPrincipal;
    consentVersionId: string;
    idempotencyKey: string;
  }) {
    requireIdempotencyKey(input.idempotencyKey);
    const payload = { consentVersionId: input.consentVersionId };
    const requestHash = hashCommandPayload(payload);

    return this.transactions.run(async ({ database, occurredAt }) => {
      authorizeSelf(input.principal);
      const idempotency = new PrismaIdempotencyRepository(database);
      const receipt = await idempotency.find("consent.accept", input.idempotencyKey);
      if (verifyReceipt(receipt, input.principal, requestHash)) {
        const replay = await new PrismaUserConsentRepository(database).find(
          input.principal.userId,
          input.consentVersionId,
        );
        if (!replay) throw new ApplicationError("CONFLICT", "Результат команды больше не существует");
        return replay;
      }

      const profile = await new PrismaUserProfileRepository(database).findByUserId(input.principal.userId);
      if (!profile) throw new ApplicationError("NOT_FOUND", "Профиль не найден");
      const version = await new PrismaConsentVersionRepository(database).findPublishedById({
        id: input.consentVersionId,
        marketId: profile.market.id,
        language: profile.preferredLanguage,
        at: occurredAt,
      });
      if (!version) throw new ApplicationError("VALIDATION", "Версия согласия недоступна для профиля");

      const consents = new PrismaUserConsentRepository(database);
      const existing = await consents.find(input.principal.userId, version.id);
      const result =
        existing ??
        (await consents.accept({
          userId: input.principal.userId,
          consentVersionId: version.id,
          source: "identity-profile-consent-service",
          recordedAt: occurredAt,
        }));

      if (!existing) {
        const { audit } = createTransactionalEventServices(database, occurredAt);
        await audit.record({
          actor: { type: "user", id: input.principal.userId, sessionId: input.principal.sessionId },
          action: "consent.accepted",
          target: { type: "consent-version", id: version.id },
          metadata: { documentKey: version.consentDocument.key, version: version.version },
        });
      }
      await idempotency.create({
        operation: "consent.accept",
        key: input.idempotencyKey,
        actorId: input.principal.userId,
        requestHash,
        resultType: "UserConsent",
        resultId: result.id,
        createdAt: occurredAt,
      });
      return result;
    });
  }

  async hasAcceptedRequired(principal: AuthenticatedPrincipal, at = new Date()) {
    authorizeSelf(principal);
    const profile = await new PrismaUserProfileRepository(this.database).findByUserId(principal.userId);
    if (!profile) return false;
    const versions = await new PrismaConsentVersionRepository(this.database).listPublished({
      marketId: profile.market.id,
      language: profile.preferredLanguage,
      at,
    });
    const required = latestVersionsByDocument(versions);
    const requiredDocuments = await new PrismaConsentDocumentRepository(this.database).listRequired();
    if (required.length !== requiredDocuments.length) return false;
    const accepted = await new PrismaUserConsentRepository(this.database).listAcceptedVersionIds(
      principal.userId,
      required.map((version) => version.id),
    );
    return accepted.length === required.length;
  }
}
