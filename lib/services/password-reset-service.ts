import "server-only";

import { randomUUID } from "node:crypto";

import {
  createVerificationCode,
  normalizeEmail,
  type PasswordResetCookieManager,
  type SessionTokenManager,
  VerificationCodeHasher,
} from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { ApplicationError, createTransactionalEventServices, PrismaTransactionRunner } from "@/lib/application";
import type { PrismaClient } from "@/lib/db";
import { fromDatabaseLanguage, normalizeLocale } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";
import { SECURITY_EVENT_TYPES } from "@/lib/security";
import type { EmailProvider } from "./email-provider";

const logger = createLogger({ level: "info", context: { component: "password-reset" } });

export interface PasswordResetConfig {
  readonly ttlSeconds: number;
  readonly resetProofTtlSeconds: number;
  readonly resendCooldownSeconds: number;
  readonly maxAttempts: number;
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

function validEmail(value: string) {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

export class PasswordResetService {
  private readonly transactions: PrismaTransactionRunner;

  constructor(
    database: PrismaClient,
    private readonly codes: VerificationCodeHasher,
    private readonly tokens: SessionTokenManager,
    private readonly cookies: PasswordResetCookieManager,
    private readonly emailProvider: EmailProvider,
    private readonly config: PasswordResetConfig,
  ) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  async request(input: { email: string; language?: string | null }) {
    const email = normalizeEmail(input.email);
    const requestedLanguage = normalizeLocale(input.language) ?? "en";
    const challengeId = randomUUID();
    const code = createVerificationCode();
    const codeHash = await this.codes.hash(challengeId, code);

    const delivery = await this.transactions.run(async ({ database, occurredAt }) => {
      if (!validEmail(email)) return null;
      const user = await database.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          disabledAt: true,
          profile: { select: { preferredLanguage: true } },
          passwordResetChallenges: {
            where: { revokedAt: null, consumedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { resendAvailableAt: true },
          },
        },
      });
      if (!user || user.disabledAt || !user.passwordHash) return null;
      const latest = user.passwordResetChallenges[0];
      if (latest && latest.resendAvailableAt.getTime() > occurredAt.getTime()) return null;

      await database.passwordResetChallenge.updateMany({
        where: { userId: user.id, revokedAt: null, consumedAt: null },
        data: { revokedAt: occurredAt },
      });
      const expiresAt = addSeconds(occurredAt, this.config.ttlSeconds);
      await database.passwordResetChallenge.create({
        data: {
          id: challengeId,
          userId: user.id,
          codeHash,
          maxAttempts: this.config.maxAttempts,
          expiresAt,
          resendAvailableAt: addSeconds(occurredAt, this.config.resendCooldownSeconds),
          createdAt: occurredAt,
        },
      });
      await createTransactionalEventServices(database, occurredAt).security.record({
        type: SECURITY_EVENT_TYPES.passwordResetRequested,
        actor: { type: "anonymous" },
        target: { type: "password-reset", id: challengeId },
        metadata: { method: "email_code" },
      });
      return {
        userId: user.id,
        email: user.email,
        expiresAt,
        language: user.profile ? fromDatabaseLanguage(user.profile.preferredLanguage) : requestedLanguage,
      };
    });

    if (delivery && this.emailProvider.sendPasswordResetCode) {
      try {
        await this.emailProvider.sendPasswordResetCode({
          idempotencyKey: challengeId,
          userId: delivery.userId,
          email: delivery.email,
          code,
          expiresAt: delivery.expiresAt,
          language: delivery.language,
        });
      } catch {
        logger.warn("password_reset_email_delivery_failed", { userId: delivery.userId, challengeId });
      }
    }
    return { accepted: true as const, cooldownSeconds: this.config.resendCooldownSeconds };
  }

