"use client";

import { CircleDashed, FileClock, Info } from "lucide-react";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { EconomyHistoryView } from "@/lib/economy";

export function EconomyHistory({ history }: { history: EconomyHistoryView }) {
  const { locale, t } = useI18n();
  const kindLabel = { POINTS: "VX Points", RANK: t("history.level"), REWARD: "VX Reward" } as const;
  const items = history.items.filter((event) => event.kind !== "TRUST");
  return <DashboardPage>
    <DashboardHeading eyebrow={t("economy.eyebrow")} title={t("history.title")} description={t("history.description")} />
    <div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>{t("history.disclosureTitle")}</strong> {t("history.disclosureText")}</p></div>
    {items.length === 0 ? <Card className={styles.economyHistoryEmpty}><span><FileClock aria-hidden="true" /></span><small>{t("history.emptyLabel")}</small><h2>{t("history.emptyTitle")}</h2><p>{t("history.emptyText")}</p><div className={styles.economyEventTypes}>{Object.values(kindLabel).map((type) => <StatusPill key={type} tone="neutral">{type}</StatusPill>)}</div></Card> : <div className={styles.economyEntityList}>{items.map((event) => { const date = "occurredAt" in event ? event.occurredAt : event.assignedAt; const title = event.kind === "POINTS" ? `${event.delta > 0 ? "+" : ""}${event.delta} VX Points` : event.kind === "RANK" ? event.label : event.rewardTitle; return <article key={`${event.kind}-${event.id}`}><span><CircleDashed aria-hidden="true" /></span><div><small>{kindLabel[event.kind]} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))}</small><h3>{title}</h3><p>{event.reason}</p></div></article>; })}</div>}
  </DashboardPage>;
}
