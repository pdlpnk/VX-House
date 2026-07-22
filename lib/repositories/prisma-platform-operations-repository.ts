import "server-only";

import type { DatabaseClient } from "@/lib/db";

export class PrismaPlatformOperationsRepository {
  constructor(private readonly database: DatabaseClient) {}

  findProfile(userId: string) {
    return this.database.userProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, displayName: true, email: true, createdAt: true } },
        market: true,
        partnerProfile: true,
      },
    });
  }

  findCurrentRank(userId: string) {
    return this.database.userRank.findFirst({
      where: { userId },
      include: { rankDefinition: true },
      orderBy: { assignedAt: "desc" },
    });
  }

  listForecastVersions(at: Date) {
    return this.database.forecastVersion.findMany({
      where: {
        status: "PUBLISHED",
        validFrom: { lte: at },
        validUntil: { gt: at },
      },
      include: {
        forecast: { include: { author: { select: { displayName: true, email: true } } } },
        accessRules: { include: { market: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { version: "desc" }],
    });
  }

  listPromocodes(userId: string, role: "PLAYER" | "PARTNER", marketId: string) {
    return this.database.promocode.findMany({
      where: {
        productRole: role,
        marketId,
        status: "PUBLISHED",
        partnerService: { status: "ACTIVE", markets: { some: { marketId, status: "ACTIVE" } } },
      },
      include: {
        market: true,
        partnerService: { include: { markets: true } },
        activations: { where: { userId }, include: { history: { orderBy: { occurredAt: "asc" } } }, take: 1 },
      },
      orderBy: [{ validUntil: "asc" }, { createdAt: "desc" }],
    });
  }

  findPromocode(id: string, userId: string) {
    return this.database.promocode.findUnique({
      where: { id },
      include: {
        market: true,
        partnerService: { include: { markets: true } },
        activations: { where: { userId }, include: { history: { orderBy: { occurredAt: "asc" } } }, take: 1 },
      },
    });
  }

  async workspaceCounts(userId: string, role: "PLAYER" | "PARTNER", marketId: string, at: Date) {
    const [activeTasks, completedTasks, rewards, openSupport, unreadNotifications, availableOpportunities, availablePromocodes] = await Promise.all([
      this.database.userTask.count({ where: { userId, status: { in: ["ACCEPTED", "IN_PROGRESS", "AWAITING_SUBMISSION", "SUBMITTED", "UNDER_REVIEW", "CLARIFICATION_REQUIRED", "RESUBMISSION_REQUIRED"] } } }),
      this.database.userTask.count({ where: { userId, status: "CONFIRMED" } }),
      this.database.vXReward.count({ where: { userId, status: { notIn: ["REJECTED", "CANCELLED", "EXPIRED"] } } }),
      this.database.supportConversation.count({ where: { userId, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      this.database.notification.count({ where: { userId, status: "SENT" } }),
      this.database.opportunity.count({ where: { status: "PUBLISHED", audiences: { some: { productRole: role, marketId } }, OR: [{ eligibility: { none: { userId } } }, { eligibility: { some: { userId, status: "ELIGIBLE", OR: [{ validUntil: null }, { validUntil: { gt: at } }] } } }] } }),
      this.database.promocode.count({ where: { productRole: role, marketId, status: "PUBLISHED", validFrom: { lte: at }, validUntil: { gt: at }, partnerService: { status: "ACTIVE", markets: { some: { marketId, status: "ACTIVE" } } } } }),
    ]);
    return { activeTasks, completedTasks, rewards, openSupport, unreadNotifications, availableOpportunities, availablePromocodes };
  }

  findRecommendedOpportunity(userId: string, role: "PLAYER" | "PARTNER", marketId: string, at: Date) {
    return this.database.opportunity.findFirst({
      where: {
        status: "PUBLISHED",
        audiences: { some: { productRole: role, marketId } },
        OR: [
          { eligibility: { none: { userId } } },
          { eligibility: { some: { userId, status: "ELIGIBLE", OR: [{ validUntil: null }, { validUntil: { gt: at } }] } } },
        ],
      },
      select: { id: true, title: true, description: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  listActivity(userId: string) {
    return Promise.all([
      this.database.userTaskStatusHistory.findMany({ where: { userTask: { userId } }, include: { userTask: { include: { taskVersion: true } } }, orderBy: { occurredAt: "desc" }, take: 30 }),
      this.database.vXPointsLedgerEntry.findMany({ where: { userId }, orderBy: { occurredAt: "desc" }, take: 30 }),
      this.database.trustScoreEvent.findMany({ where: { userId }, orderBy: { occurredAt: "desc" }, take: 30 }),
      this.database.userRank.findMany({ where: { userId }, include: { rankDefinition: true }, orderBy: { assignedAt: "desc" }, take: 30 }),
      this.database.rewardStatusHistory.findMany({ where: { reward: { userId } }, include: { reward: true }, orderBy: { occurredAt: "desc" }, take: 30 }),
      this.database.supportStatusHistory.findMany({ where: { conversation: { userId } }, include: { conversation: true }, orderBy: { occurredAt: "desc" }, take: 30 }),
      this.database.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
      this.database.promocodeActivationHistory.findMany({ where: { activation: { userId } }, include: { activation: { include: { promocode: { include: { partnerService: true } } } } }, orderBy: { occurredAt: "desc" }, take: 30 }),
    ]);
  }

  searchOwned(userId: string, term: string) {
    return Promise.all([
      this.database.userTask.findMany({ where: { userId, taskVersion: { OR: [{ title: { contains: term, mode: "insensitive" } }, { summary: { contains: term, mode: "insensitive" } }] } }, include: { taskVersion: true }, take: 8, orderBy: { updatedAt: "desc" } }),
      this.database.vXReward.findMany({ where: { userId, OR: [{ title: { contains: term, mode: "insensitive" } }, { description: { contains: term, mode: "insensitive" } }] }, take: 8, orderBy: { createdAt: "desc" } }),
      this.database.supportConversation.findMany({ where: { userId, subject: { contains: term, mode: "insensitive" } }, take: 8, orderBy: { updatedAt: "desc" } }),
    ]);
  }
}
