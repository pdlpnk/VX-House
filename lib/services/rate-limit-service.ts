import "server-only";

import { encodeBase64Url } from "@/lib/auth/encoding";
import type { RateLimitDecision, RateLimitRule, RateLimitSnapshot } from "@/lib/rate-limit";
import type { RateLimitRepository } from "@/lib/repositories";

const KEY_NAMESPACE_PATTERN = /^[a-z][a-z0-9_.:-]{1,79}$/;
const textEncoder = new TextEncoder();

function validateRule(rule: RateLimitRule) {
  if (!Number.isSafeInteger(rule.limit) || rule.limit <= 0) throw new TypeError("Некорректный rate limit");
  if (!Number.isSafeInteger(rule.windowSeconds) || rule.windowSeconds <= 0) {
    throw new TypeError("Некорректное окно rate limit");
  }
}

function toDecision(
  snapshot: RateLimitSnapshot | null,
  rule: RateLimitRule,
  now: Date,
  consumed: boolean,
): RateLimitDecision {
  const count = snapshot?.count ?? 0;
  const allowed = consumed ? count <= rule.limit : count < rule.limit;
  const retryAfterSeconds = snapshot
    ? Math.max(0, Math.ceil((snapshot.expiresAt.getTime() - now.getTime()) / 1000))
    : 0;
  return {
    allowed,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
  };
}

export class RateLimitService {
  private readonly keyPromise: Promise<CryptoKey>;

  constructor(
    private readonly repository: RateLimitRepository,
    secret: string,
  ) {
    this.keyPromise = crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  private async hashKey(namespace: string, key: string) {
    if (!KEY_NAMESPACE_PATTERN.test(namespace)) throw new TypeError("Некорректный namespace rate limit");
    if (!key || key.length > 1_000) throw new TypeError("Некорректный ключ rate limit");
    const signingKey = await this.keyPromise;
    const digest = await crypto.subtle.sign("HMAC", signingKey, textEncoder.encode(`${namespace}\0${key}`));
    return encodeBase64Url(new Uint8Array(digest));
  }

  async consume(namespace: string, key: string, rule: RateLimitRule, now = new Date()) {
    validateRule(rule);
    const snapshot = await this.repository.consume({
      keyHash: await this.hashKey(namespace, key),
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
      now,
    });
    return toDecision(snapshot, rule, now, true);
  }

  async inspect(namespace: string, key: string, rule: RateLimitRule, now = new Date()) {
    validateRule(rule);
    return toDecision(
      await this.repository.inspect(await this.hashKey(namespace, key), now),
      rule,
      now,
      false,
    );
  }

  async reset(namespace: string, key: string) {
    await this.repository.reset(await this.hashKey(namespace, key));
  }
}
