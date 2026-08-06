"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

export function AnalyticsLandingTracker() {
  useEffect(() => { void trackAnalyticsEvent({ eventName: "landing_viewed" }); }, []);
  return null;
}

