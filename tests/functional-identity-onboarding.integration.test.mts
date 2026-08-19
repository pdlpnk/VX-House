import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { ApplicationError } from "../lib/application/index.ts";
import { decideProductWorkspaceAccess, SessionCookieManager, SessionTokenManager, VerificationCodeHasher, type AuthenticatedPrincipal } from "../lib/auth/index.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { PrismaAuthRepository, PrismaRateLimitRepository } from "../lib/repositories/index.ts";
import { AuthenticationService, IdentityOnboardingService, RateLimitService, type EmailProvider, type VerificationEmail } from "../lib/services/index.ts";
import { EnvironmentValidationError, validateEnvironment } from "../lib/validation/index.ts";
import { AnalyticsService } from "../lib/analytics/service.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;
const tokens = new SessionTokenManager("test-session-secret-functional-module-one-000000000000000");
const cookies = new SessionCookieManager({ secure: false, maxAgeSeconds: 3600 });

class CaptureEmailProvider implements EmailProvider {
  messages: VerificationEmail[] = [];
  async sendVerificationCode(message: VerificationEmail) { this.messages.push(message); }
  latest(userId: string) { return this.messages.findLast((message) => message.userId === userId); }
}

let mail: CaptureEmailProvider;
let service: IdentityOnboardingService;

async function seed() {
  const documents = new Map<string, { id: string }>();
  for (const [key, title] of [["terms", "Условия использования"], ["privacy", "Политика конфиденциальности"]] as const) {
    documents.set(key, await database.consentDocument.create({ data: { key, title, isRequired: true }, select: { id: true } }));
  }
  for (const [code, name, defaultLanguage] of [["TR", "Турция", "TR"], ["AZ", "Азербайджан", "AZ"]] as const) {
    const market = await database.market.create({ data: { code, name, defaultLanguage, isActive: true } });
    for (const key of ["terms", "privacy"] as const) {
      const document = documents.get(key)!;
      await database.consentVersion.create({ data: { consentDocumentId: document.id, marketId: market.id, language: "RU", version: 1, contentHash: `${key}${code}`.padEnd(64, "0"), publishedAt: new Date("2026-01-01"), effectiveFrom: new Date("2026-01-01") } });
    }
  }
}

beforeEach(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "ConversionDelivery", "AnalyticsEvent", "AnalyticsSession", "AuditEvent", "User", "Market", "ConsentDocument" CASCADE');
  await seed();
  mail = new CaptureEmailProvider();
  service = new IdentityOnboardingService(database, tokens, cookies, new VerificationCodeHasher("test-email-code-secret-functional-module-one"), mail, { sessionIdleTtlSeconds: 3600, sessionAbsoluteTtlSeconds: 86400, verificationTtlSeconds: 600, resendCooldownSeconds: 30, maxVerificationAttempts: 3, maxActiveChallenges: 1 }, new AnalyticsService(database, { enabled: false, requestTimeoutMs: 500, maxRetries: 5 }));
});

after(async () => database.$disconnect());

async function register(
  role: "PLAYER" | "PARTNER" = "PLAYER",
  email = `${randomUUID()}@test.invalid`,
  preferredLanguage: "EN" | "RU" | "TR" | "AZ" = "RU",
) {
  const result = await service.register({ command: { displayName: "Тестовый пользователь", email, password: "correct horse battery staple", productRole: role, marketCode: "TR", preferredLanguage }, idempotencyKey: `register-${randomUUID()}` });
  const principal: AuthenticatedPrincipal = { userId: result.userId, sessionId: result.session.sessionId, roleKeys: ["authenticated"], permissionKeys: [] };
  return { result, principal, code: mail.latest(result.userId)!.code };
}

test("регистрация игрока атомарно создаёт identity, профиль, onboarding, challenge и audit", async () => {
  const { result } = await register("PLAYER", undefined, "EN");
  assert.equal(result.profile.productRole, "PLAYER");
  assert.equal(result.profile.preferredLanguage, "EN");
  assert.equal(result.profile.playerProfile?.participationStatus, "PENDING");
  assert.equal(mail.latest(result.userId)?.language, "en");
  assert.equal(await database.session.count({ where: { userId: result.userId } }), 1);
  assert.equal(await database.auditEvent.count({ where: { actorId: result.userId } }), 2);
  const challenge = await database.emailVerificationChallenge.findFirstOrThrow({ where: { userId: result.userId } });
  assert.equal(challenge.expiresAt.getTime() - challenge.createdAt.getTime(), 600_000);
});

