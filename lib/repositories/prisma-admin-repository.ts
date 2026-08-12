import "server-only";

import type { AdminListQuery, AdminSectionId } from "@/lib/admin";
import { ADMIN_MESSENGER_ROLES } from "@/lib/admin-messenger";
import type { DatabaseClient } from "@/lib/db";

const take = (value?: number) => Math.min(Math.max(value ?? 30, 1), 100);
// A single admin catalog spans heterogeneous Prisma payloads. Every row is
// normalized to a typed AdminRecordView by AdminApplicationService.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminRepositoryRow = any;

export class PrismaAdminRepository {
  constructor(private readonly database: DatabaseClient) {}

  async dashboard(since: Date) {
    const [users, registrationsToday, activeTasks, openSupport, pointsEntries, rewardsInProgress, pendingReviews, pendingAppeals] = await Promise.all([
      this.database.user.count({ where: { disabledAt: null } }),
      this.database.user.count({ where: { disabledAt: null, createdAt: { gte: since } } }),
      this.database.userTask.count({ where: { user: { disabledAt: null }, status: { in: ["ACCEPTED", "IN_PROGRESS", "AWAITING_SUBMISSION", "SUBMITTED", "UNDER_REVIEW", "CLARIFICATION_REQUIRED", "RESUBMISSION_REQUIRED"] } } }),
      this.database.supportConversation.count({ where: { user: { disabledAt: null }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      this.database.vXPointsLedgerEntry.count({ where: { user: { disabledAt: null } } }),
      this.database.vXReward.count({ where: { user: { disabledAt: null }, status: { in: ["EXPECTED", "AWAITING_CONFIRMATION", "CONFIRMED", "PREPARING", "AVAILABLE"] } } }),
      this.database.userTask.count({ where: { user: { disabledAt: null }, status: "UNDER_REVIEW" } }),
      this.database.appeal.count({ where: { user: { disabledAt: null }, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    ]);
    return { users, registrationsToday, activeTasks, openSupport, pointsEntries, rewardsInProgress, pendingReviews, pendingAppeals };
  }

  list(section: AdminSectionId, query: AdminListQuery): Promise<AdminRepositoryRow[]> {
    const limit = take(query.take);
    const search = query.search?.trim();
    const cursor = query.cursor ? { id: query.cursor } : undefined;
    const paging = { take: limit + 1, ...(cursor ? { cursor, skip: 1 } : {}) };
    switch (section) {
      case "users": return this.database.user.findMany({ ...paging, where: { disabledAt: null, ...(search ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { displayName: { contains: search, mode: "insensitive" as const } }] } : {}), ...(query.tagId ? { adminTagAssignments: { some: { tagId: query.tagId } } } : {}), profile: { productRole: { in: [...ADMIN_MESSENGER_ROLES] }, ...(query.role ? { productRole: query.role as "PLAYER" | "PARTNER" } : {}), ...(query.status ? { accountStatus: query.status as never } : {}), ...(query.market ? { market: { code: query.market } } : {}) } }, include: { profile: { include: { market: true, partnerProfile: true, statusHistory: { orderBy: { occurredAt: "desc" }, take: 10 } } }, roles: true, adminTagAssignments: { include: { tag: true }, orderBy: { tag: { name: "asc" } } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
      case "services": return this.database.partnerService.findMany({ ...paging, where: { ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}), ...(query.status ? { status: query.status as never } : {}) }, include: { markets: { include: { market: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] });
      case "opportunities": return this.database.opportunity.findMany({ ...paging, where: { ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { key: { contains: search, mode: "insensitive" as const } }] } : {}), ...(query.status ? { status: query.status as never } : {}), ...(query.role || query.market ? { audiences: { some: { ...(query.role ? { productRole: query.role } : {}), ...(query.market ? { market: { code: query.market } } : {}) } } } : {}) }, include: { audiences: { include: { market: true } }, taskDefinitions: true }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] });
      case "tasks": return this.database.taskDefinition.findMany({ ...paging, where: search ? { OR: [{ key: { contains: search, mode: "insensitive" as const } }, { versions: { some: { title: { contains: search, mode: "insensitive" as const } } } }] } : {}, include: { versions: { include: { audiences: { include: { market: true } }, instructionVersion: true }, orderBy: { version: "desc" } }, _count: { select: { userTasks: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] });
      case "reviews": return this.database.submissionVersion.findMany({ ...paging, where: { status: "SUBMITTED", taskSubmission: { userTask: { status: "UNDER_REVIEW", ...(query.role || query.market ? { user: { profile: { ...(query.role ? { productRole: query.role } : {}), ...(query.market ? { market: { code: query.market } } : {}) } } } : {}) } } }, include: { reviews: { include: { reviewer: true }, orderBy: { decidedAt: "desc" } }, taskSubmission: { include: { userTask: { include: { user: { include: { profile: { include: { market: true } } } }, taskVersion: true } } } } }, orderBy: [{ submittedAt: "desc" }, { id: "desc" }] });
      case "rewards": return this.database.vXReward.findMany({ ...paging, where: { ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}), ...(query.status ? { status: query.status as never } : {}), ...(query.role || query.market ? { user: { profile: { ...(query.role ? { productRole: query.role } : {}), ...(query.market ? { market: { code: query.market } } : {}) } } } : {}) }, include: { rewardType: true, user: { include: { profile: { include: { market: true } } } }, statusHistory: { orderBy: { occurredAt: "desc" } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
      case "economy": return this.database.vXPointsLedgerEntry.findMany({ ...paging, where: { ...(query.status ? { status: query.status as never } : {}), ...(search ? { OR: [{ reason: { contains: search, mode: "insensitive" as const } }, { user: { email: { contains: search, mode: "insensitive" as const } } }] } : {}) }, include: { user: true }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }] });
      case "support": return this.database.supportConversation.findMany({ ...paging, where: { ...(search ? { OR: [{ subject: { contains: search, mode: "insensitive" as const } }, { user: { email: { contains: search, mode: "insensitive" as const } } }] } : {}), ...(query.status ? { status: query.status as never } : {}) }, include: { user: { include: { profile: { include: { market: true } } } }, assignedTo: true, categoryDefinition: true, appeals: { include: { statusHistory: { orderBy: { occurredAt: "desc" } } } }, _count: { select: { messages: true, internalNotes: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] });
      case "content": return this.database.instruction.findMany({ ...paging, where: search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { key: { contains: search, mode: "insensitive" as const } }] } : {}, include: { versions: { include: { audiences: { include: { market: true } }, sections: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } }, orderBy: { version: "desc" } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] });
      case "notifications": return this.database.notification.findMany({ ...paging, where: { ...(query.status ? { status: query.status as never } : {}), ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { type: { contains: search, mode: "insensitive" as const } }] } : {}), ...(query.role || query.market ? { user: { profile: { ...(query.role ? { productRole: query.role } : {}), ...(query.market ? { market: { code: query.market } } : {}) } } } : {}) }, include: { user: true, batch: true, statusHistory: { orderBy: { occurredAt: "desc" } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
      case "team": return this.database.role.findMany({ ...paging, where: search ? { name: { contains: search, mode: "insensitive" as const } } : {}, include: { permissions: true, _count: { select: { users: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }] });
      case "audit": return this.database.auditEvent.findMany({ ...paging, where: search ? { OR: [{ action: { contains: search, mode: "insensitive" as const } }, { targetType: { contains: search, mode: "insensitive" as const } }] } : {}, orderBy: [{ occurredAt: "desc" }, { id: "desc" }] });
      case "settings": return this.database.market.findMany({ ...paging, where: query.market ? { code: query.market } : {}, orderBy: [{ code: "asc" }, { id: "asc" }] });
    }
  }

  latestRevision(entityType: string, entityId: string) { return this.database.adminContentRevision.findFirst({ where: { entityType, entityId }, orderBy: { version: "desc" } }); }
  latestContentRevision(entityId: string) { return this.database.adminContentRevision.findFirst({ where: { entityId }, orderBy: { version: "desc" } }); }
  async listEditorialContent(query: AdminListQuery) {
    const search = query.search?.trim(); const limit = Math.min(query.take ?? 30, 100);
    const [instructions, forecasts, promocodes] = await Promise.all([
      this.database.instruction.findMany({ where: search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { key: { contains: search, mode: "insensitive" } }] } : {}, include: { versions: { include: { audiences: { include: { market: true } }, sections: true, steps: true }, orderBy: { version: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: limit }),
      this.database.forecast.findMany({ where: search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { key: { contains: search, mode: "insensitive" } }] } : {}, include: { author: true, versions: { include: { accessRules: { include: { market: true } } }, orderBy: { version: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: limit }),
      this.database.promocode.findMany({ where: { ...(search ? { OR: [{ key: { contains: search, mode: "insensitive" } }, { instructions: { contains: search, mode: "insensitive" } }] } : {}), ...(query.role ? { productRole: query.role } : {}), ...(query.market ? { market: { code: query.market } } : {}) }, include: { partnerService: true, market: true, activations: { select: { id: true } } }, orderBy: { updatedAt: "desc" }, take: limit }),
    ]);
    return { instructions, forecasts, promocodes };
  }
  listRewardTypes(query: AdminListQuery) { return this.database.rewardType.findMany({ where: { ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { key: { contains: query.search, mode: "insensitive" } }] } : {}), ...(query.status ? { status: query.status as never } : {}) }, include: { _count: { select: { rewards: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: Math.min(query.take ?? 30, 100) }); }

  find(section: AdminSectionId, id: string) {
    switch (section) {
      case "users": return this.database.user.findUnique({ where: { id }, include: { profile: { include: { market: true, partnerProfile: { include: { approvalHistory: { orderBy: { occurredAt: "desc" } } } }, statusHistory: { orderBy: { occurredAt: "desc" } } } }, roles: { include: { permissions: true } }, sessions: { orderBy: { createdAt: "desc" }, take: 5 } } });
      case "services": return this.database.partnerService.findUnique({ where: { id }, include: { markets: { include: { market: true } }, opportunities: true, tasks: true } });
      case "opportunities": return this.database.opportunity.findUnique({ where: { id }, include: { audiences: { include: { market: true } }, taskDefinitions: true } });
      case "tasks": return this.database.taskDefinition.findUnique({ where: { id }, include: { versions: { include: { audiences: { include: { market: true } }, instructionVersion: true }, orderBy: { version: "desc" } }, _count: { select: { userTasks: true } } } });
      case "reviews": return this.database.submissionVersion.findUnique({
        where: { id },
        include: {
          reviews: { include: { reviewer: true }, orderBy: { decidedAt: "desc" } },
          taskSubmission: {
            include: {
              userTask: {
                include: {
                  user: { include: { profile: { include: { market: true } } } },
                  taskVersion: true,
                  statusHistory: { orderBy: { occurredAt: "desc" } },
                },
              },
            },
          },
        },
      });
      case "rewards": return this.database.vXReward.findUnique({ where: { id }, include: { rewardType: true, user: { include: { profile: { include: { market: true } } } }, statusHistory: { orderBy: { occurredAt: "desc" } } } });
      case "economy": return this.database.vXPointsLedgerEntry.findUnique({ where: { id }, include: { user: true, reversesEntry: true, reversedBy: true } });
      case "support": return this.database.supportConversation.findUnique({ where: { id }, include: { user: { include: { profile: { include: { market: true } } } }, assignedTo: true, categoryDefinition: true, messages: { include: { author: true }, orderBy: { createdAt: "asc" } }, internalNotes: { include: { author: true }, orderBy: { createdAt: "asc" } }, statusHistory: { orderBy: { occurredAt: "desc" } }, appeals: { include: { statusHistory: { orderBy: { occurredAt: "desc" } } } } } });
      case "content": return this.database.instruction.findUnique({ where: { id }, include: { versions: { include: { audiences: { include: { market: true } }, sections: { orderBy: { position: "asc" } }, steps: { orderBy: { position: "asc" } } }, orderBy: { version: "desc" } } } });
      case "notifications": return this.database.notification.findUnique({ where: { id }, include: { user: { include: { profile: { include: { market: true } } } }, batch: true, statusHistory: { orderBy: { occurredAt: "desc" } } } });
      case "team": return this.database.role.findUnique({ where: { id }, include: { permissions: true, users: { select: { id: true, email: true, displayName: true } } } });
      case "audit": return this.database.auditEvent.findUnique({ where: { id } });
      case "settings": return this.database.market.findUnique({ where: { id }, include: { _count: { select: { profiles: true, opportunityScopes: true, taskScopes: true } } } });
    }
  }
}
