import "server-only";

import type { DatabaseClient } from "@/lib/db";

export class PrismaEconomyRewardRepository {
  constructor(private readonly database: DatabaseClient) {}

  findProfile(userId: string) {
    return this.database.userProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        productRole: true,
        accountStatus: true,
        market: { select: { id: true, code: true, name: true, isActive: true } },
      },
    });
  }

  listEffectivePolicies(input: { role: "PLAYER" | "PARTNER"; marketId: string; at: Date }) {
    return this.database.economyPolicy.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ productRole: null }, { productRole: input.role }],
        AND: [
          { OR: [{ marketId: null }, { marketId: input.marketId }] },
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: input.at } }] },
          { OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: input.at } }] },
        ],
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    });
  }

  listPoints(userId: string, take = 100) {
    return this.database.vXPointsLedgerEntry.findMany({ where: { userId }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take });
  }

  pointsTotals(userId: string) {
    return Promise.all([
      this.database.vXPointsLedgerEntry.aggregate({ where: { userId, status: { in: ["CONFIRMED", "REVERSED"] } }, _sum: { delta: true } }),
      this.database.vXPointsLedgerEntry.aggregate({ where: { userId, status: "PENDING" }, _sum: { delta: true } }),
    ]);
  }

  findPointById(id: string, userId: string) {
    return this.database.vXPointsLedgerEntry.findFirst({ where: { id, userId } });
  }

  listTrustEvents(userId: string, take = 100) {
    return this.database.trustScoreEvent.findMany({ where: { userId }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take });
  }

  findTrustSnapshot(userId: string) {
    return this.database.trustScoreSnapshot.findUnique({ where: { userId } });
  }

  listRankDefinitions(input: { role: "PLAYER" | "PARTNER"; marketId: string; at: Date }) {
    return this.database.rankDefinition.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ productRole: null }, { productRole: input.role }],
        AND: [
          { OR: [{ marketId: null }, { marketId: input.marketId }] },
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: input.at } }] },
          { OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: input.at } }] },
        ],
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    });
  }

  listUserRanks(userId: string) {
    return this.database.userRank.findMany({ where: { userId }, include: { rankDefinition: true }, orderBy: [{ assignedAt: "desc" }, { id: "desc" }] });
  }

  countConfirmedTasks(userId: string) {
    return this.database.userTask.count({ where: { userId, status: "CONFIRMED" } });
  }

  listRewards(userId: string, take = 100) {
    return this.database.vXReward.findMany({ where: { userId }, include: { rewardType: true, statusHistory: { orderBy: { occurredAt: "asc" } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take });
  }

  findReward(id: string, userId: string) {
    return this.database.vXReward.findFirst({ where: { id, userId }, include: { rewardType: true, statusHistory: { orderBy: { occurredAt: "asc" } } } });
  }

  findPublishedRewardType(key: string) {
    return this.database.rewardType.findFirst({ where: { key, status: "PUBLISHED" } });
  }

  countRewards(userId: string) {
    return this.database.vXReward.count({ where: { userId } });
  }

  countClaimableRewards(userId: string, at: Date) {
    return this.database.vXReward.count({
      where: {
        userId,
        status: "AVAILABLE",
        OR: [{ validFrom: null }, { validFrom: { lte: at } }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: at } }] }],
      },
    });
  }
}
