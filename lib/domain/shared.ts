export type EntityId<TEntity extends string> = string & {
  readonly __entity: TEntity;
};

export interface VersionIdentifier {
  readonly aggregateId: string;
  readonly version: number;
}

export interface Money {
  readonly amount: string;
  readonly currency: string;
}

export interface CursorPageRequest {
  readonly cursor?: string;
  readonly limit: number;
}

export interface CursorPage<TItem> {
  readonly items: readonly TItem[];
  readonly nextCursor: string | null;
}

export type SortDirection = "asc" | "desc";

export interface SortRule<TField extends string> {
  readonly field: TField;
  readonly direction: SortDirection;
}

export interface IdempotentCommand<TPayload> {
  readonly idempotencyKey: string;
  readonly payload: TPayload;
}

export interface ActorContext {
  readonly actorId: string;
  readonly sessionId: string | null;
}

export interface OwnedResourceReference {
  readonly resourceType: string;
  readonly resourceId: string;
  readonly ownerId: string;
}

export function assertIsoCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error("Currency must be a three-letter ISO 4217 code");
  }
  return normalized;
}

export function assertIdempotencyKey(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 8 || normalized.length > 160) {
    throw new Error("Idempotency key must contain between 8 and 160 characters");
  }
  return normalized;
}
