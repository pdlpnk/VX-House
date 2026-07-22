import "server-only";

import type { AuditMetadata, AppendAuditEventInput, StoredAuditEvent } from "@/lib/audit";
import { Prisma, type DatabaseClient } from "@/lib/db";
import type { AuditRepository } from "./audit-repository";

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly database: DatabaseClient) {}

  async append(input: AppendAuditEventInput): Promise<StoredAuditEvent> {
    const actorId = input.actor.type === "anonymous" ? null : input.actor.id ?? null;
    const actorSessionId = input.actor.type === "user" ? input.actor.sessionId ?? null : null;
    const event = await this.database.auditEvent.create({
      data: {
        actorType: input.actor.type,
        actorId,
        actorSessionId,
        action: input.action,
        targetType: input.target.type,
        targetId: input.target.id ?? null,
        occurredAt: input.occurredAt,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });

    return {
      id: event.id,
      actor: input.actor,
      action: event.action,
      target: input.target,
      occurredAt: event.occurredAt,
      metadata: event.metadata as AuditMetadata,
    };
  }
}
