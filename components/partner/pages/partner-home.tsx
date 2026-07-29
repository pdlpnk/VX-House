"use client";

import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  Coins,
  History,
  Inbox,
  Route,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { EconomySnapshotView } from "@/lib/economy";
import type { WorkspaceSummary } from "@/lib/platform-operations";

const partnerAreas = [
  { title: "Партнёрские задания", description: "Доступные и активные задачи из серверного каталога.", icon: ClipboardList, href: "/partner/opportunities" },
  { title: "Инструкции и материалы", description: "Опубликованный рабочий контент для роли и рынка.", icon: BookOpenCheck, href: "/partner/materials" },
  { title: "Промокоды", description: "Коды, сроки и правила с серверной активацией.", icon: TicketPercent, href: "/partner/materials" },
  { title: "Ежедневные прогнозы", description: "Аналитические материалы с автором и сроком актуальности.", icon: ChartNoAxesCombined, href: "/partner/forecasts" },
  { title: "История сотрудничества", description: "Проверяемые изменения с датой, причиной и статусом.", icon: History, href: "/partner/history" },
] as const;

export function PartnerHome({ economy, summary }: { economy: EconomySnapshotView; summary: WorkspaceSummary }) {
  const { profile } = useDashboard();

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Кабинет партнёра"
        title="Рабочее пространство партнёра"
        description={`Партнёрское пространство ${profile?.user.displayName ?? "пользователя"} использует подтверждённые серверные данные роли и рынка.`}
        action={<StatusPill tone={summary.partnerStatus === "ACTIVE" ? "success" : "attention"}>{summary.partnerStatus === "ACTIVE" ? "Доступ одобрен" : "Ожидает одобрения"}</StatusPill>}
      />

      <DashboardGrid className={styles.homeGrid}>
        <DashboardGridItem className={styles.heroGridItem}>
          <section className={styles.playerHero}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}><Route aria-hidden="true" /> Рекомендуемый следующий шаг</span>
              <h2>{summary.recommended?.title ?? (summary.partnerStatus === "ACTIVE" ? "Открыть рабочие возможности" : "Проверить партнёрский профиль")}</h2>
              <p>{summary.recommended?.description ?? (summary.partnerStatus === "ACTIVE" ? "Применимых новых возможностей пока нет; доступные разделы синхронизированы с сервером." : "Рабочие возможности откроются после решения по партнёрскому доступу.")}</p>
              <Button asChild size="lg"><Link href={summary.recommended?.href ?? (summary.partnerStatus === "ACTIVE" ? "/partner/opportunities" : "/partner/profile")}>Открыть следующий шаг <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <div className={styles.heroStatus} aria-label="Состояние партнёрского профиля">
              <div><span>Партнёрский профиль</span><strong>{summary.partnerStatus === "ACTIVE" ? "Активен" : "Ожидает решения"}</strong></div>
              <div><span>Доступные возможности</span><strong>{summary.availableOpportunities}</strong></div>
              <div><span>Непрочитанные события</span><strong>{summary.unreadNotifications}</strong></div>
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem className={styles.rankGridItem}>
          <DashboardCard icon={BriefcaseBusiness} label="Серверный расчёт" title="Текущий ранг" action={<StatusPill tone="neutral">{economy.rank.current ? "Назначен" : "Не определён"}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.rank.current?.label ?? "Нет данных"}</strong>
            <p className={styles.metricCaption}>Ранг определяется опубликованными критериями роли и рынка.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.trustGridItem}>
          <DashboardCard icon={ShieldCheck} label={economy.trust.zone ?? "Серверный расчёт"} title="Trust Score" action={<StatusPill tone="neutral">{economy.trust.score === null ? "Нет данных" : "Актуально"}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.trust.score ?? "Нет данных"}</strong>
            <p className={styles.metricCaption}>{economy.trust.explanation}</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.pointsGridItem}>
          <DashboardCard icon={Coins} label="Подтверждённый баланс" title="VX Points" action={<StatusPill tone="neutral">Серверные данные</StatusPill>}>
            <strong className={styles.metricValue}>{economy.points.confirmedBalance}</strong>
            <p className={styles.metricCaption}>VX Points не являются деньгами; баланс рассчитан по ledger.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.progressGridItem}>
          <DashboardCard icon={BriefcaseBusiness} label="Сотрудничество" title={summary.partnerStatus === "ACTIVE" ? "Партнёрский доступ активен" : "Ожидается решение"} action={<StatusPill tone={summary.partnerStatus === "ACTIVE" ? "success" : "attention"}>{summary.partnerStatus ?? "PENDING"}</StatusPill>}>
            <p className={styles.cardLead}>Статус получен из серверного партнёрского профиля и определяет доступ к рабочим материалам.</p>
            <dl className={styles.profileFacts}>
              <div><dt>Прогнозы</dt><dd>{summary.availableForecasts}</dd></div>
              <div><dt>Промокоды</dt><dd>{summary.availablePromocodes}</dd></div>
              <div><dt>Сообщения менеджера</dt><dd>{summary.openSupport}</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.statsGridItem}>
          <DashboardCard icon={Inbox} label="Краткая статистика" title="Текущая активность">
            <dl className={styles.emptyStats}>
              <div><dt>Дней с VX House</dt><dd>{summary.daysWithPlatform}</dd></div>
              <div><dt>Активные задачи</dt><dd>{summary.activeTasks}</dd></div>
              <div><dt>Завершённые задачи</dt><dd>{summary.completedTasks}</dd></div>
              <div><dt>VX Rewards</dt><dd>{summary.rewards}</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.preparedGridItem}>
          <DashboardCard icon={Award} label="Рабочие разделы" title="Партнёрское пространство">
            <div className={styles.preparedSections}>
              {partnerAreas.map(({ title, description, icon: Icon, href }) => (
                <Link key={title} href={href}><span><Icon aria-hidden="true" /></span><div><strong>{title}</strong><p>{description}</p></div><ArrowRight aria-hidden="true" /></Link>
              ))}
            </div>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
    </DashboardPage>
  );
}
