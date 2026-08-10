"use client";

import { ArrowRight, Award, Coins, Gift, Medal, TrendingUp } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyHistoryView, EconomySnapshotView, RankCode } from "@/lib/economy";
import { useI18n } from "@/components/i18n/i18n-provider";

const levelNames: Record<RankCode, string> = {
  EXPLORER: "Bronze",
  NAVIGATOR: "Silver",
  ATLAS: "Gold",
  PRIME: "Platinum",
  SIGNATURE: "Diamond",
};

const levels = [
  { name: "Bronze", threshold: 0, benefitKey: "economy.levelBronze" as const },
  { name: "Silver", threshold: 1_000, benefitKey: "economy.levelSilver" as const },
  { name: "Gold", threshold: 2_500, benefitKey: "economy.levelGold" as const },
  { name: "Platinum", threshold: 5_000, benefitKey: "economy.levelPlatinum" as const },
  { name: "Diamond", threshold: 10_000, benefitKey: "economy.levelDiamond" as const },
] as const;

export function EconomyOverview({
  snapshot,
  history,
  historyHref,
  rewardsHref,
}: {
  snapshot: EconomySnapshotView;
  history: EconomyHistoryView;
  historyHref: string;
  rewardsHref: string;
}) {
  const { locale, t } = useI18n();
  const pointsEvents = history.items.filter((event) => event.kind === "POINTS");
  const rewardEvents = history.items.filter((event) => event.kind === "REWARD");
  const currentLevel = snapshot.rank.current ? levelNames[snapshot.rank.current.code] : "Bronze";
  const currentIndex = Math.max(0, levels.findIndex((level) => level.name === currentLevel));
  const nextLevel = levels[currentIndex + 1] ?? null;
  const balance = snapshot.points.confirmedBalance;
  const progress = nextLevel
    ? Math.min(100, Math.round(((balance - levels[currentIndex].threshold) / (nextLevel.threshold - levels[currentIndex].threshold)) * 100))
    : 100;
  const calculatedAt = new Date(snapshot.calculatedAt).getTime();
  const monthGrowth = pointsEvents
    .filter((event) => event.status === "CONFIRMED" && new Date(event.occurredAt).getTime() >= calculatedAt - 31 * 24 * 60 * 60 * 1000)
    .reduce((sum, event) => sum + event.delta, 0);
  const chartValues = buildChart(pointsEvents, calculatedAt, t("economy.now"), t("economy.daysShort"));

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={t("economy.eyebrow")}
        title={t("economy.title")}
        description={t("economy.description")}
        action={<StatusPill tone="brand">{currentLevel}</StatusPill>}
      />

      <section className={styles.progressHero} aria-labelledby="progress-balance-title">
        <div>
          <span><Coins aria-hidden="true" /></span>
          <small>{t("economy.availableNow")}</small>
          <h2 id="progress-balance-title">{balance.toLocaleString(locale)} <em>VX Points</em></h2>
          <p>{t("economy.pointsDescription")}</p>
        </div>
        <dl>
          <div><dt>{t("economy.monthGrowth")}</dt><dd>+{Math.max(0, monthGrowth).toLocaleString(locale)}</dd></div>
          <div><dt>{t("economy.rewardsReceived")}</dt><dd>{snapshot.rewards.total}</dd></div>
          <div><dt>{t("economy.currentLevel")}</dt><dd>{currentLevel}</dd></div>
        </dl>
      </section>

      <section className={styles.progressChartCard} aria-labelledby="progress-chart-title">
        <header>
          <div><small>{t("economy.pointsDynamics")}</small><h2 id="progress-chart-title">{t("economy.monthAccruals")}</h2></div>
          <TrendingUp aria-hidden="true" />
        </header>
        <div className={styles.progressChart} aria-label={t("economy.monthGrowthAria", { points: Math.max(0, monthGrowth) })}>
          {chartValues.map((item) => (
            <div key={item.label}>
              <i style={{ height: `${Math.max(8, item.percent)}%` }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.levelProgressCard} aria-labelledby="level-progress-title">
        <header>
          <div><small>{t("economy.currentLevel")}</small><h2 id="level-progress-title">{currentLevel}</h2></div>
          <Medal aria-hidden="true" />
        </header>
        {nextLevel ? (
          <>
            <div className={styles.levelProgressCopy}>
              <p>{t("economy.toLevel", { level: nextLevel.name })}</p>
              <strong>{Math.max(0, nextLevel.threshold - balance).toLocaleString(locale)} VX Points</strong>
            </div>
            <div className={styles.emptyProgressTrack} aria-label={t("economy.levelProgress", { level: nextLevel.name, progress })}><i style={{ width: `${progress}%` }} /></div>
          </>
        ) : <p className={styles.levelMaximum}>{t("economy.maximumLevel")}</p>}
        <ol className={styles.playerLevelList}>
          {levels.map((level, index) => (
            <li key={level.name} data-current={index === currentIndex || undefined}>
              <span>{index + 1}</span>
              <div><strong>{level.name}</strong><p>{t(level.benefitKey)}</p></div>
              <small>{index === currentIndex ? t("economy.current") : t("economy.pointsCount", { points: level.threshold.toLocaleString(locale) })}</small>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.progressDetailGrid}>
        <Card className={styles.progressListCard}>
          <header><div><small>{t("economy.latestOperations")}</small><h2>{t("economy.accrualHistory")}</h2></div><Coins aria-hidden="true" /></header>
          {pointsEvents.length ? (
            <ul>{pointsEvents.slice(0, 4).map((event) => <li key={event.id}><div><strong>{event.reason}</strong><time dateTime={event.occurredAt}>{formatDate(locale, event.occurredAt)}</time></div><em>{event.delta > 0 ? "+" : ""}{event.delta}</em></li>)}</ul>
          ) : <p className={styles.progressEmpty}>{t("economy.noAccruals")}</p>}
          <Button asChild variant="outline"><Link href={historyHref}>{t("economy.fullHistory")} <ArrowRight aria-hidden="true" /></Link></Button>
        </Card>

        <Card className={styles.progressListCard}>
          <header><div><small>{t("economy.benefits")}</small><h2>{t("economy.latestRewards")}</h2></div><Gift aria-hidden="true" /></header>
          {snapshot.rewards.latest.length ? (
            <ul>{snapshot.rewards.latest.slice(0, 4).map((reward) => <li key={reward.id}><div><strong>{reward.title}</strong><span>{reward.description}</span></div><StatusPill tone={reward.status === "AVAILABLE" || reward.status === "PROVIDED" ? "success" : "neutral"}>{t(rewardStatusKey(reward.status))}</StatusPill></li>)}</ul>
          ) : rewardEvents.length ? (
            <ul>{rewardEvents.slice(0, 4).map((event) => <li key={`${event.rewardId}-${event.id}`}><div><strong>{event.rewardTitle}</strong><span>{event.reason}</span></div><Award aria-hidden="true" /></li>)}</ul>
          ) : <p className={styles.progressEmpty}>{t("economy.noRewards")}</p>}
          <Button asChild variant="outline"><Link href={rewardsHref}>{t("economy.allRewards")} <ArrowRight aria-hidden="true" /></Link></Button>
        </Card>
      </div>
    </DashboardPage>
  );
}

function buildChart(events: EconomyHistoryView["items"], calculatedAt: number, now: string, days: string) {
  const pointEvents = events.filter((event) => event.kind === "POINTS");
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  pointEvents.forEach((event) => {
    const daysAgo = Math.floor((calculatedAt - new Date(event.occurredAt).getTime()) / (24 * 60 * 60 * 1000));
    const bucket = Math.max(0, Math.min(6, 6 - Math.floor(daysAgo / 5)));
    buckets[bucket] += Math.max(0, event.delta);
  });
  const max = Math.max(...buckets, 1);
  return buckets.map((value, index) => ({ label: index === 6 ? now : `${30 - index * 5} ${days}`, percent: Math.round(value / max * 100) }));
}

function formatDate(locale: string, value: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(value));
}

function rewardStatusKey(status: EconomySnapshotView["rewards"]["latest"][number]["status"]) {
  return ({ AVAILABLE: "economy.rewardAvailable", PROVIDED: "economy.rewardProvided", PREPARING: "economy.rewardPreparing", EXPECTED: "economy.rewardExpected", AWAITING_CONFIRMATION: "economy.rewardReview", CONFIRMED: "economy.rewardConfirmed", REJECTED: "economy.rewardRejected", CANCELLED: "economy.rewardCancelled", EXPIRED: "economy.rewardExpired" } as const)[status];
}