test("регистрация партнёра создаёт только pending-профиль партнёра", async () => {
  const { result } = await register("PARTNER");
  assert.equal(result.profile.partnerProfile?.status, "PENDING");
  assert.equal(result.profile.playerProfile, null);
});

test("ошибка доставки не откатывает целостный pending-аккаунт и не активирует его", async () => {
  const unavailable: EmailProvider = {
    async sendVerificationCode() { throw new Error("provider unavailable"); },
  };
  const isolated = new IdentityOnboardingService(
    database,
    tokens,
    cookies,
    new VerificationCodeHasher("test-email-code-secret-functional-module-one"),
    unavailable,
    { sessionIdleTtlSeconds: 3600, sessionAbsoluteTtlSeconds: 86400, verificationTtlSeconds: 600, resendCooldownSeconds: 30, maxVerificationAttempts: 3, maxActiveChallenges: 1 },
  );
  const result = await isolated.register({
    command: { displayName: "Ожидающий пользователь", email: `${randomUUID()}@test.invalid`, password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
    idempotencyKey: `register-${randomUUID()}`,
  });
  assert.equal(result.deliveryAvailable, false);
  const persisted = await database.user.findUniqueOrThrow({
    where: { id: result.userId },
    include: { profile: { include: { playerProfile: true } }, onboardingProgress: true, emailVerificationChallenges: true },
  });
  assert.equal(persisted.onboardingProgress?.status, "CONTACT_PENDING");
  assert.equal(persisted.profile?.contactVerificationStatus, "UNVERIFIED");
  assert.equal(persisted.profile?.playerProfile?.participationStatus, "PENDING");
  assert.equal(persisted.emailVerificationChallenges.length, 1);
});

test("неподтверждённый аккаунт старше 12 часов удаляется полностью", async () => {
  const result = await service.register({
    command: { displayName: "Просроченный участник", email: `${randomUUID()}@test.invalid`, password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
    idempotencyKey: `register-${randomUUID()}`,
  });
  await database.user.update({ where: { id: result.userId }, data: { createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) } });
  assert.equal(await service.purgeExpiredUnverifiedAccounts(), 1);
  assert.equal(await database.user.count({ where: { id: result.userId } }), 0);
});

test("регистрация нового пользователя не удаляет чужой просроченный pending-аккаунт", async () => {
  const existing = await service.register({
    command: { displayName: "Существующий участник", email: `${randomUUID()}@test.invalid`, password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
    idempotencyKey: `register-${randomUUID()}`,
  });
  await database.user.update({ where: { id: existing.userId }, data: { createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) } });

  await service.register({
    command: { displayName: "Новый участник", email: `${randomUUID()}@test.invalid`, password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
    idempotencyKey: `register-${randomUUID()}`,
  });

  assert.equal(await database.user.count({ where: { id: existing.userId } }), 1);
});

test("очистка не блокирует auth, если у pending-аккаунта уже есть Messenger-диалог", async () => {
  const result = await service.register({
    command: { displayName: "Pending with conversation", email: `${randomUUID()}@test.invalid`, password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "EN" },
    idempotencyKey: `register-${randomUUID()}`,
  });
  await database.user.update({ where: { id: result.userId }, data: { createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) } });
  const category = await database.supportCategory.create({
    data: { key: `personal-${randomUUID()}`, title: "Personal manager", description: "Permanent conversation", roles: ["PLAYER"], isActive: true },
  });
  await database.supportConversation.create({
    data: { userId: result.userId, category: category.key, subject: "VX House Manager", context: { personalConversation: true } },
  });

  assert.equal(await service.purgeExpiredUnverifiedAccounts(), 0);
  assert.equal(await database.user.count({ where: { id: result.userId } }), 1);
});

test("очистка не пытается удалить pending-аккаунт с append-only аналитикой", async () => {
  const result = await service.register({
    command: { displayName: "Pending with analytics", email: `${randomUUID()}@test.invalid`, password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "EN" },
    idempotencyKey: `register-${randomUUID()}`,
  });
  await database.user.update({ where: { id: result.userId }, data: { createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) } });
  await database.analyticsEvent.create({
    data: {
      eventName: "REGISTRATION_STARTED",
      userId: result.userId,
      metadata: {},
      idempotencyKey: `expired-registration-${result.userId}`,
    },
  });

  assert.equal(await service.purgeExpiredUnverifiedAccounts(), 0);
  assert.equal(await database.user.count({ where: { id: result.userId } }), 1);
});

