import { ArrowRight, Award, CircleGauge, Coins, Info, Route, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomySnapshotView } from "@/lib/economy";

const rankOrder = ["Исследователь", "Навигатор", "Атлас", "Прайм", "Сигнатура"];
const entities = [
  { title: "VX Points", text: "Подтверждённый прогресс по опубликованным правилам. Не являются деньгами.", icon: Coins },
  { title: "Trust Score", text: "Объяснимый показатель качества истории с отдельными причинами каждого изменения.", icon: CircleGauge },
  { title: "Ранг", text: "Уровень участия, рассчитанный сервером по видимым критериям.", icon: Route },
  { title: "VX Rewards", text: "Отдельные преимущества со статусом, основанием и неизменяемой историей.", icon: Award },
] as const;

export function EconomyOverview({ snapshot, historyHref, rewardsHref }: { snapshot: EconomySnapshotView; historyHref: string; rewardsHref: string }) {
  const completed = snapshot.rank.next?.criteria.filter((item) => item.completed).length ?? 0;
  const criteriaCount = snapshot.rank.next?.criteria.length ?? 0;
  const progress = criteriaCount ? Math.round(completed / criteriaCount * 100) : 0;
  return <DashboardPage>
    <DashboardHeading eyebrow="Экономика пользователя" title="Прогресс без скрытых условий" description="VX Points, Trust Score, ранг и VX Rewards рассчитываются на сервере и сохраняют прозрачную историю оснований." action={<StatusPill tone={snapshot.configured ? "success" : "neutral"}>{snapshot.configured ? "Серверные данные" : "Нет конфигурации"}</StatusPill>} />
    {!snapshot.configured && <div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>Экономика пока не настроена для роли и рынка.</strong> Интерфейс не подставляет фиктивные значения.</p></div>}
    <DashboardGrid className={styles.economyMetricGrid}>
      <DashboardGridItem><MetricCard icon={Coins} label="Подтверждённый прогресс" title="VX Points" value={snapshot.points.confirmedBalance} status="Рассчитано сервером" description={snapshot.points.pendingBalance ? `Ожидают подтверждения: ${snapshot.points.pendingBalance}` : "Неподтверждённые события не входят в баланс."} /></DashboardGridItem>
      <DashboardGridItem><MetricCard icon={CircleGauge} label={snapshot.trust.zone ?? "Зона не определена"} title="Trust Score" value={snapshot.trust.score} status={snapshot.trust.score === null ? "Нет данных" : "Актуально"} description={snapshot.trust.explanation} /></DashboardGridItem>
      <DashboardGridItem><MetricCard icon={ShieldCheck} label="Уровень участия" title="Текущий ранг" value={snapshot.rank.current?.label ?? null} status={snapshot.rank.current ? "Назначен сервером" : "Не определён"} description={snapshot.rank.current ? "Основание назначения сохранено в истории." : "Ранг появится после опубликованной конфигурации и выполнения критериев."} /></DashboardGridItem>
      <DashboardGridItem><MetricCard icon={Route} label="Путь развития" title="Следующий ранг" value={snapshot.rank.next?.label ?? null} status={snapshot.rank.next ? `${completed} из ${criteriaCount}` : "Нет данных"} description={snapshot.rank.next ? "Каждый критерий показан отдельно." : "Следующий уровень сейчас не определён."} progress={progress} /></DashboardGridItem>
    </DashboardGrid>
    <section className={styles.rankSystem} aria-labelledby="rank-system-title"><div className={styles.economySectionHeading}><div><span>Система рангов</span><h2 id="rank-system-title">Пять последовательных уровней</h2><p>Назначение происходит только по опубликованным серверным критериям.</p></div></div><ol className={styles.rankLadder}>{rankOrder.map((rank, index) => <li key={rank}><span>{index + 1}</span><strong>{rank}</strong><small>{snapshot.rank.current?.label === rank ? "Текущий уровень" : "Серверная конфигурация"}</small></li>)}</ol></section>
    <section className={styles.economySection} aria-labelledby="entities-title"><div className={styles.economySectionHeading}><div><span>Как устроена система</span><h2 id="entities-title">Каждая сущность отвечает на свой вопрос</h2></div><Button asChild variant="outline"><Link href={historyHref}>Открыть историю <ArrowRight aria-hidden="true" /></Link></Button></div><div className={styles.economyEntityList}>{entities.map(({ title, text, icon: Icon }) => <article key={title}><span><Icon aria-hidden="true" /></span><div><small>Серверный источник</small><h3>{title}</h3><p>{text}</p><em>Клиент не изменяет значение</em></div></article>)}</div></section>
    <section className={styles.economySection} aria-labelledby="rewards-title"><div className={styles.economySectionHeading}><div><span>VX Rewards</span><h2 id="rewards-title">Назначенные преимущества</h2><p>{snapshot.rewards.total ? `Всего: ${snapshot.rewards.total}. Доступно к получению: ${snapshot.rewards.claimable}.` : "Назначенных Rewards пока нет."}</p></div><Button asChild variant="outline"><Link href={rewardsHref}>Открыть VX Rewards <ArrowRight aria-hidden="true" /></Link></Button></div>{snapshot.rewards.latest.length > 0 && <div className={styles.rewardPreviewGrid}>{snapshot.rewards.latest.map((reward) => <Card key={reward.id} className={styles.rewardPreviewCard}><div><Award aria-hidden="true" /><StatusPill tone="neutral">{reward.status}</StatusPill></div><small>{reward.typeName}</small><h3>{reward.title}</h3><p>{reward.description}</p><footer>{reward.availabilityReason}</footer></Card>)}</div>}</section>
  </DashboardPage>;
}

function MetricCard({ icon: Icon, label, title, value, status, description, progress }: { icon: typeof Coins; label: string; title: string; value: string | number | null; status: string; description: string; progress?: number }) {
  return <Card className={styles.economyMetricCard}><header><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">{status}</StatusPill></header><small>{label}</small><h2>{title}</h2><strong>{value ?? "Нет данных"}</strong>{progress !== undefined && <div className={styles.emptyProgressTrack} aria-label={`Выполнено ${progress}% критериев`}><i style={{ width: `${progress}%` }} /></div>}<p>{description}</p></Card>;
}
