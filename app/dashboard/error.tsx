"use client";

import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <DashboardErrorState reset={reset} />;
}
