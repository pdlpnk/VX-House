export type DomainBoundaryKey =
  | "identity-profile"
  | "market-localization"
  | "consent"
  | "partner-services"
  | "opportunities"
  | "instructions"
  | "tasks-submissions"
  | "vx-points"
  | "ranks"
  | "trust-score"
  | "vx-rewards"
  | "support-appeals"
  | "forecasts-content"
  | "notifications"
  | "admin-operations"
  | "audit-security";

export interface DomainBoundaryDefinition {
  readonly key: DomainBoundaryKey;
  readonly owns: readonly string[];
  readonly dependsOn: readonly DomainBoundaryKey[];
}

export const domainBoundaries: readonly DomainBoundaryDefinition[] = [
  { key: "identity-profile", owns: ["UserProfile", "PlayerProfile", "PartnerProfile"], dependsOn: ["market-localization"] },
  { key: "market-localization", owns: ["Market", "MarketCode", "LanguageCode"], dependsOn: [] },
  { key: "consent", owns: ["ConsentDocument", "ConsentVersion", "UserConsent"], dependsOn: ["identity-profile"] },
  { key: "partner-services", owns: ["PartnerService", "PartnerServiceMarket", "Promocode"], dependsOn: ["market-localization"] },
  { key: "opportunities", owns: ["Opportunity", "OpportunityAudience", "OpportunityEligibility"], dependsOn: ["identity-profile", "partner-services"] },
  { key: "instructions", owns: ["Instruction", "InstructionVersion", "InstructionStep", "InstructionAudience"], dependsOn: ["market-localization"] },
  { key: "tasks-submissions", owns: ["TaskDefinition", "TaskVersion", "UserTask", "TaskSubmission", "SubmissionVersion", "SubmissionReview"], dependsOn: ["opportunities", "instructions"] },
  { key: "vx-points", owns: ["VXPointsLedgerEntry"], dependsOn: ["tasks-submissions"] },
  { key: "ranks", owns: ["RankDefinition", "UserRank"], dependsOn: ["vx-points", "trust-score"] },
  { key: "trust-score", owns: ["TrustScoreEvent", "TrustScoreSnapshot"], dependsOn: ["tasks-submissions"] },
  { key: "vx-rewards", owns: ["RewardType", "VXReward", "RewardStatusHistory"], dependsOn: ["tasks-submissions"] },
  { key: "support-appeals", owns: ["SupportConversation", "SupportMessage", "SupportInternalNote", "Appeal"], dependsOn: ["identity-profile"] },
  { key: "forecasts-content", owns: ["Forecast", "ForecastVersion", "ForecastAccessRule"], dependsOn: ["identity-profile", "market-localization", "ranks"] },
  { key: "notifications", owns: ["Notification"], dependsOn: ["identity-profile"] },
  { key: "admin-operations", owns: ["manager assignments", "publication and review commands"], dependsOn: ["audit-security"] },
  { key: "audit-security", owns: ["Role", "Permission", "AuditEvent", "security policies"], dependsOn: [] },
] as const;
