"use client";

import { ArrowRight, BadgePercent, Banknote, ChartNoAxesCombined, Gift, SlidersHorizontal, Ticket, type LucideIcon } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyRole } from "@/lib/economy-data";
import { rewardTypes, type RewardTypeId } from "@/lib/reward-data";
import { cn } from "@/lib/utils";

const rewardIcons: Record<RewardTypeId, LucideIcon> = {
  cashback: BadgePercent,
  money: Banknote,
  forecast: ChartNoAxesCombined,
  personal: Gift,
  promo: Ticket,
  custom: SlidersHorizontal,
};

export function RewardCatalog({ role, basePath, historyHref }: { role: EconomyRole; basePath: string; historyHref: string }) {
  const items = rewardTypes.filter((reward) => reward.roles.includes(role));
  return <DashboardPage>
    <DashboardHeading eyebrow="VX Rewards" title="Каталог типов преимуществ" description="Справочник будущей системы Rewards. Карточки не назначены пользователю, не содержат реальных значений и не подтверждают право на преимущество." action={<StatusPill tone="neutral">Демонстрационный каталог</StatusPill>} />
    <section className={styles.rewardCatalogIntro} aria-labelledby="reward-catalog-title">
      <div><span>Отдельно от VX Points</span><h2 id="reward-catalog-title">Reward отвечает на вопрос «что предоставлено»</h2><p>Каждый тип получит собственные условия, основание, статус и историю. Денежные и неденежные Rewards не складываются в общий баланс.</p></div>
      <Link className={cn(buttonVariants({ variant: "outline" }), styles.structureLink)} href={historyHref}>История Rewards <ArrowRight aria-hidden="true" /></Link>
    </section>
    <DashboardGrid className={styles.rewardCatalogGrid}>
      {items.map((reward) => {
        const Icon = rewardIcons[reward.id];
        return <DashboardGridItem key={reward.id}><Card className={styles.rewardCatalogCard}><header><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">Не назначено</StatusPill></header><small>{reward.category}</small><h2>{reward.title}</h2><p>{reward.description}</p><dl><div><dt>Значение</dt><dd>Нет данных</dd></div><div><dt>Связанное задание</dt><dd>Не назначено</dd></div><div><dt>Текущий статус</dt><dd>Нет данных</dd></div></dl><Link href={`${basePath}/${reward.id}`}>Изучить структуру <ArrowRight aria-hidden="true" /></Link></Card></DashboardGridItem>;
      })}
    </DashboardGrid>
  </DashboardPage>;
}
