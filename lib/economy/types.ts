export type ProductRole = "PLAYER" | "PARTNER";
export type RankCode = "EXPLORER" | "NAVIGATOR" | "ATLAS" | "PRIME" | "SIGNATURE";
export type RewardStatus = "EXPECTED" | "AWAITING_CONFIRMATION" | "CONFIRMED" | "PREPARING" | "AVAILABLE" | "PROVIDED" | "REJECTED" | "CANCELLED" | "EXPIRED";

export type EconomyCriterion = {
  key: "points" | "trust" | "confirmedTasks" | "manualApproval";
  label: string;
  current: number | boolean;
  required: number | boolean;
  completed: boolean;
};

export type RankView = {
  id: string;
  code: RankCode;
  label: string;
  version: number;
  benefits: string[];
  criteria: EconomyCriterion[];
};

export type PointsEntryView = {
  id: string;
  delta: number;
  status: "PENDING" | "CONFIRMED" | "REVERSED";
  sourceType: string;
  sourceId: string;
  reason: string;
  ruleVersion: string;
  occurredAt: string;
  reversesEntryId: string | null;
};

export type TrustEventView = {
  id: string;
  delta: number;
  scoreBefore: number;
  scoreAfter: number;
  eventType: string;
  sourceType: string;
  sourceId: string;
  reason: string;
  ruleVersion: string;
  isAppealable: boolean;
  occurredAt: string;
};

export type RankHistoryView = {
  id: string;
  code: RankCode;
  label: string;
  version: number;
  reason: string;
  assignedAt: string;
};

export type RewardHistoryView = {
  id: string;
  fromStatus: RewardStatus | null;
  toStatus: RewardStatus;
  reason: string;
  occurredAt: string;
};

export type RewardView = {
  id: string;
  typeKey: string;
  typeName: string;
  valueKind: "MONETARY" | "NON_MONETARY";
  status: RewardStatus;
  title: string;
  description: string;
  amount: string | null;
  currency: string | null;
  nonMonetaryValue: Record<string, unknown> | null;
  validFrom: string | null;
  validUntil: string | null;
  provisionDueAt: string | null;
  userTaskId: string | null;
  submissionReviewId: string | null;
  availability: "CLAIMABLE" | "NOT_READY" | "EXPIRED" | "COMPLETED";
  availabilityReason: string;
  history: RewardHistoryView[];
};

export type EconomyHistoryEvent =
  | ({ kind: "POINTS" } & PointsEntryView)
  | ({ kind: "TRUST" } & TrustEventView)
  | ({ kind: "RANK" } & RankHistoryView)
  | ({ kind: "REWARD"; rewardId: string; rewardTitle: string } & RewardHistoryView);

export type EconomySnapshotView = {
  configured: boolean;
  role: ProductRole;
  market: { code: "TR" | "AZ"; name: string };
  points: { confirmedBalance: number; pendingBalance: number };
  trust: { score: number | null; zone: string | null; explanation: string };
  rank: { current: RankView | null; next: RankView | null; history: RankHistoryView[] };
  rewards: { total: number; claimable: number; latest: RewardView[] };
  calculatedAt: string;
};

export type EconomyHistoryView = {
  items: EconomyHistoryEvent[];
};

export type EconomyRuleCommand = {
  userId: string;
  pointsRuleKey?: string;
  trustRuleKey?: string;
  sourceType: string;
  sourceId: string;
  reason: string;
  userTaskId?: string;
};
