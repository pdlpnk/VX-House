export const adminSectionIds = ["users", "services", "opportunities", "tasks", "reviews", "rewards", "economy", "support", "content", "notifications", "team", "audit", "settings"] as const;
export type AdminSectionId = (typeof adminSectionIds)[number];

export type AdminFieldView = Readonly<{ label: string; value: string; help?: string }>;
export type AdminRecordView = Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  nextStep: string;
  fields: readonly AdminFieldView[];
  occurredAt?: string;
  editable?: boolean;
}>;

export type AdminSectionView = Readonly<{
  items: readonly AdminRecordView[];
  total: number;
  nextCursor: string | null;
}>;

export type AdminDashboardView = Readonly<{
  users: number;
  registrationsToday: number;
  activeTasks: number;
  openSupport: number;
  pointsEntries: number;
  rewardsInProgress: number;
  pendingReviews: number;
  pendingAppeals: number;
  calculatedAt: string;
}>;

export type AdminListQuery = Readonly<{
  search?: string;
  status?: string;
  role?: "PLAYER" | "PARTNER";
  market?: "TR" | "AZ";
  cursor?: string;
  take?: number;
}>;

export type ContentKind = "OPPORTUNITY" | "INSTRUCTION" | "TASK" | "REWARD" | "FORECAST" | "PROMOCODE";
export type ContentDraftInput = Readonly<{
  kind: ContentKind;
  title: string;
  description: string;
  key?: string;
  role?: "PLAYER" | "PARTNER";
  market?: "TR" | "AZ";
  nextStep?: string;
  instructionVersionId?: string;
  disclaimer?: string;
  validFrom?: string;
  validUntil?: string;
  partnerServiceId?: string;
  code?: string;
  reason: string;
}>;

export type AdminCommand =
  | Readonly<{ action: "USER_STATUS"; status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED"; reason: string }>
  | Readonly<{ action: "USER_ROLE"; role: "PLAYER" | "PARTNER"; reason: string }>
  | Readonly<{ action: "PARTNER_APPROVAL"; status: "ACTIVE" | "SUSPENDED" | "CLOSED"; reason: string }>
  | Readonly<{ action: "CONTENT_DRAFT"; content: ContentDraftInput }>
  | Readonly<{ action: "CONTENT_PUBLISH" | "CONTENT_ARCHIVE"; reason: string }>
  | Readonly<{ action: "MODERATION_DECISION"; decision: "CONFIRMED" | "REJECTED" | "CLARIFICATION_REQUIRED" | "RESUBMISSION_REQUIRED"; reasonCode: string; reason: string; comment?: string }>
  | Readonly<{ action: "SUPPORT_ASSIGN"; operatorId: string; reason: string }>
  | Readonly<{ action: "SUPPORT_REPLY" | "SUPPORT_NOTE"; body: string }>
  | Readonly<{ action: "SUPPORT_STATUS"; status: "ASSIGNED" | "WAITING_OPERATOR" | "WAITING_USER" | "RESOLVED" | "CLOSED"; reason: string }>
  | Readonly<{ action: "APPEAL_DECISION"; appealId: string; status: "UPHELD" | "PARTIALLY_UPHELD" | "DENIED"; reason: string }>
  | Readonly<{ action: "ECONOMY_ADJUST"; userId: string; kind: "POINTS" | "TRUST"; delta: number; reason: string; idempotencyKey: string }>
  | Readonly<{ action: "NOTIFY"; userId?: string; role?: "PLAYER" | "PARTNER"; market?: "TR" | "AZ"; type: string; title: string; body: string; idempotencyKey: string }>;
