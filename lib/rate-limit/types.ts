export interface RateLimitRule {
  readonly limit: number;
  readonly windowSeconds: number;
}

export interface RateLimitConsumeInput extends RateLimitRule {
  readonly keyHash: string;
  readonly now: Date;
}

export interface RateLimitSnapshot {
  readonly count: number;
  readonly windowStartedAt: Date;
  readonly expiresAt: Date;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}
