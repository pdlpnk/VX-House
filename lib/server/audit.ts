import "server-only";

import { getDatabase } from "@/lib/db";
import { PrismaAuditRepository } from "@/lib/repositories";
import { AuditService, SecurityEventService } from "@/lib/services";

export function createAuditSystem() {
  const repository = new PrismaAuditRepository(getDatabase());
  const audit = new AuditService(repository);
  return Object.freeze({ audit, securityEvents: new SecurityEventService(audit), repository });
}

export type AuditSystem = ReturnType<typeof createAuditSystem>;
