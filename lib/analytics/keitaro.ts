import "server-only";

import type { AnalyticsEventName } from "./types";

export interface KeitaroConfig {
  readonly enabled: boolean;
  readonly postbackUrl?: string;
  readonly requestTimeoutMs: number;
  readonly maxRetries: number;
  readonly dashboardStatus?: string;
}

export function keitaroStatus(eventName: AnalyticsEventName, dashboardStatus?: string) {
  if (eventName === "email_confirmed") return "lead";
  if (eventName === "dashboard_opened") return dashboardStatus ?? null;
  return null;
}

export function keitaroTransactionId(eventName: AnalyticsEventName, stableEventId: string) {
  return `vx-${eventName.replaceAll("_", "-")}-${stableEventId}`;
}

export function buildKeitaroPostbackUrl(baseUrl: string, input: { subid: string; status: string; transactionId: string }) {
  const url = new URL(baseUrl);
  url.searchParams.set("subid", input.subid);
  url.searchParams.set("status", input.status);
  url.searchParams.set("tid", input.transactionId);
  return url;
}
