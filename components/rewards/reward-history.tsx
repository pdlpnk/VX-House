"use client";

import { ArrowLeft, CircleDashed, FileClock, Info } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";
import { useI18n } from "@/components/i18n/i18n-provider";

export function RewardHistory({ rewards, catalogHref }: { rewards: RewardView[]; catalogHref: string }) {
  const { locale, t } = useI18n();
  const events = rewards.flatMap((reward) => reward.history.map((event) => ({ ...event, rewardTitle: reward.title, rewardId: reward.id }))).sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title={t("rewardUi.history")} description={t("rewardUi.fullHistory")} action={<Button asChild variant="outline"><Link href={catalogHref}><ArrowLeft aria-hidden="true" />{t("rewardUi.toBenefits")}</Link></Button>} /><div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>{t("rewardUi.historySeparateTitle")}</strong> {t("rewardUi.historySeparateText")}</p></div>{events.length === 0 ? <Card className={styles.rewardHistoryEmpty}><span><FileClock aria-hidden="true" /></span><small>{t("rewardUi.historyEmpty")}</small><h2>{t("rewardUi.noEvents")}</h2><p>{t("rewardUi.historyAfterFirst")}</p></Card> : <div className={styles.economyEntityList}>{events.map((event) => <article key={event.id}><span><CircleDashed aria-hidden="true" /></span><div><small>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}</small><h3>{event.rewardTitle}</h3><p>{event.reason}</p><RewardStatusPill status={event.toStatus} /></div></article>)}</div>}</DashboardPage>;
}
