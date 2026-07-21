"use client";

import { ArrowRight, Award, CircleGauge, Coins, Info, Route, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { economyEntities, getEconomySnapshot, rankOrder, rewardPreviews, type EconomyRole } from "@/lib/economy-data";

const entityIcons = { points: Coins, trust: CircleGauge, rank: Route, rewards: Award } as const;

export function EconomyOverview({ role, historyHref, rewardsHref }: { role: EconomyRole; historyHref: string; rewardsHref: string }) {
  const snapshot = getEconomySnapshot(role);

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Экономика пользователя"
        title="Прогресс без скрытых условий"
        description="VX Points, Trust Score, ранг и VX Rewards — четыре независимые сущности. Сейчас показана демонстрационная структура без персональных расчётов."
        action={<StatusPill tone="neutral">Демонстрация интерфейса</StatusPill>}
      />

      <div className={styles.economyDisclosure} role="note">
        <Info aria-hidden="true" />
        <p><strong>Персональные данные экономики не подключены.</strong> Нулевые значения не подставляются: отсутствие данных показано явно и не имитирует достижения.</p>
      </div>

      <DashboardGrid className={styles.economyMetricGrid}>
        <DashboardGridItem><MetricCard icon={Coins} label="Подтверждённый прогресс" title="VX Points" value={snapshot.points} status="Не начислены" description="Появятся только после подтверждённого события. Не являются деньгами." /></DashboardGridItem>
        <DashboardGridItem><MetricCard icon={CircleGauge} label="Качество истории" title="Trust Score" value={snapshot.trustScore} status="Не рассчитан" description="Значение и зона появятся вместе с объяснимыми причинами изменений." /></DashboardGridItem>
        <DashboardGridItem><MetricCard icon={ShieldCheck} label="Уровень участия" title="Текущий ранг" value={snapshot.currentRank} status="Не определён" description="Ранг будет определён по настроенным и раскрытым критериям." /></DashboardGridItem>
        <DashboardGridItem><MetricCard icon={Route} label="Путь развития" title="Следующий ранг" value={snapshot.nextRank} status="Нет данных" description="Прогресс не рассчитывается, пока нет подтверждённых критериев." progress /></DashboardGridItem>
      </DashboardGrid>

      <section className={styles.rankSystem} aria-labelledby="rank-system-title">
        <div className={styles.economySectionHeading}>
          <div><span>Система рангов</span><h2 id="rank-system-title">Пять последовательных уровней</h2><p>Это справочник системы, а не присвоенный пользователю статус. Требования задаются конфигурацией и показываются до действия.</p></div>
        </div>
        <ol className={styles.rankLadder}>{rankOrder.map((rank, index) => <li key={rank}><span>{index + 1}</span><strong>{rank}</strong><small>Критерии не подключены</small></li>)}</ol>
      </section>

      <section className={styles.economySection} aria-labelledby="entities-title">
        <div className={styles.economySectionHeading}>
          <div><span>Как устроена система</span><h2 id="entities-title">Каждая сущность отвечает на свой вопрос</h2></div>
          <Button asChild variant="outline"><Link href={historyHref}>Открыть историю <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        <div className={styles.economyEntityList}>
          {economyEntities.map((entity) => {
            const Icon = entityIcons[entity.id];
            return <article key={entity.id}><span><Icon aria-hidden="true" /></span><div><small>{entity.shortDescription}</small><h3>{entity.title}</h3><p>{entity.explanation}</p><em>{entity.boundary}</em></div></article>;
          })}
        </div>
      </section>

      <section className={styles.economySection} aria-labelledby="rewards-title">
        <div className={styles.economySectionHeading}><div><span>Будущие VX Rewards</span><h2 id="rewards-title">Преимущества появятся только после подтверждения</h2><p>Карточки показывают предусмотренные типы, но ничего не обещают и не выданы пользователю.</p></div><Button asChild variant="outline"><Link href={rewardsHref}>Открыть VX Rewards <ArrowRight aria-hidden="true" /></Link></Button></div>
        <div className={styles.rewardPreviewGrid}>
          {rewardPreviews.map((reward) => <Card key={reward.id} className={styles.rewardPreviewCard}><div><Award aria-hidden="true" /><StatusPill tone="neutral">Нет данных</StatusPill></div><small>{reward.type}</small><h3>{reward.title}</h3><p>{reward.description}</p><footer>Не назначено · не подтверждено</footer></Card>)}
        </div>
      </section>
    </DashboardPage>
  );
}

function MetricCard({ icon: Icon, label, title, value, status, description, progress = false }: { icon: typeof Coins; label: string; title: string; value: string | number | null; status: string; description: string; progress?: boolean }) {
  return <Card className={styles.economyMetricCard}><header><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">{status}</StatusPill></header><small>{label}</small><h2>{title}</h2><strong>{value ?? "Нет данных"}</strong>{progress && <div className={styles.emptyProgressTrack} aria-label="Прогресс не рассчитан"><i /></div>}<p>{description}</p></Card>;
}
