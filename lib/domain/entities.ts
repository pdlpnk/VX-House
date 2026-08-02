import type { Money, VersionIdentifier } from "./shared";

export type ProductRole = "PLAYER" | "PARTNER";
export type MarketCode = "TR" | "AZ";
export type LanguageCode = "EN" | "RU" | "TR" | "AZ";

export interface ProfileDTO {
  readonly userId: string;
  readonly displayName: string | null;
  readonly productRole: ProductRole;
  readonly market: MarketCode;
  readonly preferredLanguage: LanguageCode;
  readonly contactStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  readonly accountStatus: AccountStatus;
}

export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface AudienceDTO {
  readonly role: ProductRole;
  readonly market: MarketCode;
}

export interface OpportunityDTO {
  readonly id: string;
  readonly type: "TASK" | "INSTRUCTION" | "PROMOCODE" | "FORECAST" | "PERSONAL_CONDITION";
  readonly title: string;
  readonly description: string;
  readonly status: PublicationStatus;
  readonly nextStep: string;
  readonly audiences: readonly AudienceDTO[];
}

export type PublicationStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";

export interface InstructionVersionDTO extends VersionIdentifier {
  readonly status: PublicationStatus;
  readonly title: string;
  readonly summary: string;
  readonly language: LanguageCode;
  readonly contentHash: string;
}

export interface TaskVersionDTO extends VersionIdentifier {
  readonly status: PublicationStatus;
  readonly title: string;
  readonly termsHash: string;
  readonly instructionVersionId: string | null;
  readonly audiences: readonly AudienceDTO[];
}

export interface UserTaskDTO {
  readonly id: string;
  readonly userId: string;
  readonly taskVersionId: string;
  readonly status: UserTaskStatus;
  readonly attemptNumber: number;
}

export type UserTaskStatus =
  | "AVAILABLE"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "AWAITING_SUBMISSION"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CLARIFICATION_REQUIRED"
  | "RESUBMISSION_REQUIRED"
  | "CONFIRMED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface SubmissionVersionDTO extends VersionIdentifier {
  readonly userTaskId: string;
  readonly status: "DRAFT" | "SUBMITTED" | "WITHDRAWN";
  readonly contentHash: string;
}

export interface PointsLedgerEntryDTO {
  readonly id: string;
  readonly userId: string;
  readonly delta: number;
  readonly status: "PENDING" | "CONFIRMED" | "REVERSED";
  readonly sourceType: string;
  readonly sourceId: string;
  readonly reason: string;
  readonly occurredAt: Date;
}

export type RankCode = "EXPLORER" | "NAVIGATOR" | "ATLAS" | "PRIME" | "SIGNATURE";

export interface EconomySnapshotDTO {
  readonly userId: string;
  readonly confirmedPoints: number;
  readonly trustScore: number | null;
  readonly currentRank: RankCode | null;
  readonly calculatedAt: Date;
}

export interface RewardDTO {
  readonly id: string;
  readonly userId: string;
  readonly typeKey: string;
  readonly status: RewardStatus;
  readonly monetaryValue: Money | null;
  readonly nonMonetaryValue: Readonly<Record<string, unknown>> | null;
  readonly reason: string;
}

export type RewardStatus =
  | "EXPECTED"
  | "AWAITING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "AVAILABLE"
  | "PROVIDED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface SupportConversationDTO {
  readonly id: string;
  readonly userId: string;
  readonly status: SupportConversationStatus;
  readonly category: string;
  readonly priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  readonly subject: string;
}

export type SupportConversationStatus =
  | "CREATED"
  | "ASSIGNED"
  | "WAITING_OPERATOR"
  | "WAITING_USER"
  | "RESOLVED"
  | "CLOSED";

export interface ForecastVersionDTO extends VersionIdentifier {
  readonly language: LanguageCode;
  readonly status: ForecastPublicationStatus;
  readonly validFrom: Date;
  readonly validUntil: Date;
  readonly disclaimer: string;
}

export type ForecastPublicationStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "RETRACTED"
  | "ARCHIVED";
