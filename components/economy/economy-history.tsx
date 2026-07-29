import { CircleDashed, FileClock, Info } from "lucide-react";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import type { EconomyHistoryView } from "@/lib/economy";

const kindLabel = { POINTS: "VX Points", RANK: "Уровень", REWARD: "VX Reward" } as const;

export function EconomyHistory({ history }: { history: EconomyHistoryView }) {
  const items = history.items.filter((event) => event.kind !== "TRUST");
  return <DashboardPage>
    <DashboardHeading eyebrow="Мой прогресс" title="История прогресса" description="Все начисления, уровни и награды в хронологическом порядке." />
    <div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>Каждое изменение сохраняется.</strong> Вы всегда можете увидеть дату и причину начисления.</p></div>
    {items.length === 0 ? <Card className={styles.economyHistoryEmpty}><span><FileClock aria-hidden="true" /></span><small>История пуста</small><h2>Событий пока нет</h2><p>Здесь появятся начисления, новые уровни и полученные награды.</p><div className={styles.economyEventTypes}>{Object.values(kindLabel).map((type) => <StatusPill key={type} tone="neutral">{type}</StatusPill>)}</div></Card> : <div className={styles.economyEntityList}>{items.map((event) => { const date = "occurredAt" in event ? event.occurredAt : event.assignedAt; const title = event.kind === "POINTS" ? `${event.delta > 0 ? "+" : ""}${event.delta} VX Points` : event.kind === "RANK" ? event.label : event.rewardTitle; return <article key={`${event.kind}-${event.id}`}><span><CircleDashed aria-hidden="true" /></span><div><small>{kindLabel[event.kind]} · {new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))}</small><h3>{title}</h3><p>{event.reason}</p></div></article>; })}</div>}
  </DashboardPage>;
}