  async verify(input: { email: string; code: string }) {
    const email = normalizeEmail(input.email);
    const code = input.code.trim();
    if (!validEmail(email) || !/^\d{6}$/u.test(code)) return { ok: false as const, code: "INVALID_CODE" as const };
    const proof = await this.tokens.issue();

    const result = await this.transactions.run(async ({ database, occurredAt }) => {
      const user = await database.user.findUnique({ where: { email }, select: { id: true, disabledAt: true } });
      if (!user || user.disabledAt) return { ok: false as const, code: "INVALID_CODE" as const };
      const challenge = await database.passwordResetChallenge.findFirst({
        where: { userId: user.id, verifiedAt: null, revokedAt: null, consumedAt: null },
        orderBy: { createdAt: "desc" },
      });
      if (!challenge) return { ok: false as const, code: "INVALID_CODE" as const };
      const events = createTransactionalEventServices(database, occurredAt);
      if (challenge.expiresAt.getTime() <= occurredAt.getTime()) {
        await database.passwordResetChallenge.update({ where: { id: challenge.id }, data: { revokedAt: occurredAt } });
        await events.security.record({ type: SECURITY_EVENT_TYPES.passwordResetVerificationFailed, actor: { type: "anonymous" }, target: { type: "password-reset", id: challenge.id }, metadata: { reason: "expired" } });
        return { ok: false as const, code: "EXPIRED_CODE" as const };
      }
      if (challenge.attemptCount >= challenge.maxAttempts) {
        return { ok: false as const, code: "ATTEMPTS_EXHAUSTED" as const };
      }
      if (!(await this.codes.verify(challenge.id, code, challenge.codeHash))) {
        const attemptCount = challenge.attemptCount + 1;
        const exhausted = attemptCount >= challenge.maxAttempts;
        await database.passwordResetChallenge.update({ where: { id: challenge.id }, data: { attemptCount, revokedAt: exhausted ? occurredAt : null } });
        await events.security.record({ type: SECURITY_EVENT_TYPES.passwordResetVerificationFailed, actor: { type: "anonymous" }, target: { type: "password-reset", id: challenge.id }, metadata: { reason: exhausted ? "attempts_exhausted" : "invalid" } });
        return { ok: false as const, code: exhausted ? "ATTEMPTS_EXHAUSTED" as const : "INVALID_CODE" as const };
      }
      const resetExpiresAt = addSeconds(occurredAt, this.config.resetProofTtlSeconds);
      await database.passwordResetChallenge.update({
        where: { id: challenge.id },
        data: { verifiedAt: occurredAt, resetTokenHash: proof.hash, resetExpiresAt },
      });
      await database.passwordResetChallenge.updateMany({
        where: { userId: user.id, id: { not: challenge.id }, revokedAt: null, consumedAt: null },
        data: { revokedAt: occurredAt },
      });
      await events.security.record({ type: SECURITY_EVENT_TYPES.passwordResetVerified, actor: { type: "anonymous" }, target: { type: "password-reset", id: challenge.id }, metadata: { method: "email_code" } });
      return { ok: true as const };
    });
    return result.ok
      ? { ...result, setCookie: this.cookies.create(proof.value, this.config.resetProofTtlSeconds) }
      : result;
  }

  async complete(input: { token: string | null; password: string; passwordConfirmation: string }) {
    if (!input.token || !this.tokens.isValid(input.token)) throw new ApplicationError("AUTHENTICATION_REQUIRED", "Подтвердите код ещё раз.");
    if (input.password !== input.passwordConfirmation) throw new ApplicationError("VALIDATION", "Пароли не совпадают.");
    const passwordLength = Array.from(input.password).length;
    const passwordBytes = new TextEncoder().encode(input.password).length;
    if (passwordLength < 8 || passwordBytes > 1024) throw new ApplicationError("VALIDATION", "Пароль должен содержать не менее 8 символов.");
    const passwordHash = await hashPassword(input.password);
    const tokenHash = await this.tokens.digest(input.token);
    const result = await this.transactions.run(async ({ database, occurredAt }) => {
      const challenge = await database.passwordResetChallenge.findUnique({ where: { resetTokenHash: tokenHash } });
      if (!challenge || !challenge.verifiedAt || challenge.revokedAt || challenge.consumedAt || !challenge.resetExpiresAt || challenge.resetExpiresAt.getTime() <= occurredAt.getTime()) {
        throw new ApplicationError("AUTHENTICATION_REQUIRED", "Ссылка сброса истекла. Запросите новый код.");
      }
      await database.user.update({ where: { id: challenge.userId }, data: { passwordHash, passwordChangedAt: occurredAt } });
      await database.passwordResetChallenge.update({ where: { id: challenge.id }, data: { consumedAt: occurredAt, resetTokenHash: null } });
      await database.passwordResetChallenge.updateMany({ where: { userId: challenge.userId, id: { not: challenge.id }, revokedAt: null, consumedAt: null }, data: { revokedAt: occurredAt } });
      const sessions = await database.session.updateMany({ where: { userId: challenge.userId, revokedAt: null }, data: { revokedAt: occurredAt } });
      await createTransactionalEventServices(database, occurredAt).security.record({
        type: SECURITY_EVENT_TYPES.passwordResetCompleted,
        actor: { type: "user", id: challenge.userId },
        target: { type: "user", id: challenge.userId },
        metadata: { sessionsRevoked: sessions.count },
      });
      return { sessionsRevoked: sessions.count };
    });
    return { ...result, setCookie: this.cookies.clear() };
  }
}
