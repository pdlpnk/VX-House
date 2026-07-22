export type AuditMetadataScalar = string | number | boolean | null;
export type AuditMetadataValue =
  | AuditMetadataScalar
  | readonly AuditMetadataValue[]
  | Readonly<{ [key: string]: AuditMetadataValue }>;
export type AuditMetadata = Readonly<Record<string, AuditMetadataValue>>;

export type AuditActor =
  | Readonly<{ type: "system"; id?: string }>
  | Readonly<{ type: "anonymous" }>
  | Readonly<{ type: "user"; id: string; sessionId?: string }>;

export interface AuditTarget {
  readonly type: string;
  readonly id?: string;
}

export interface AppendAuditEventInput {
  readonly actor: AuditActor;
  readonly action: string;
  readonly target: AuditTarget;
  readonly occurredAt: Date;
  readonly metadata: AuditMetadata;
}

export interface StoredAuditEvent extends AppendAuditEventInput {
  readonly id: string;
}
