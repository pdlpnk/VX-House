import { ArrowRight, DatabaseZap, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import type { AdminDashboardView } from "@/lib/admin";
import type { FunnelReport } from "@/lib/analytics";

export function AdminOverview({ stats, funnel }: { stats: AdminDashboardView; funnel: FunnelReport }) {
  const coreSections = [
    { href: "/admin/users", label: "Участники", description: "Профили и состояние игроков и партнёров.", purpose: "Открыть список участников", icon: UsersRound },
    { href: "/admin/messenger", label: "Messenger", description: "Постоянные личные диалоги с участниками.", purpose: "Открыть переписку", icon: MessageCircle },
  ];
  const primary = [
    { label: "Пользователи", value: stats.users, icon: DatabaseZap },
    { label: "Новые регистрации", value: stats.registrationsToday, icon: ShieldCheck },
  ];
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Управляющая часть"
        title="Рабочее пространство VX House"
        description="Участники и персональные диалоги текущего MVP в одном защищённом интерфейсе."
        action={<StatusPill tone="success">Серверные данные</StatusPill>}
      />

      <DashboardGrid className={styles.adminReadinessGrid}>
        {primary.map(({ label, value, icon: Icon }) => (
          <DashboardGridItem key={label}>
            <Card className={styles.adminReadinessCard}>
              <span><Icon aria-hidden="true" /></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>Рассчитано сервером на момент открытия страницы.</p>
            </Card>
          </DashboardGridItem>
        ))}
      </DashboardGrid>

      <section className={styles.adminOperationsSummary} aria-labelledby="admin-funnel-title">
        <header><div><span>First-party аналитика · 30 дней</span><h2 id="admin-funnel-title">Воронка получения доступа</h2><p>Тестовые и smoke-аккаунты исключены. Проценты рассчитываются сервером.</p></div><StatusPill tone="success">Внутренние события</StatusPill></header>
        <div>
          {[
            ["Уникальные посетители", funnel.landingViewed, null],
            ["Нажали «Получить доступ»", funnel.accessClicked.count, funnel.accessClicked.rate],
            ["Начали регистрацию", funnel.registrationStarted.count, funnel.registrationStarted.rate],
            ["Подтвердили email", funnel.emailConfirmed.count, funnel.emailConfirmed.rate],
            ["Открыли Dashboard", funnel.dashboardOpened.count, funnel.dashboardOpened.rate],
          ].map(([label, value, conversion]) => <article key={String(label)}><small>{label}</small><strong>{value}</strong><p>{conversion === null ? "Первый подтверждённый просмотр" : `Конверсия этапа: ${conversion}%`}</p></article>)}
        </div>
      </section>

      <section className={styles.adminSectionHub} aria-labelledby="admin-sections-title">
        <header>
          <div><span>Рабочее пространство</span><h2 id="admin-sections-title">Основные области администратора</h2><p>В навигации оставлены только разделы, необходимые для текущего MVP.</p></div>
          <StatusPill tone="success">RBAC включён</StatusPill>
        </header>
        <div className={styles.adminSectionGrid}>
          {coreSections.map(({ href, label, description, purpose, icon: Icon }) => (
            <Link key={href} href={href} className={styles.adminSectionCard}>
              <div><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">Открыть</StatusPill></div>
              <h3>{label}</h3>
              <p>{description}</p>
              <small>{purpose}</small>
              <strong>Открыть раздел <ArrowRight aria-hidden="true" /></strong>
            </Link>
          ))}
        </div>
      </section>

      {process.env.NODE_ENV === "development" ? (
        <section className={styles.adminOperationsSummary} aria-labelledby="demo-accounts-title">
          <header><div><span>Локальная тестовая среда</span><h2 id="demo-accounts-title">Готовые демо-аккаунты</h2><p>Аккаунты создаются автоматически при запуске development-сервера.</p></div><StatusPill tone="neutral">Только локально</StatusPill></header>
          <div>
            {[
              ["Администратор", "admin@vxhouse.local"],
              ["Игрок 1", "player1@vxhouse.local"],
              ["Игрок 2", "player2@vxhouse.local"],
            ].map(([role, email]) => <article key={email}><small>{role}</small><strong>{email}</strong><p>Пароль: VXHouse-Demo-2026!</p></article>)}
          </div>
        </section>
      ) : null}

      <section className={styles.adminSafetyPanel} aria-labelledby="admin-safety-title">
        <span><ShieldCheck aria-hidden="true" /></span>
        <div><small>Безопасная граница</small><h2 id="admin-safety-title">Административные действия контролирует сервер</h2><p>Доступ к участникам, Messenger и управлению тегами проверяется серверными разрешениями и фиксируется в аудите.</p></div>
        <DatabaseZap aria-hidden="true" />
      </section>
    </DashboardPage>
  );
}
