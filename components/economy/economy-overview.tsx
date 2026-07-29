import { ArrowRight, Award, Coins, Gift, Medal, TrendingUp } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyHistoryView, EconomySnapshotView, RankCode } from "@/lib/economy";

const levelNames: Record<RankCode, string> = {
  EXPLORER: "Bronze",
  NAVIGATOR: "Silver",
  ATLAS: "Gold",
  PRIME: "Platinum",
  SIGNATURE: "Diamond",
};

const levels = [
  { name: "Bronze", threshold: 0, benefit: "Стартовые задания и приветственные преимущества" },
  { name: "Silver", threshold: 1_000, benefit: "Расширенный выбор заданий и персональные предложения" },
  { name: "Gold", threshold: 2_500, benefit: "Приоритетные возможности и дополнительные бонусы" },
  { name: "Platinum", threshold: 5_000, benefit: "Закрытые условия и приоритетное сопровождение" },
  { name: "Diamond", threshold: 10_000, benefit: "Максимальный набор преимуществ VX House" },
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
  const chartValues = buildChart(pointsEvents, calculatedAt);

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Мой прогресс"
        title="Ваш путь в VX House"
        description="Баллы, уровни и полученные преимущества — в одном понятном пространстве."
        action={<StatusPill tone="brand">{currentLevel}</StatusPill>}
      />

      <section className={styles.progressHero} aria-labelledby="progress-balance-title">
        <div>
          <span><Coins aria-hidden="true" /></span>
          <small>Доступно сейчас</small>
          <h2 id="progress-balance-title">{balance.toLocaleString("ru-RU")} <em>VX Points</em></h2>
          <p>Бонусные баллы VX используются для получения преимуществ.</p>
        </div>
        <dl>
          <div><dt>Рост за месяц</dt><dd>+{Math.max(0, monthGrowth).toLocaleString("ru-RU")}</dd></div>
          <div><dt>Получено бонусов</dt><dd>{snapshot.rewards.total}</dd></div>
          <div><dt>Текущий уровень</dt><dd>{currentLevel}</dd></div>
        </dl>
      </section>

      <section className={styles.progressChartCard} aria-labelledby="progress-chart-title">
        <header>
          <div><small>Динамика баллов</small><h2 id="progress-chart-title">Начисления за месяц</h2></div>
          <TrendingUp aria-hidden="true" />
        </header>
        <div className={styles.progressChart} aria-label={`Рост за месяц: ${Math.max(0, monthGrowth)} VX Points`}>
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
          <div><small>Текущий уровень</small><h2 id="level-progress-title">{currentLevel}</h2></div>
          <Medal aria-hidden="true" />
        </header>
        {nextLevel ? (
          <>
            <div className={styles.levelProgressCopy}>
              <p>До уровня {nextLevel.name}</p>
              <strong>{Math.max(0, nextLevel.threshold - balance).toLocaleString("ru-RU")} VX Points</strong>
            </div>
            <div className={styles.emptyProgressTrack} aria-label={`Прогресс до уровня ${nextLevel.name}: ${progress}%`}><i style={{ width: `${progress}%` }} /></div>
          </>
        ) : <p className={styles.levelMaximum}>Достигнут максимальный уровень.</p>}
        <ol className={styles.playerLevelList}>
          {levels.map((level, index) => (
            <li key={level.name} data-current={index === currentIndex || undefined}>
              <span>{index + 1}</span>
              <div><strong>{level.name}</strong><p>{level.benefit}</p></div>
              <small>{index === currentIndex ? "Текущий" : `${level.threshold.toLocaleString("ru-RU")} баллов`}</small>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.progressDetailGrid}>
        <Card className={styles.progressListCard}>
          <header><div><small>Последние операции</small><h2>История начислений</h2></div><Coins aria-hidden="true" /></header>
          {pointsEvents.length ? (
            <ul>{pointsEvents.slice(0, 4).map((event) => <li key={event.id}><div><strong>{event.reason}</strong><time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time></div><em>{event.delta > 0 ? "+" : ""}{event.delta}</em></li>)}</ul>
          ) : <p className={styles.progressEmpty}>Начислений пока нет.</p>}
          <Button asChild variant="outline"><Link href={historyHref}>Вся история <ArrowRight aria-hidden="true" /></Link></Button>
        </Card>

        <Card className={styles.progressListCard}>
          <header><div><small>Преимущества</small><h2>Последние награды</h2></div><Gift aria-hidden="true" /></header>
          {snapshot.rewards.latest.length ? (
            <ul>{snapshot.rewards.latest.slice(0, 4).map((reward) => <li key={reward.id}><div><strong>{reward.title}</strong><span>{reward.description}</span></div><StatusPill tone={reward.status === "AVAILABLE" || reward.status === "PROVIDED" ? "success" : "neutral"}>{rewardStatus(reward.status)}</StatusPill></li>)}</ul>
          ) : rewardEvents.length ? (
            <ul>{rewardEvents.slice(0, 4).map((event) => <li key={`${event.rewardId}-${event.id}`}><div><strong>{event.rewardTitle}</strong><span>{event.reason}</span></div><Award aria-hidden="true" /></li>)}</ul>
          ) : <p className={styles.progressEmpty}>Награды появятся после выполнения подходящих заданий.</p>}
          <Button asChild variant="outline"><Link href={rewardsHref}>Все награды <ArrowRight aria-hidden="true" /></Link></Button>
        </Card>
      </div>
    </DashboardPage>
  );
}

function buildChart(events: EconomyHistoryView["items"], calculatedAt: number) {
  const pointEvents = events.filter((event) => event.kind === "POINTS");
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  pointEvents.forEach((event) => {
    const daysAgo = Math.floor((calculatedAt - new Date(event.occurredAt).getTime()) / (24 * 60 * 60 * 1000));
    const bucket = Math.max(0, Math.min(6, 6 - Math.floor(daysAgo / 5)));
    buckets[bucket] += Math.max(0, event.delta);
  });
  const max = Math.max(...buckets, 1);
  return buckets.map((value, index) => ({ label: index === 6 ? "Сейчас" : `${30 - index * 5} дн.`, percent: Math.round(value / max * 100) }));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(value));
}

function rewardStatus(status: EconomySnapshotView["rewards"]["latest"][number]["status"]) {
  return ({ AVAILABLE: "Доступна", PROVIDED: "Получена", PREPARING: "Готовится", EXPECTED: "Ожидается", AWAITING_CONFIRMATION: "Проверяется", CONFIRMED: "Подтверждена", REJECTED: "Отклонена", CANCELLED: "Отменена", EXPIRED: "Истекла" } as const)[status];
}