test("дубликат email и неизвестные поля отклоняются без частичной записи", async () => {
  const email = `${randomUUID()}@test.invalid`; await register("PLAYER", email);
  await assert.rejects(register("PARTNER", email), (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT");
  const count = await database.user.count();
  await assert.rejects(service.register({ command: { displayName: "Имя", email: "bad", password: "correct horse battery staple", productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU", roles: ["admin"] }, idempotencyKey: `register-${randomUUID()}` }), ApplicationError);
  assert.equal(await database.user.count(), count);
});

test("корректный одноразовый код подтверждает контакт и переводит к согласиям", async () => {
  const { principal, code } = await register();
  assert.deepEqual(await service.verifyEmail({ principal, code }), { ok: true });
  const snapshot = await service.getSnapshot(principal);
  assert.equal(snapshot.status, "CONSENTS_PENDING");
  assert.equal(snapshot.profile!.contactVerificationStatus, "VERIFIED");
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "EMAIL_CONFIRMED" } }), 1);
});

test("неверный код ограничен числом попыток и не подтверждает профиль", async () => {
  const { principal } = await register();
  assert.equal((await service.verifyEmail({ principal, code: "000000" })).ok, false);
  assert.equal((await service.verifyEmail({ principal, code: "000001" })).ok, false);
  assert.deepEqual(await service.verifyEmail({ principal, code: "000002" }), { ok: false, code: "ATTEMPTS_EXHAUSTED" });
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "EMAIL_CONFIRMED" } }), 0);
});

test("истёкший и уже использованный код не принимаются", async () => {
  const first = await register();
  await database.emailVerificationChallenge.updateMany({ where: { userId: first.result.userId }, data: { createdAt: new Date("2020-01-01T00:00:00Z"), resendAvailableAt: new Date("2020-01-01T00:00:30Z"), expiresAt: new Date("2020-01-01T00:10:00Z") } });
  assert.deepEqual(await service.verifyEmail({ principal: first.principal, code: first.code }), { ok: false, code: "EXPIRED_CODE" });
  const second = await register(); await service.verifyEmail({ principal: second.principal, code: second.code });
  assert.deepEqual(await service.verifyEmail({ principal: second.principal, code: second.code }), { ok: false, code: "INVALID_CODE" });
});

