"use client";

import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";

export default function PartnerDashboardError({ reset }: { error: Error; reset: () => void }) {
  return <DashboardErrorState reset={reset} />;
}
