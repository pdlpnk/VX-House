import { ArrowLeft, CircleDashed, FileClock, Info } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyHistoryView } from "@/lib/economy";

const kindLabel = { POINTS: "VX Points", TRUST: "Trust Score", RANK: "Ранг", REWARD: "VX Reward" } as const;
export function EconomyHistory({ history, overviewHref }: { history: EconomyHistoryView; overviewHref: string }) {
  return <DashboardPage><DashboardHeading eyebrow="Экономика пользователя" title="История экономики" description="Неизменяемая серверная хронология причин и решений по каждой экономической сущности." action={<Button asChild variant="outline"><Link href={overviewHref}><ArrowLeft aria-hidden="true" />К обзору экономики</Link></Button>} />
    <div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>История не переписывается.</strong> Корректировки создаются отдельными событиями с причиной.</p></div>
    {history.items.length === 0 ? <Card className={styles.economyHistoryEmpty}><span><FileClock aria-hidden="true" /></span><small>Пустое состояние</small><h2>Экономических событий пока нет</h2><p>Подтверждённые серверные события появятся здесь автоматически.</p><div className={styles.economyEventTypes}>{Object.values(kindLabel).map((type) => <StatusPill key={type} tone="neutral">{type}</StatusPill>)}</div></Card> : <div className={styles.economyEntityList}>{history.items.map((event) => { const date = "occurredAt" in event ? event.occurredAt : event.assignedAt; const title = event.kind === "POINTS" ? `${event.delta > 0 ? "+" : ""}${event.delta} VX Points` : event.kind === "TRUST" ? `Trust ${event.scoreBefore} → ${event.scoreAfter}` : event.kind === "RANK" ? event.label : event.rewardTitle; const reason = event.reason; return <article key={`${event.kind}-${event.id}`}><span><CircleDashed aria-hidden="true" /></span><div><small>{kindLabel[event.kind]} · {new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))}</small><h3>{title}</h3><p>{reason}</p><em>Серверное событие</em></div></article>; })}</div>}
  </DashboardPage>;
}
