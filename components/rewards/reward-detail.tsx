"use client";

import { ArrowLeft, CircleDashed, Gift, Headphones, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
import { RewardLifecycle } from "@/components/rewards/reward-lifecycle";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";
import { useI18n } from "@/components/i18n/i18n-provider";

export function RewardDetail({ reward, role, basePath, supportHref }: { reward: RewardView | null; role: "player" | "partner"; basePath: string; supportHref: string }) {
  const { t } = useI18n();
  if (!reward) return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title={t("rewardUi.notFound")} description={t("rewardUi.notFoundText")} /><Card className={styles.noDataPanel}><CircleDashed aria-hidden="true" /><h2>{t("rewardUi.cardUnavailable")}</h2><p>{t("rewardUi.returnList")}</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />{t("rewardUi.back")}</Link></DashboardPage>;
  const appealable = ["REJECTED", "CANCELLED", "EXPIRED"].includes(reward.status);
  return <DashboardPage><DashboardHeading eyebrow={t("rewardUi.card")} title={reward.title} description={reward.description} action={<RewardStatusPill status={reward.status} />} /><section className={styles.rewardDetailHero}><span><Gift aria-hidden="true" /></span><div><small>{reward.typeName} · {t("rewardUi.current")}</small><h2>{reward.availabilityReason}</h2><p>{reward.valueKind === "MONETARY" ? t("rewardUi.moneyText") : t("rewardUi.nonMoneyText")}</p></div><dl><div><dt><UserRound aria-hidden="true" /> {t("rewardUi.scenario")}</dt><dd>{role === "player" ? t("rewardUi.player") : t("rewardUi.partner")}</dd></div><div><dt><MapPin aria-hidden="true" /> {t("rewardUi.availability")}</dt><dd>{reward.availability}</dd></div><div><dt><Gift aria-hidden="true" /> {t("rewardUi.value")}</dt><dd>{reward.amount && reward.currency ? `${reward.amount} ${reward.currency}` : t("rewardUi.nonMonetaryShort")}</dd></div></dl></section><RewardLifecycle reward={reward} /><div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={supportHref}><Headphones aria-hidden="true" />{appealable ? t("rewardUi.discuss") : t("rewardUi.manager")}</Link><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />{t("rewardUi.back")}</Link></div></DashboardPage>;
}
