import "server-only";

import type { DatabaseClient } from "@/lib/db";

export class PrismaOpportunityTaskRepository {
  constructor(private readonly database: DatabaseClient) {}

  findProfile(userId: string) {
    return this.database.userProfile.findUnique({
      where: { userId },
      select: { userId: true, productRole: true, preferredLanguage: true, accountStatus: true, market: { select: { id: true, code: true, name: true, isActive: true } } },
    });
  }

  listVisible(input: { userId: string; role: "PLAYER" | "PARTNER"; marketId: string; now: Date; search?: string; type?: "TASK" | "INSTRUCTION" | "PROMOCODE" | "FORECAST" | "PERSONAL_CONDITION" }) {
    return this.database.opportunity.findMany({
      where: {
        status: "PUBLISHED", publishedAt: { not: null, lte: input.now }, archivedAt: null,
        ...(input.type ? { type: input.type } : {}),
        ...(input.search ? { OR: [{ title: { contains: input.search, mode: "insensitive" } }, { description: { contains: input.search, mode: "insensitive" } }] } : {}),
        audiences: { some: { productRole: input.role, marketId: input.marketId } },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      include: {
        audiences: { where: { productRole: input.role, marketId: input.marketId }, include: { market: { select: { code: true, name: true } } } },
        eligibility: { where: { userId: input.userId }, orderBy: { evaluatedAt: "desc" }, take: 1 },
        instruction: { include: { versions: { where: { status: "PUBLISHED", publishedAt: { not: null, lte: input.now }, audiences: { some: { productRole: input.role, marketId: input.marketId } } }, orderBy: { version: "desc" }, take: 1, include: { sections: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } } } },
        taskDefinitions: { include: { versions: { where: { status: "PUBLISHED", publishedAt: { not: null, lte: input.now }, audiences: { some: { productRole: input.role, marketId: input.marketId } }, OR: [{ availableFrom: null }, { availableFrom: { lte: input.now } }], AND: [{ OR: [{ availableUntil: null }, { availableUntil: { gt: input.now } }] }] }, orderBy: { version: "desc" }, take: 1, include: { instructionVersion: { include: { sections: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } } } } } },
      },
    });
  }

  async findVisibleById(input: { id: string; userId: string; role: "PLAYER" | "PARTNER"; marketId: string; now: Date }) {
    const rows = await this.database.opportunity.findMany({
      where: { id: input.id, status: "PUBLISHED", publishedAt: { not: null, lte: input.now }, archivedAt: null, audiences: { some: { productRole: input.role, marketId: input.marketId } } },
      take: 1,
      include: {
        audiences: { where: { productRole: input.role, marketId: input.marketId }, include: { market: { select: { code: true, name: true } } } },
        eligibility: { where: { userId: input.userId }, orderBy: { evaluatedAt: "desc" }, take: 1 },
        instruction: { include: { versions: { where: { status: "PUBLISHED", publishedAt: { not: null, lte: input.now }, audiences: { some: { productRole: input.role, marketId: input.marketId } } }, orderBy: { version: "desc" }, take: 1, include: { sections: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } } } },
        taskDefinitions: { include: { versions: { where: { status: "PUBLISHED", publishedAt: { not: null, lte: input.now }, audiences: { some: { productRole: input.role, marketId: input.marketId } }, OR: [{ availableFrom: null }, { availableFrom: { lte: input.now } }], AND: [{ OR: [{ availableUntil: null }, { availableUntil: { gt: input.now } }] }] }, orderBy: { version: "desc" }, take: 1, include: { instructionVersion: { include: { sections: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } } } } } } },
      },
    });
    return rows[0] ?? null;
  }

  findUserTask(id: string, userId: string) {
    return this.database.userTask.findFirst({
      where: { id, userId },
      include: {
        taskDefinition: true,
        taskVersion: {
          include: {
            instructionVersion: {
              include: {
                sections: { orderBy: { position: "asc" } },
                steps: { orderBy: { position: "asc" } },
              },
            },
          },
        },
        submissions: {
          include: {
            versions: {
              orderBy: { version: "asc" },
              include: { reviews: { orderBy: { decidedAt: "desc" }, take: 1 } },
            },
          },
        },
        statusHistory: { orderBy: { occurredAt: "asc" } },
      },
    });
  }

  findAssignment(assignmentKey: string) { return this.database.userTask.findUnique({ where: { assignmentKey }, select: { id: true, userId: true } }); }
  findCurrentTask(userId: string, taskDefinitionId: string) { return this.database.userTask.findFirst({ where: { userId, taskDefinitionId, status: { notIn: ["CONFIRMED", "REJECTED", "EXPIRED", "CANCELLED"] } }, orderBy: { attemptNumber: "desc" }, select: { id: true } }); }
  countAttempts(userId: string, taskDefinitionId: string) { return this.database.userTask.count({ where: { userId, taskDefinitionId } }); }
}
