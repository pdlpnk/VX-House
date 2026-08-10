"use client";

import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { ActivityEventView } from "@/lib/platform-operations";

export function DashboardActivityPage({ events }: { events: ActivityEventView[] }) {
  const visibleEvents = events.filter((event) => event.category !== "TRUST");
  const { t } = useI18n();
  return <DashboardPage><DashboardHeading eyebrow={t("activity.yours")} title={t("page.activity")} description={t("activity.description")} action={<StatusPill tone="neutral">{t("activity.count", { count: visibleEvents.length })}</StatusPill>} /><ActivityTimeline events={visibleEvents} /></DashboardPage>;
}
