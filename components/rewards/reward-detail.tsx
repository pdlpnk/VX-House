"use client";

import { ArrowLeft, BadgePercent, Banknote, ChartNoAxesCombined, CircleDashed, Gift, Headphones, MapPin, SlidersHorizontal, Ticket, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { RewardLifecycle } from "@/components/rewards/reward-lifecycle";
import { Card } from "@/components/ui/card";
import type { EconomyRole } from "@/lib/economy-data";
import { getRewardType, type RewardTypeId } from "@/lib/reward-data";

const rewardIcons: Record<RewardTypeId, LucideIcon> = { cashback: BadgePercent, money: Banknote, forecast: ChartNoAxesCombined, personal: Gift, promo: Ticket, custom: SlidersHorizontal };

export function RewardDetail({ id, role, basePath, supportHref }: { id: string; role: EconomyRole; basePath: string; supportHref: string }) {
  const reward = getRewardType(id, role);
  if (!reward) return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title="Нет данных" description="Тип Reward не найден или недоступен для выбранной роли." action={<StatusPill tone="neutral">Не найдено</StatusPill>} /><Card className={styles.noDataPanel}><CircleDashed aria-hidden="true" /><h2>Карточка Reward отсутствует</h2><p>Вернитесь в каталог и выберите демонстрационный тип системы.</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться к VX Rewards</Link></DashboardPage>;
  const Icon = rewardIcons[reward.id];
  return <DashboardPage>
    <DashboardHeading eyebrow="Карточка VX Reward" title={reward.title} description={reward.description} action={<StatusPill tone="neutral">Не назначено</StatusPill>} />
    <section className={styles.rewardDetailHero}>
      <span><Icon aria-hidden="true" /></span>
      <div><small>{reward.category} · демонстрационная структура</small><h2>Преимущество не выдано пользователю</h2><p>{reward.valueRule} {reward.provisionRule}</p></div>
      <dl><div><dt><UserRound aria-hidden="true" /> Роль</dt><dd>{role === "player" ? "Игрок" : "Партнёр"}</dd></div><div><dt><MapPin aria-hidden="true" /> Рынок</dt><dd>Определяется условиями</dd></div><div><dt><Gift aria-hidden="true" /> Значение</dt><dd>Нет данных</dd></div></dl>
    </section>
    <RewardLifecycle reward={reward} />
    <div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={supportHref}><Headphones aria-hidden="true" />Открыть Центр поддержки</Link><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться к каталогу VX Rewards</Link></div>
  </DashboardPage>;
}