test("повторная отправка соблюдает cooldown и аннулирует прежний challenge", async () => {
  const created = await register();
  await assert.rejects(service.requestVerificationCode({ principal: created.principal }), (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT");
  await database.emailVerificationChallenge.updateMany({ where: { userId: created.result.userId }, data: { resendAvailableAt: new Date() } });
  await service.requestVerificationCode({ principal: created.principal });
  assert.equal((await service.verifyEmail({ principal: created.principal, code: created.code })).ok, false);
  assert.equal((await service.verifyEmail({ principal: created.principal, code: mail.latest(created.result.userId)!.code })).ok, true);
});

test("onboarding нельзя завершить до подтверждения email или без всех текущих согласий", async () => {
  const created = await register();
  await assert.rejects(service.complete({ principal: created.principal, ageConfirmed: true, consentVersionIds: [], idempotencyKey: `complete-${randomUUID()}` }), (error: unknown) => error instanceof ApplicationError && error.code === "FORBIDDEN");
  await service.verifyEmail({ principal: created.principal, code: created.code });
  const snapshot = await service.getSnapshot(created.principal);
  await assert.rejects(service.complete({ principal: created.principal, ageConfirmed: false, consentVersionIds: snapshot.requiredConsents.map(({ id }) => id), idempotencyKey: `complete-${randomUUID()}` }), ApplicationError);
  await assert.rejects(service.complete({ principal: created.principal, ageConfirmed: true, consentVersionIds: snapshot.requiredConsents.slice(0, 1).map(({ id }) => id), idempotencyKey: `complete-${randomUUID()}` }), ApplicationError);
});

test("игрок завершает onboarding в активном состоянии и получает маршрут dashboard", async () => {
  const created = await register(); await service.verifyEmail({ principal: created.principal, code: created.code });
  const snapshot = await service.getSnapshot(created.principal);
  const result = await service.complete({ principal: created.principal, ageConfirmed: true, consentVersionIds: snapshot.requiredConsents.map(({ id }) => id), idempotencyKey: `complete-${randomUUID()}` });
  assert.equal(result.redirectTo, "/dashboard"); assert.equal(result.status, "COMPLETED");
});

test("партнёр после onboarding остаётся в состоянии ручного одобрения", async () => {
  const created = await register("PARTNER"); await service.verifyEmail({ principal: created.principal, code: created.code });
  const snapshot = await service.getSnapshot(created.principal);
  const result = await service.complete({ principal: created.principal, ageConfirmed: true, consentVersionIds: snapshot.requiredConsents.map(({ id }) => id), idempotencyKey: `complete-${randomUUID()}` });
  assert.equal(result.redirectTo, "/partner"); assert.equal(result.status, "PARTNER_APPROVAL_PENDING");
});

test("новая обязательная версия согласия снова блокирует полную актуальность", async () => {
  const created = await register(); await service.verifyEmail({ principal: created.principal, code: created.code });
  const before = await service.getSnapshot(created.principal);
  const first = await database.consentVersion.findFirstOrThrow({ where: { id: before.requiredConsents[0]!.id } });
  await database.consentVersion.create({ data: { consentDocumentId: first.consentDocumentId, marketId: first.marketId, language: first.language, version: 2, contentHash: "f".repeat(64), publishedAt: new Date(), effectiveFrom: new Date() } });
  const after = await service.getSnapshot(created.principal);
  assert.notEqual(after.requiredConsents.find((item) => item.documentKey === before.requiredConsents[0]!.documentKey)!.id, before.requiredConsents[0]!.id);
});

test("server route decision блокирует незавершённый и неверный role workspace", () => {
  assert.deepEqual(decideProductWorkspaceAccess({ requestedRole: "PLAYER", actualRole: "PLAYER", onboardingStatus: "CONTACT_PENDING", accountStatus: "PENDING", onboardingRedirectTo: "/access" }), { allowed: false, redirectTo: "/access", reason: "ONBOARDING_INCOMPLETE" });
  assert.deepEqual(decideProductWorkspaceAccess({ requestedRole: "PARTNER", actualRole: "PLAYER", onboardingStatus: "COMPLETED", accountStatus: "ACTIVE", onboardingRedirectTo: "/dashboard" }), { allowed: false, redirectTo: "/dashboard", reason: "PRODUCT_ROLE_MISMATCH" });
  assert.deepEqual(decideProductWorkspaceAccess({ requestedRole: "PLAYER", actualRole: "PLAYER", onboardingStatus: "COMPLETED", accountStatus: "ACTIVE", onboardingRedirectTo: "/dashboard" }), { allowed: true });
});

test("login, refresh и logout управляют серверной session lifecycle", async () => {
  const created = await register();
  const auth = new AuthenticationService(new PrismaAuthRepository(database), tokens, cookies, { sessionIdleTtlSeconds: 3600, sessionAbsoluteTtlSeconds: 86400, sessionRefreshAfterSeconds: 0 });
  const login = await auth.login({ email: created.result.user.email, password: "correct horse battery staple" });
  assert.equal(login.ok, true); if (!login.ok) return;
  const token = login.setCookie.match(/vx_house_session=([^;]+)/)![1]!;
  const refreshed = await auth.refresh(token); assert.equal(refreshed.ok, true);
  await auth.logout(token);
  assert.equal((await auth.authenticate(token)).ok, false);
});

test("audit не содержит пароль или одноразовый код", async () => {
  const created = await register();
  const serialized = JSON.stringify(await database.auditEvent.findMany({ where: { actorId: created.result.userId } }));
  assert.equal(serialized.includes("correct horse battery staple"), false);
  assert.equal(serialized.includes(created.code), false);
});

test("durable rate limiting блокирует превышение лимита", async () => {
  const limiter = new RateLimitService(new PrismaRateLimitRepository(database), "test-rate-limit-secret-functional-module-one");
  assert.equal((await limiter.consume("identity.test", "same-source", { limit: 2, windowSeconds: 60 })).allowed, true);
  assert.equal((await limiter.consume("identity.test", "same-source", { limit: 2, windowSeconds: 60 })).allowed, true);
  assert.equal((await limiter.consume("identity.test", "same-source", { limit: 2, windowSeconds: 60 })).allowed, false);
});

test("production конфигурация запрещает development transport кода", () => {
  assert.throws(() => validateEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgresql://user:pass@db.example.com/app?sslmode=require", SESSION_SECRET: "s".repeat(40), RATE_LIMIT_SECRET: "r".repeat(40), DATA_PROTECTION_KEY_ID: "prod.primary", DATA_PROTECTION_KEY: "A".repeat(43), EMAIL_VERIFICATION_SECRET: "e".repeat(40), EMAIL_PROVIDER: "development" }), (error: unknown) => error instanceof EnvironmentValidationError && error.issues.some((issue) => issue.includes("development transport запрещён")));
});
