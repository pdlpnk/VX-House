import type { AppendAuditEventInput, StoredAuditEvent } from "@/lib/audit";

export interface AuditRepository {
  append(input: AppendAuditEventInput): Promise<StoredAuditEvent>;
}
