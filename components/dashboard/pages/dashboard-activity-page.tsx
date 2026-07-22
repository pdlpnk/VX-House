import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import type { ActivityEventView } from "@/lib/platform-operations";

export function DashboardActivityPage({ events }: { events: ActivityEventView[] }) {
  return <DashboardPage><DashboardHeading eyebrow="Прозрачная хронология" title="Активность" description="Серверная история изменений заданий, прогресса, Rewards, поддержки и уведомлений." action={<StatusPill tone="neutral">{events.length} событий</StatusPill>} /><ActivityTimeline events={events} /><Link className={styles.pageBackLink} href="/dashboard"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link></DashboardPage>;
}
