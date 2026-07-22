import "server-only";

import { Prisma, type PrismaClient } from "@/lib/db";
import type { RateLimitConsumeInput, RateLimitSnapshot } from "@/lib/rate-limit";
import type { RateLimitRepository } from "./rate-limit-repository";

interface RateLimitRow {
  requestCount: number;
  windowStartedAt: Date;
  expiresAt: Date;
}

export class PrismaRateLimitRepository implements RateLimitRepository {
  constructor(private readonly database: PrismaClient) {}

  async consume(input: RateLimitConsumeInput): Promise<RateLimitSnapshot> {
    const windowStartedAt = input.now;
    const expiresAt = new Date(input.now.getTime() + input.windowSeconds * 1000);
    const resetBefore = new Date(input.now.getTime() - input.windowSeconds * 1000);
    const rows = await this.database.$queryRaw<RateLimitRow[]>(Prisma.sql`
      INSERT INTO "RateLimitBucket" (
        "keyHash", "requestCount", "windowStartedAt", "expiresAt", "updatedAt"
      ) VALUES (
        ${input.keyHash}, 1, ${windowStartedAt}, ${expiresAt}, ${input.now}
      )
      ON CONFLICT ("keyHash") DO UPDATE SET
        "requestCount" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= ${resetBefore} THEN 1
          ELSE LEAST("RateLimitBucket"."requestCount" + 1, ${input.limit + 1})
        END,
        "windowStartedAt" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= ${resetBefore} THEN ${windowStartedAt}
          ELSE "RateLimitBucket"."windowStartedAt"
        END,
        "expiresAt" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= ${resetBefore} THEN ${expiresAt}
          ELSE "RateLimitBucket"."expiresAt"
        END,
        "updatedAt" = ${input.now}
      RETURNING "requestCount", "windowStartedAt", "expiresAt"
    `);
    const row = rows[0];
    if (!row) throw new Error("Rate limit bucket не был обновлён");
    return { count: row.requestCount, windowStartedAt: row.windowStartedAt, expiresAt: row.expiresAt };
  }

  async inspect(keyHash: string, now: Date) {
    const bucket = await this.database.rateLimitBucket.findUnique({ where: { keyHash } });
    if (!bucket || bucket.expiresAt.getTime() <= now.getTime()) return null;
    return {
      count: bucket.requestCount,
      windowStartedAt: bucket.windowStartedAt,
      expiresAt: bucket.expiresAt,
    };
  }

  async reset(keyHash: string) {
    await this.database.rateLimitBucket.deleteMany({ where: { keyHash } });
  }

  async deleteExpired(before: Date, limit: number) {
    const rows = await this.database.$queryRaw<Array<{ keyHash: string }>>(Prisma.sql`
      DELETE FROM "RateLimitBucket"
      WHERE "keyHash" IN (
        SELECT "keyHash" FROM "RateLimitBucket"
        WHERE "expiresAt" < ${before}
        ORDER BY "expiresAt" ASC
        LIMIT ${Math.max(1, Math.floor(limit))}
      )
      RETURNING "keyHash"
    `);
    return rows.length;
  }
}
