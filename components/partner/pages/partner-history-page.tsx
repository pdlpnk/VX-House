import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import type { ActivityEventView } from "@/lib/platform-operations";

export function PartnerHistoryPage({ events }: { events: ActivityEventView[] }) {
  return <DashboardPage><DashboardHeading eyebrow="Прозрачная хронология" title="История сотрудничества" description="Проверяемые изменения партнёрского профиля, заданий, материалов, Rewards и поддержки." action={<StatusPill tone="neutral">{events.length} событий</StatusPill>} /><ActivityTimeline events={events} /><Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link></DashboardPage>;
}
