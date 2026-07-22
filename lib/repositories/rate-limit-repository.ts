import type { RateLimitConsumeInput, RateLimitSnapshot } from "@/lib/rate-limit";

export interface RateLimitRepository {
  consume(input: RateLimitConsumeInput): Promise<RateLimitSnapshot>;
  inspect(keyHash: string, now: Date): Promise<RateLimitSnapshot | null>;
  reset(keyHash: string): Promise<void>;
  deleteExpired(before: Date, limit: number): Promise<number>;
}
