import { ArrowLeft, CircleDashed, FileClock, Info } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";

export function RewardHistory({ rewards, catalogHref }: { rewards: RewardView[]; catalogHref: string }) {
  const events = rewards.flatMap((reward) => reward.history.map((event) => ({ ...event, rewardTitle: reward.title, rewardId: reward.id }))).sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title="История Rewards" description="Неизменяемая серверная хронология оснований, решений и предоставления преимуществ." action={<Button asChild variant="outline"><Link href={catalogHref}><ArrowLeft aria-hidden="true" />К каталогу</Link></Button>} /><div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>История отделена от VX Points.</strong> Каждый переход статуса содержит причину и время.</p></div>{events.length === 0 ? <Card className={styles.rewardHistoryEmpty}><span><FileClock aria-hidden="true" /></span><small>Пустое состояние</small><h2>Событий VX Rewards пока нет</h2><p>История появится после первого серверного назначения Reward.</p></Card> : <div className={styles.economyEntityList}>{events.map((event) => <article key={event.id}><span><CircleDashed aria-hidden="true" /></span><div><small>{new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}</small><h3>{event.rewardTitle}</h3><p>{event.reason}</p><RewardStatusPill status={event.toStatus} /></div></article>)}</div>}</DashboardPage>;
}
