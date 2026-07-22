import type {
  CursorPage,
  CursorPageRequest,
  EconomySnapshotDTO,
  OpportunityDTO,
  PointsLedgerEntryDTO,
  ProfileDTO,
  RewardDTO,
  SupportConversationDTO,
  TaskVersionDTO,
  UserTaskDTO,
  InstructionVersionDTO,
  ForecastVersionDTO,
} from "@/lib/domain";

export interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileDTO | null>;
}

export interface OpportunityFilter {
  readonly userId: string;
  readonly status?: "PUBLISHED" | "ARCHIVED";
}

export interface OpportunityRepository {
  findVisibleForUser(filter: OpportunityFilter, page: CursorPageRequest): Promise<CursorPage<OpportunityDTO>>;
  findByIdForUser(opportunityId: string, userId: string): Promise<OpportunityDTO | null>;
}

export interface TaskRepository {
  findPublishedVersion(taskDefinitionId: string): Promise<TaskVersionDTO | null>;
  findUserTask(userTaskId: string, ownerId: string): Promise<UserTaskDTO | null>;
}

export interface ConsentRepository {
  hasAcceptedRequiredVersions(userId: string, at: Date): Promise<boolean>;
}

export interface InstructionRepository {
  findPublishedForUser(instructionId: string, userId: string): Promise<InstructionVersionDTO | null>;
}

export interface EconomyRepository {
  getSnapshot(userId: string): Promise<EconomySnapshotDTO>;
  listPointEntries(userId: string, page: CursorPageRequest): Promise<CursorPage<PointsLedgerEntryDTO>>;
  appendPointEntry(entry: PointsLedgerEntryDTO, idempotencyKey: string): Promise<PointsLedgerEntryDTO>;
}

export interface RewardRepository {
  findByIdForUser(rewardId: string, userId: string): Promise<RewardDTO | null>;
  listForUser(userId: string, page: CursorPageRequest): Promise<CursorPage<RewardDTO>>;
}

export interface SupportRepository {
  findConversationForUser(conversationId: string, userId: string): Promise<SupportConversationDTO | null>;
  listForUser(userId: string, page: CursorPageRequest): Promise<CursorPage<SupportConversationDTO>>;
}

export interface ForecastRepository {
  findVisibleVersion(forecastId: string, userId: string, at: Date): Promise<ForecastVersionDTO | null>;
}
