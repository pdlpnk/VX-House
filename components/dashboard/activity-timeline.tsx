"use client";

import { ArrowRight, History } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n";
import type { ActivityEventView } from "@/lib/platform-operations";

const labels: Record<ActivityEventView["category"], MessageKey | null> = { TASK: "page.task", POINTS: null, TRUST: "dashboard.event", RANK: "workspace.currentLevel", REWARD: "page.reward", SUPPORT: "nav.manager", NOTIFICATION: "workspace.notifications", PROMOCODE: null };

export function ActivityTimeline({ events }: { events: ActivityEventView[] }) {
  const { locale, t } = useI18n();
  if (!events.length) return <section className={styles.activityEmpty}><div className={styles.emptyStateIcon}><History aria-hidden="true" /></div><small>{t("activity.empty")}</small><h2>{t("activity.noEvents")}</h2><p>{t("activity.emptyDescription")}</p></section>;
  return <ol className={styles.activityTimeline}>{events.map((event) => {
    const labelKey = labels[event.category];
    return <li key={event.id}><span aria-hidden="true" /><article><header><div><small>{labelKey ? t(labelKey) : event.category === "POINTS" ? "VX Points" : "Promocode"}</small><h2>{event.title}</h2></div><StatusPill tone="neutral">{event.status}</StatusPill></header><p>{event.description}</p><footer><time dateTime={event.occurredAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(event.occurredAt))}</time>{event.href ? <Link href={event.href}>{t("activity.open")} <ArrowRight aria-hidden="true" /></Link> : null}</footer></article></li>;
  })}</ol>;
}
