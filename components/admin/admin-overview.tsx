import { ArrowRight, DatabaseZap, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminDemoNotice } from "@/components/admin/admin-ui";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import { adminOperationalAreas, adminReadiness, adminSections } from "@/lib/admin-data";

export function AdminOverview() {
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Управляющая часть"
        title="Операционный контур VX House"
        description="Единая структура для будущего управления продуктом. Сейчас здесь нет подключённых данных, сотрудников с правами или действующих конфигураций."
        action={<StatusPill tone="attention">Frontend-демонстрация</StatusPill>}
      />

      <AdminDemoNotice>Карточки отражают готовность интерфейса, а не состояние реальной платформы. Числовая статистика намеренно не показывается.</AdminDemoNotice>

      <DashboardGrid className={styles.adminReadinessGrid}>
        {adminReadiness.map(({ label, value, icon: Icon }) => (
          <DashboardGridItem key={label}>
            <Card className={styles.adminReadinessCard}>
              <span><Icon aria-hidden="true" /></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>Будет получено из защищённого серверного источника.</p>
            </Card>
          </DashboardGridItem>
        ))}
      </DashboardGrid>

      <section className={styles.adminOperationsSummary} aria-labelledby="admin-operations-title">
        <header><div><span>Операционная статистика</span><h2 id="admin-operations-title">Ежедневный процесс без вымышленных показателей</h2><p>До подключения источников интерфейс показывает отсутствие данных, а не нулевую или успешную статистику.</p></div><StatusPill tone="neutral">Источники не подключены</StatusPill></header>
        <div>{adminOperationalAreas.map((area) => <article key={area.label}><small>{area.label}</small><strong>{area.state}</strong><p>{area.nextStep}</p></article>)}</div>
      </section>

      <section className={styles.adminSectionHub} aria-labelledby="admin-sections-title">
        <header>
          <div><span>Разделы панели</span><h2 id="admin-sections-title">Все операционные области в одном контуре</h2><p>Каждая область отделяет просмотр от будущего изменения и заранее объясняет границы доступа.</p></div>
          <StatusPill tone="neutral">Без серверных действий</StatusPill>
        </header>
        <div className={styles.adminSectionGrid}>
          {adminSections.map(({ id, label, description, purpose, icon: Icon }) => (
            <Link key={id} href={`/admin/${id}`} className={styles.adminSectionCard}>
              <div><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">Нет данных</StatusPill></div>
              <h3>{label}</h3>
              <p>{description}</p>
              <small>{purpose}</small>
              <strong>Открыть раздел <ArrowRight aria-hidden="true" /></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.adminSafetyPanel} aria-labelledby="admin-safety-title">
        <span><ShieldCheck aria-hidden="true" /></span>
        <div><small>Безопасная граница</small><h2 id="admin-safety-title">Ни одно действие не изменяет продукт</h2><p>Сохранение, публикация, подтверждение, назначение и финансовые операции отключены. В будущем они потребуют серверных прав, предварительного просмотра и аудита.</p></div>
        <DatabaseZap aria-hidden="true" />
      </section>
    </DashboardPage>
  );
}
