export type ForecastView = Readonly<{
  id: string;
  key: string;
  title: string;
  author: string;
  version: number;
  language: "EN" | "RU" | "TR" | "AZ";
  status: "PUBLISHED" | "SUPERSEDED" | "RETRACTED" | "ARCHIVED";
  summary: string;
  body: string;
  context: readonly string[];
  disclaimer: string;
  validFrom: string;
  validUntil: string;
  publishedAt: string | null;
  accessReason: string;
}>;

export type PromocodeView = Readonly<{
  id: string;
  key: string;
  partner: string;
  market: "TR" | "AZ";
  role: "PLAYER" | "PARTNER";
  instructions: string;
  validFrom: string;
  validUntil: string;
  availability: "AVAILABLE" | "ACTIVATED" | "EXPIRED";
  code: string | null;
  activation: null | Readonly<{ id: string; status: "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED"; activatedAt: string; expiresAt: string }>;
}>;

export type WorkspaceSummary = Readonly<{
  memberSince: string;
  daysWithPlatform: number;
  partnerStatus: string | null;
  activeTasks: number;
  completedTasks: number;
  rewards: number;
  openSupport: number;
  unreadNotifications: number;
  availableOpportunities: number;
  availableForecasts: number;
  availablePromocodes: number;
  recommended: null | Readonly<{ title: string; href: string; description: string }>;
}>;

export type ActivityEventView = Readonly<{
  id: string;
  category: "TASK" | "POINTS" | "TRUST" | "RANK" | "REWARD" | "SUPPORT" | "NOTIFICATION" | "PROMOCODE";
  title: string;
  description: string;
  status: string;
  occurredAt: string;
  href: string | null;
}>;

export type GlobalSearchResult = Readonly<{
  id: string;
  type: "OPPORTUNITY" | "TASK" | "FORECAST" | "REWARD" | "SUPPORT";
  title: string;
  description: string;
  href: string;
}>;
