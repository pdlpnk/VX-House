"use client";

import type { AccessPlacement, ClientAnalyticsCommand } from "./types";

function attribution() {
  const url = new URL(window.location.href);
  const value = (key: string) => url.searchParams.get(key) ?? undefined;
  return {
    subid: value("subid"), clickid: value("clickid"),
    utm_source: value("utm_source"), utm_medium: value("utm_medium"),
    utm_campaign: value("utm_campaign"), utm_content: value("utm_content"), utm_term: value("utm_term"),
    referrer: document.referrer || undefined,
    landing_path: `${url.pathname}${url.hash}`,
  };
}

export async function trackAnalyticsEvent(command: Omit<ClientAnalyticsCommand, "attribution">) {
  try {
    const request = fetch("/api/analytics/events", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...command, attribution: attribution() }),
    });
    await Promise.race([
      request,
      new Promise<void>((resolve) => window.setTimeout(resolve, 750)),
    ]);
  } catch {}
}

export function accessPlacement(desktop: Exclude<AccessPlacement, "mobile_navigation">): AccessPlacement {
  return desktop === "header" && window.matchMedia("(max-width: 32.499rem)").matches
    ? "mobile_navigation"
    : desktop;
}
