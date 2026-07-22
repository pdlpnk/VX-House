"use client";

import {
  ArrowRight,
  Award,
  Bell,
  CircleGauge,
  ClipboardList,
  Coins,
  History,
  Inbox,
  LockKeyhole,
  Route,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import {
  DashboardCard,
  DashboardGrid,
  DashboardGridItem,
  DashboardHeading,
  DashboardPage,
  StatusPill,
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { EconomySnapshotView } from "@/lib/economy";
import type { PromocodeView, WorkspaceSummary } from "@/lib/platform-operations";
import { PromocodeCatalog } from "@/components/partner/promocode-catalog";
import { ForecastCatalog } from "@/components/forecasts/forecast-catalog";
import type { ForecastView } from "@/lib/platform-operations";

const preparedSections = [
  {
    title: "Задания",
    description: "Доступные и активные задания из серверного каталога.",
    icon: ClipboardList,
    href: "/dashboard/opportunities",
  },
  {
    title: "VX Rewards",
    description: "Подтверждённые преимущества и их серверные статусы.",
    icon: Award,
    href: "/dashboard/rewards",
  },
  {
    title: "История",
    description: "Изменения Points, Trust и ранга будут собраны в прозрачной хронологии.",
    icon: History,
    href: "/dashboard/economy/history",
  },
  {
    title: "Уведомления",
    description: "Важные обновления заданий, экономики и поддержки.",
    icon: Bell,
    href: "/dashboard",
  },
] as const;

export function DashboardHome({ economy, summary, forecasts, promocodes }: { economy: EconomySnapshotView; summary: WorkspaceSummary; forecasts: ForecastView[]; promocodes: PromocodeView[] }) {
  const { profile } = useDashboard();

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Кабинет игрока"
        title="Обзор прогресса"
        description={`Профиль ${profile?.user.displayName ?? "игрока"} подтверждён. Все показатели рассчитаны по серверной истории VX House.`}
        action={<StatusPill tone="success">Доступ подтверждён</StatusPill>}
      />

      <DashboardGrid className={styles.homeGrid}>
        <DashboardGridItem className={styles.heroGridItem}>
          <section className={styles.playerHero}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}><Route aria-hidden="true" /> Рекомендуемый следующий шаг</span>
              <h2>{summary.recommended?.title ?? "Проверить доступные возможности"}</h2>
              <p>{summary.recommended?.description ?? "Сейчас нет рекомендуемой возможности. Каталог обновится после публикации применимых условий."}</p>
              <Button asChild size="lg"><Link href={summary.recommended?.href ?? "/dashboard/opportunities"}>Открыть следующий шаг <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <div className={styles.heroStatus} aria-label="Состояние профиля игрока">
              <div><span>Профиль</span><strong>Подтверждён</strong></div>
              <div><span>Роль</span><strong>Игрок</strong></div>
              <div><span>Непрочитанные события</span><strong>{summary.unreadNotifications}</strong></div>
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem className={styles.rankGridItem}>
          <DashboardCard icon={ShieldCheck} label="Серверный расчёт" title="Текущий ранг" action={<StatusPill tone="neutral">{economy.rank.current ? "Назначен" : "Не определён"}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.rank.current?.label ?? "Нет данных"}</strong>
            <p className={styles.metricCaption}>{economy.rank.current ? "Основание сохранено в истории ранга." : "Опубликованные критерии ещё не определили ранг."}</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.trustGridItem}>
          <DashboardCard icon={CircleGauge} label={economy.trust.zone ?? "Серверный расчёт"} title="Trust Score" action={<StatusPill tone="neutral">{economy.trust.score === null ? "Нет данных" : "Актуально"}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.trust.score ?? "Нет данных"}</strong>
            <p className={styles.metricCaption}>{economy.trust.explanation}</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.pointsGridItem}>
          <DashboardCard icon={Coins} label="Подтверждённый баланс" title="VX Points" action={<StatusPill tone="neutral">Серверные данные</StatusPill>}>
            <strong className={styles.metricValue}>{economy.points.confirmedBalance}</strong>
            <p className={styles.metricCaption}>VX Points не являются деньгами; неподтверждённые события не включены.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.progressGridItem}>
          <DashboardCard icon={Route} label="Путь участника" title="Прогресс до следующего ранга" action={<StatusPill tone="neutral">{economy.rank.next?.label ?? "Нет данных"}</StatusPill>}>
            <div className={styles.rankProgress}>
              <div><span>Подтверждённые критерии</span><strong>{economy.rank.next ? `${economy.rank.next.criteria.filter((item) => item.completed).length} из ${economy.rank.next.criteria.length}` : "Нет данных"}</strong></div>
              <div className={styles.progressTrack} aria-label="Прогресс по критериям"><i style={{ width: economy.rank.next?.criteria.length ? `${economy.rank.next.criteria.filter((item) => item.completed).length / economy.rank.next.criteria.length * 100}%` : 0 }} /></div>
              <p>{economy.rank.next ? economy.rank.next.criteria.map((item) => `${item.label}: ${item.completed ? "выполнено" : `${item.current} из ${item.required}`}`).join(" · ") : "Следующий ранг не определён опубликованной конфигурацией."}</p>
            </div>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.statsGridItem}>
          <DashboardCard icon={Inbox} label="Краткая статистика" title="Текущая активность">
            <dl className={styles.emptyStats}>
              <div><dt>Активные задания</dt><dd>{summary.activeTasks}</dd></div>
              <div><dt>Завершённые задания</dt><dd>{summary.completedTasks}</dd></div>
              <div><dt>Доступные Rewards</dt><dd>{summary.rewards}</dd></div>
              <div><dt>Дней с VX House</dt><dd>{summary.daysWithPlatform}</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.preparedGridItem}>
          <DashboardCard icon={LockKeyhole} label="Подготовленная структура" title="Следующие разделы продукта">
            <div className={styles.preparedSections}>
              {preparedSections.map(({ title, description, icon: Icon, href }) => (
                <Link key={title} href={href}>
                  <span><Icon aria-hidden="true" /></span>
                  <div><strong>{title}</strong><p>{description}</p></div>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
      {forecasts.length ? <section className={styles.dashboardEmbeddedSection}><div><small>Аналитические материалы</small><h2>Доступные прогнозы</h2></div><ForecastCatalog forecasts={forecasts} /></section> : null}
      {promocodes.length ? <section className={styles.dashboardEmbeddedSection}><div><small>Персональные условия</small><h2>Доступные промокоды</h2></div><PromocodeCatalog initialItems={promocodes} /></section> : null}
    </DashboardPage>
  );
}
