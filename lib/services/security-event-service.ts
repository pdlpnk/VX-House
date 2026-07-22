import "server-only";

import type { SecurityEvent } from "@/lib/security";
import type { AuditService } from "./audit-service";

export class SecurityEventService {
  constructor(private readonly audit: AuditService) {}

  record(event: SecurityEvent) {
    return this.audit.record({
      actor: event.actor,
      action: event.type,
      target: event.target,
      metadata: event.metadata,
    });
  }
}
