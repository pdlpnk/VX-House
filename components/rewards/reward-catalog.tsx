"use client";

import { ArrowRight, Gift } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

export function RewardCatalog({ items, basePath, historyHref }: { items: RewardView[]; basePath: string; historyHref: string }) {
  const { t } = useI18n();
  return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title={t("rewardUi.title")} description={t("rewardUi.description")} action={<StatusPill tone="neutral">{t("rewardUi.currentData")}</StatusPill>} /><section className={styles.rewardCatalogIntro} aria-labelledby="reward-catalog-title"><div><span>{t("rewardUi.separate")}</span><h2 id="reward-catalog-title">{t("rewardUi.explainer")}</h2><p>{t("rewardUi.balanceText")}</p></div><Link className={cn(buttonVariants({ variant: "outline" }), styles.structureLink)} href={historyHref}>{t("rewardUi.history")} <ArrowRight aria-hidden="true" /></Link></section>
    {items.length === 0 ? <Card className={styles.noDataPanel}><Gift aria-hidden="true" /><h2>{t("rewardUi.emptyTitle")}</h2><p>{t("rewardUi.emptyText")}</p></Card> : <DashboardGrid className={styles.rewardCatalogGrid}>{items.map((reward) => <DashboardGridItem key={reward.id}><Card className={styles.rewardCatalogCard}><header><span><Gift aria-hidden="true" /></span><RewardStatusPill status={reward.status} /></header><small>{reward.typeName}</small><h2>{reward.title}</h2><p>{reward.description}</p><dl><div><dt>{t("rewardUi.value")}</dt><dd>{reward.amount && reward.currency ? `${reward.amount} ${reward.currency}` : reward.valueKind === "NON_MONETARY" ? t("rewardUi.nonMonetary") : t("rewardUi.notSpecified")}</dd></div><div><dt>{t("rewardUi.relatedTask")}</dt><dd>{reward.userTaskId ? t("rewardUi.hasBasis") : t("rewardUi.notRelated")}</dd></div><div><dt>{t("rewardUi.availability")}</dt><dd>{reward.availabilityReason}</dd></div></dl><Link href={`${basePath}/${reward.id}`}>{t("rewardUi.open")} <ArrowRight aria-hidden="true" /></Link></Card></DashboardGridItem>)}</DashboardGrid>}
  </DashboardPage>;
}
