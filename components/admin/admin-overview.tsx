import { ArrowRight, BookOpenText, DatabaseZap, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import type { AdminDashboardView } from "@/lib/admin";

export function AdminOverview({ stats }: { stats: AdminDashboardView }) {
  const coreSections = [
    { href: "/admin/users", label: "Участники", description: "Профили и состояние игроков и партнёров.", purpose: "Открыть список участников", icon: UsersRound },
    { href: "/admin/messenger", label: "Messenger", description: "Постоянные личные диалоги с участниками.", purpose: "Открыть переписку", icon: MessageCircle },
    { href: "/admin/content", label: "CMS", description: "Управление опубликованными материалами.", purpose: "Открыть контент", icon: BookOpenText },
  ];
  const primary = [
    { label: "Пользователи", value: stats.users, icon: DatabaseZap },
    { label: "Новые регистрации", value: stats.registrationsToday, icon: ShieldCheck },
    { label: "Активные задания", value: stats.activeTasks, icon: DatabaseZap },
    { label: "Открытые обращения", value: stats.openSupport, icon: ShieldCheck },
  ];
  const operations = [
    { label: "Результаты на проверке", state: stats.pendingReviews, nextStep: "Открыть очередь проверки" },
    { label: "Апелляции", state: stats.pendingAppeals, nextStep: "Проверить допустимые решения" },
    { label: "Rewards в процессе", state: stats.rewardsInProgress, nextStep: "Проверить текущие статусы" },
    { label: "Записи VX Points", state: stats.pointsEntries, nextStep: "Открыть append-only историю" },
  ];
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Управляющая часть"
        title="Операционный контур VX House"
        description="Единый защищённый контур управления пользователями, контентом, модерацией, поддержкой и экономикой."
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

      <section className={styles.adminOperationsSummary} aria-labelledby="admin-operations-title">
        <header><div><span>Операционная статистика</span><h2 id="admin-operations-title">Текущая рабочая очередь</h2><p>Показатели отражают реальные записи и не рассчитываются на клиенте.</p></div><StatusPill tone="success">Обновлено</StatusPill></header>
        <div>{operations.map((area) => <article key={area.label}><small>{area.label}</small><strong>{area.state}</strong><p>{area.nextStep}</p></article>)}</div>
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
        <div><small>Безопасная граница</small><h2 id="admin-safety-title">Критические действия контролирует сервер</h2><p>Публикация, модерация, поддержка и корректировки требуют отдельных разрешений, причины и неизменяемой записи аудита.</p></div>
        <DatabaseZap aria-hidden="true" />
      </section>
    </DashboardPage>
  );
}
