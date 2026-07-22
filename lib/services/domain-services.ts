import type {
  ActorContext,
  CursorPage,
  CursorPageRequest,
  IdempotentCommand,
  OpportunityDTO,
  ProfileDTO,
  RewardDTO,
  UserTaskDTO,
  InstructionVersionDTO,
  SupportConversationDTO,
  ForecastVersionDTO,
} from "@/lib/domain";

export interface ProfileService {
  getOwnProfile(actor: ActorContext): Promise<ProfileDTO>;
}

export interface OpportunityService {
  listAvailable(actor: ActorContext, page: CursorPageRequest): Promise<CursorPage<OpportunityDTO>>;
  getVisible(actor: ActorContext, opportunityId: string): Promise<OpportunityDTO>;
}

export interface AcceptTaskPayload {
  readonly taskDefinitionId: string;
}

export interface TaskService {
  accept(actor: ActorContext, command: IdempotentCommand<AcceptTaskPayload>): Promise<UserTaskDTO>;
  transition(actor: ActorContext, userTaskId: string, targetStatus: UserTaskDTO["status"]): Promise<UserTaskDTO>;
}

export interface InstructionService {
  getApplicableVersion(actor: ActorContext, instructionId: string): Promise<InstructionVersionDTO>;
}

export interface PointsCommandPayload {
  readonly userId: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly ruleVersion: string;
  readonly delta: number;
  readonly reason: string;
}

export interface EconomyService {
  appendConfirmedPoints(actor: ActorContext, command: IdempotentCommand<PointsCommandPayload>): Promise<void>;
}

export interface RewardService {
  getVisible(actor: ActorContext, rewardId: string): Promise<RewardDTO>;
  transition(actor: ActorContext, rewardId: string, targetStatus: RewardDTO["status"], reason: string): Promise<RewardDTO>;
}

export interface SupportService {
  getConversation(actor: ActorContext, conversationId: string): Promise<SupportConversationDTO>;
}

export interface ForecastService {
  getVisibleVersion(actor: ActorContext, forecastId: string, at: Date): Promise<ForecastVersionDTO>;
}
