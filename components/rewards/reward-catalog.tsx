import { ArrowRight, Gift } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";
import { cn } from "@/lib/utils";

export function RewardCatalog({ items, basePath, historyHref }: { items: RewardView[]; basePath: string; historyHref: string }) {
  return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title="Ваши преимущества" description="У каждого преимущества есть понятное основание, актуальный статус и полная история." action={<StatusPill tone="neutral">Актуальные данные</StatusPill>} /><section className={styles.rewardCatalogIntro} aria-labelledby="reward-catalog-title"><div><span>Отдельно от VX Points</span><h2 id="reward-catalog-title">Reward показывает, какое преимущество вы получили</h2><p>Денежные и неденежные Rewards не складываются в общий баланс.</p></div><Link className={cn(buttonVariants({ variant: "outline" }), styles.structureLink)} href={historyHref}>История Rewards <ArrowRight aria-hidden="true" /></Link></section>
    {items.length === 0 ? <Card className={styles.noDataPanel}><Gift aria-hidden="true" /><h2>Назначенных VX Rewards пока нет</h2><p>Здесь появятся преимущества после подтверждённых действий и решений команды VX House.</p></Card> : <DashboardGrid className={styles.rewardCatalogGrid}>{items.map((reward) => <DashboardGridItem key={reward.id}><Card className={styles.rewardCatalogCard}><header><span><Gift aria-hidden="true" /></span><RewardStatusPill status={reward.status} /></header><small>{reward.typeName}</small><h2>{reward.title}</h2><p>{reward.description}</p><dl><div><dt>Значение</dt><dd>{reward.amount && reward.currency ? `${reward.amount} ${reward.currency}` : reward.valueKind === "NON_MONETARY" ? "Неденежное преимущество" : "Не указано"}</dd></div><div><dt>Связанное задание</dt><dd>{reward.userTaskId ? "Есть основание" : "Не связано"}</dd></div><div><dt>Доступность</dt><dd>{reward.availabilityReason}</dd></div></dl><Link href={`${basePath}/${reward.id}`}>Открыть Reward <ArrowRight aria-hidden="true" /></Link></Card></DashboardGridItem>)}</DashboardGrid>}
  </DashboardPage>;
}
