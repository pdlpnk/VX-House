import "server-only";

import type { RateLimitDecision, RateLimitRule } from "@/lib/rate-limit";
import type { RateLimitService } from "./rate-limit-service";

export interface BruteForceProtectionPolicy {
  readonly identifier: RateLimitRule;
  readonly network: RateLimitRule;
}

export interface AuthenticationAttemptKey {
  readonly identifier: string;
  readonly network: string;
}

function combine(identifier: RateLimitDecision, network: RateLimitDecision) {
  return Object.freeze({
    allowed: identifier.allowed && network.allowed,
    retryAfterSeconds: Math.max(identifier.retryAfterSeconds, network.retryAfterSeconds),
  });
}

export class BruteForceProtectionService {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly policy: BruteForceProtectionPolicy,
  ) {}

  async assess(key: AuthenticationAttemptKey, now = new Date()) {
    const [identifier, network] = await Promise.all([
      this.rateLimits.inspect("auth.identifier", key.identifier, this.policy.identifier, now),
      this.rateLimits.inspect("auth.network", key.network, this.policy.network, now),
    ]);
    return combine(identifier, network);
  }

  async registerFailure(key: AuthenticationAttemptKey, now = new Date()) {
    const [identifier, network] = await Promise.all([
      this.rateLimits.consume("auth.identifier", key.identifier, this.policy.identifier, now),
      this.rateLimits.consume("auth.network", key.network, this.policy.network, now),
    ]);
    return combine(identifier, network);
  }

  async registerSuccess(key: AuthenticationAttemptKey) {
    await this.rateLimits.reset("auth.identifier", key.identifier);
  }
}
