import { ArrowLeft, CircleDashed, Gift, Headphones, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
import { RewardLifecycle } from "@/components/rewards/reward-lifecycle";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";

export function RewardDetail({ reward, role, basePath, supportHref }: { reward: RewardView | null; role: "player" | "partner"; basePath: string; supportHref: string }) {
  if (!reward) return <DashboardPage><DashboardHeading eyebrow="VX Rewards" title="Reward не найден" description="Запись отсутствует или принадлежит другому пользователю." /><Card className={styles.noDataPanel}><CircleDashed aria-hidden="true" /><h2>Карточка недоступна</h2><p>Вернитесь к списку назначенных преимуществ.</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться к VX Rewards</Link></DashboardPage>;
  const appealable = ["REJECTED", "CANCELLED", "EXPIRED"].includes(reward.status);
  return <DashboardPage><DashboardHeading eyebrow="Карточка VX Reward" title={reward.title} description={reward.description} action={<RewardStatusPill status={reward.status} />} /><section className={styles.rewardDetailHero}><span><Gift aria-hidden="true" /></span><div><small>{reward.typeName} · актуально сейчас</small><h2>{reward.availabilityReason}</h2><p>{reward.valueKind === "MONETARY" ? "Денежное значение отображается отдельно и не является балансом VX Points." : "Условия неденежного преимущества сохранены отдельно от VX Points."}</p></div><dl><div><dt><UserRound aria-hidden="true" /> Сценарий</dt><dd>{role === "player" ? "Игрок" : "Партнёр"}</dd></div><div><dt><MapPin aria-hidden="true" /> Доступность</dt><dd>{reward.availability}</dd></div><div><dt><Gift aria-hidden="true" /> Значение</dt><dd>{reward.amount && reward.currency ? `${reward.amount} ${reward.currency}` : "Неденежное"}</dd></div></dl></section><RewardLifecycle reward={reward} /><div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={supportHref}><Headphones aria-hidden="true" />{appealable ? "Обсудить решение с менеджером" : "Написать менеджеру"}</Link><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться к VX Rewards</Link></div></DashboardPage>;
}
