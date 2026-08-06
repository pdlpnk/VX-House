export const ANALYTICS_EVENT_NAMES = [
  "landing_viewed",
  "access_clicked",
  "registration_started",
  "email_confirmed",
  "dashboard_opened",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export const ACCESS_PLACEMENTS = ["header", "hero", "process", "final_cta", "mobile_navigation"] as const;
export type AccessPlacement = (typeof ACCESS_PLACEMENTS)[number];

export interface FirstTouchInput {
  readonly subid?: unknown;
  readonly clickid?: unknown;
  readonly utm_source?: unknown;
  readonly utm_medium?: unknown;
  readonly utm_campaign?: unknown;
  readonly utm_content?: unknown;
  readonly utm_term?: unknown;
  readonly referrer?: unknown;
  readonly landing_path?: unknown;
}

export interface FirstTouch {
  readonly subid: string | null;
  readonly utm_source: string | null;
  readonly utm_medium: string | null;
  readonly utm_campaign: string | null;
  readonly utm_content: string | null;
  readonly utm_term: string | null;
  readonly referrer: string | null;
  readonly landing_path: string;
  readonly created_at: string;
}

export interface ClientAnalyticsCommand {
  readonly eventName: "landing_viewed" | "access_clicked" | "registration_started";
  readonly clientEventId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly attribution?: FirstTouchInput;
}

export interface FunnelStage {
  readonly count: number;
  readonly rate: number;
}

export interface FunnelReport {
  readonly from: string;
  readonly to: string;
  readonly landingViewed: number;
  readonly accessClicked: FunnelStage;
  readonly registrationStarted: FunnelStage;
  readonly emailConfirmed: FunnelStage;
  readonly dashboardOpened: FunnelStage;
}

