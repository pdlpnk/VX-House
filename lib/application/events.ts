import type { Prisma } from "@/lib/db";
import { PrismaAuditRepository } from "@/lib/repositories";
import { AuditService, SecurityEventService } from "@/lib/services";

export function createTransactionalEventServices(database: Prisma.TransactionClient, occurredAt: Date) {
  const audit = new AuditService(new PrismaAuditRepository(database), () => occurredAt);
  return Object.freeze({ audit, security: new SecurityEventService(audit) });
}
