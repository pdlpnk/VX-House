import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { PasswordResetCookieManager, SessionTokenManager, VerificationCodeHasher } from "../lib/auth/index.ts";
import { hashPassword, verifyPassword } from "../lib/auth/password.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { PasswordResetService, type EmailProvider, type PasswordResetEmail } from "../lib/services/index.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;

class CaptureResetEmailProvider implements EmailProvider {
  messages: PasswordResetEmail[] = [];
  async sendVerificationCode() {}
  async sendPasswordResetCode(message: PasswordResetEmail) { this.messages.push(message); }
}

let mail: CaptureResetEmailProvider;
let service: PasswordResetService;

beforeEach(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "AuditEvent", "User", "Market" CASCADE');
  const market = await database.market.create({ data: { code: "TR", name: "Türkiye", defaultLanguage: "TR", isActive: true } });
  const user = await database.user.create({ data: { email: "reset@example.com", displayName: "Reset User", passwordHash: await hashPassword("old-password") } });
  await database.$transaction(async (tx) => {
    const profile = await tx.userProfile.create({ data: { userId: user.id, marketId: market.id, productRole: "PLAYER", preferredLanguage: "TR" } });
    await tx.playerProfile.create({ data: { userProfileId: profile.id } });
  });
  await database.session.create({ data: { userId: user.id, tokenHash: `session-${randomUUID()}`, expiresAt: new Date(Date.now() + 60_000), absoluteExpiresAt: new Date(Date.now() + 120_000) } });
  mail = new CaptureResetEmailProvider();
  service = new PasswordResetService(
    database,
    new VerificationCodeHasher("test-password-reset-code-secret-long-enough"),
    new SessionTokenManager("test-password-reset-session-secret-long-enough"),
    new PasswordResetCookieManager(false),
    mail,
    { ttlSeconds: 600, resetProofTtlSeconds: 600, resendCooldownSeconds: 60, maxAttempts: 3 },
  );
});

after(async () => database.$disconnect());

test("существующий и неизвестный email получают одинаковый нейтральный ответ", async () => {
  assert.deepEqual(await service.request({ email: "reset@example.com", language: "en" }), { accepted: true, cooldownSeconds: 60 });
  assert.deepEqual(await service.request({ email: "missing@example.com", language: "en" }), { accepted: true, cooldownSeconds: 60 });
  assert.equal(mail.messages.length, 1);
  assert.equal(mail.messages[0]?.language, "tr");
});

test("cooldown не создаёт второй challenge и не раскрывается клиенту", async () => {
  await service.request({ email: "reset@example.com", language: "en" });
  await service.request({ email: "reset@example.com", language: "en" });
  assert.equal(mail.messages.length, 1);
  assert.equal(await database.passwordResetChallenge.count(), 1);
});

test("неверные попытки ограничены, истёкший код отклоняется", async () => {
  await service.request({ email: "reset@example.com" });
  assert.deepEqual(await service.verify({ email: "reset@example.com", code: "000000" }), { ok: false, code: "INVALID_CODE" });
  assert.deepEqual(await service.verify({ email: "reset@example.com", code: "000001" }), { ok: false, code: "INVALID_CODE" });
  assert.deepEqual(await service.verify({ email: "reset@example.com", code: "000002" }), { ok: false, code: "ATTEMPTS_EXHAUSTED" });
  await database.passwordResetChallenge.updateMany({ data: { revokedAt: null, attemptCount: 0, expiresAt: new Date("2020-01-01") } });
  assert.deepEqual(await service.verify({ email: "reset@example.com", code: mail.messages[0]!.code }), { ok: false, code: "EXPIRED_CODE" });
});

test("одноразовый proof меняет hash, отзывает сессии и не используется повторно", async () => {
  await service.request({ email: "reset@example.com" });
  const verified = await service.verify({ email: "reset@example.com", code: mail.messages[0]!.code });
  assert.equal(verified.ok, true);
  if (!verified.ok) return;
  const token = /vx_house_password_reset=([^;]+)/u.exec(verified.setCookie)?.[1] ?? null;
  assert.ok(token);
  await assert.rejects(service.complete({ token, password: "short", passwordConfirmation: "short" }), (error: unknown) => error instanceof Error && "code" in error && error.code === "VALIDATION");
  await assert.rejects(service.complete({ token, password: "new-password", passwordConfirmation: "other-password" }));
  const result = await service.complete({ token, password: "new-password", passwordConfirmation: "new-password" });
  assert.equal(result.sessionsRevoked, 1);
  const user = await database.user.findUniqueOrThrow({ where: { email: "reset@example.com" } });
  assert.equal(await verifyPassword("new-password", user.passwordHash), true);
  assert.equal(await verifyPassword("old-password", user.passwordHash), false);
  assert.equal(await database.session.count({ where: { userId: user.id, revokedAt: null } }), 0);
  await assert.rejects(service.complete({ token, password: "another-password", passwordConfirmation: "another-password" }));
  assert.deepEqual(await service.verify({ email: "reset@example.com", code: mail.messages[0]!.code }), { ok: false, code: "INVALID_CODE" });
});
