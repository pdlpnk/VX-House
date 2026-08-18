"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import type { ActivityEventView } from "@/lib/platform-operations";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function PartnerHistoryPage({ events }: { events: ActivityEventView[] }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].partner.history;
  return <DashboardPage><DashboardHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} action={<StatusPill tone="neutral">{copy.count.replace("{count}", String(events.length))}</StatusPill>} /><ActivityTimeline events={events} /><Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> {copy.back}</Link></DashboardPage>;
}
