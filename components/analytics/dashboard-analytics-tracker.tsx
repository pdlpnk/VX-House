"use client";

import { useEffect } from "react";

export function DashboardAnalyticsTracker() {
  useEffect(() => {
    void fetch("/api/analytics/dashboard-opened", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: "{}",
    }).catch(() => {});
  }, []);

  return null;
}
