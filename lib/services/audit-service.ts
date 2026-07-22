import "server-only";

import { sanitizeAuditMetadata, type AuditActor, type AuditMetadata, type AuditTarget } from "@/lib/audit";
import type { AuditRepository } from "@/lib/repositories";

const EVENT_KEY_PATTERN = /^[a-z][a-z0-9_.:-]{2,159}$/;
const TARGET_TYPE_PATTERN = /^[a-z][a-z0-9_.:-]{1,119}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_.:@/-]{1,160}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface RecordAuditEventInput {
  readonly actor: AuditActor;
  readonly action: string;
  readonly target: AuditTarget;
  readonly metadata?: AuditMetadata;
}

function validateInput(input: RecordAuditEventInput) {
  if (!EVENT_KEY_PATTERN.test(input.action)) throw new TypeError("Некорректное audit action");
  if (!TARGET_TYPE_PATTERN.test(input.target.type)) throw new TypeError("Некорректный audit target type");
  if (input.target.id && !IDENTIFIER_PATTERN.test(input.target.id)) {
    throw new TypeError("Некорректный audit target id");
  }
  if (input.actor.type !== "anonymous" && input.actor.id && !IDENTIFIER_PATTERN.test(input.actor.id)) {
    throw new TypeError("Некорректный audit actor id");
  }
  if (input.actor.type === "user" && input.actor.sessionId && !UUID_PATTERN.test(input.actor.sessionId)) {
    throw new TypeError("Некорректный audit actor session id");
  }
}

export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  record(input: RecordAuditEventInput) {
    validateInput(input);
    return this.repository.append({
      ...input,
      occurredAt: this.clock(),
      metadata: sanitizeAuditMetadata(input.metadata),
    });
  }
}
