import "server-only";

import { AnalyticsService, AttributionCookieManager } from "@/lib/analytics/server";
import { getServerConfig } from "@/lib/config";
import { getDatabase } from "@/lib/db";

const globalAnalytics = globalThis as typeof globalThis & { vxHouseAnalytics?: AnalyticsService };

export function getAnalyticsSystem() {
  const config = getServerConfig();
  const service = globalAnalytics.vxHouseAnalytics ?? new AnalyticsService(getDatabase(), {
    enabled: config.analytics.keitaro.enabled,
    postbackUrl: config.analytics.keitaro.postbackUrl?.reveal(),
    requestTimeoutMs: config.analytics.keitaro.requestTimeoutMs,
    maxRetries: config.analytics.keitaro.maxRetries,
    dashboardStatus: config.analytics.keitaro.dashboardStatus,
  });
  if (globalThis.navigator?.userAgent !== "Cloudflare-Workers") globalAnalytics.vxHouseAnalytics = service;
  return Object.freeze({
    service,
    cookies: new AttributionCookieManager(config.runtime.environment === "production"),
  });
}

export function scheduleAnalyticsDelivery() {
  const system = getAnalyticsSystem();
  queueMicrotask(() => void system.service.deliverPending().catch(() => {}));
}

