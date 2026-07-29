import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import type { ActivityEventView } from "@/lib/platform-operations";

export function DashboardActivityPage({ events }: { events: ActivityEventView[] }) {
  const visibleEvents = events.filter((event) => event.category !== "TRUST");
  return <DashboardPage><DashboardHeading eyebrow="Ваши события" title="Активность" description="История заданий, начислений, наград, поддержки и уведомлений." action={<StatusPill tone="neutral">{visibleEvents.length} событий</StatusPill>} /><ActivityTimeline events={visibleEvents} /></DashboardPage>;
}
