import { ArrowLeft, ArrowRight, Bookmark, ChevronRight, Filter, Plus, Search, Square } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminBackendNotice, AdminDemoNotice } from "@/components/admin/admin-ui";
import { AdminAuditPanel, AdminCapabilities, AdminPermissionMatrix, AdminQueuePreview } from "@/components/admin/admin-operational-panels";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminSection } from "@/lib/admin-data";

export function AdminSectionPage({ sectionId }: { sectionId: string }) {
  const section = getAdminSection(sectionId);
  if (!section) return <AdminMissingState />;
  const Icon = section.icon;
  const entity = section.entity;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Административная панель"
        title={section.label}
        description={section.description}
        action={<Button disabled><Plus aria-hidden="true" /> Создать</Button>}
      />

      <AdminDemoNotice>В списке нет реальных записей. Единственная карточка ниже демонстрирует структуру будущей сущности.</AdminDemoNotice>

      <section className={styles.adminCatalog} aria-labelledby={`${section.id}-catalog-title`}>
        <header>
          <div><span>Рабочая область</span><h2 id={`${section.id}-catalog-title`}>{section.purpose}</h2></div>
          <StatusPill tone="neutral">Только просмотр</StatusPill>
        </header>

        <div className={styles.adminToolbar} aria-label="Фильтры раздела отключены">
          <label><Search aria-hidden="true" /><span className="sr-only">Поиск</span><input disabled placeholder="Поиск будет доступен после подключения данных" /></label>
          <button type="button" disabled><Filter aria-hidden="true" /> Фильтры</button>
          <button type="button" disabled><Bookmark aria-hidden="true" /> Сохранённые представления</button>
        </div>

        <div className={styles.adminBulkBar} role="note"><Square aria-hidden="true" /><span>Массовые действия недоступны: нет выбранных записей и серверного подтверждения.</span><button type="button" disabled>Предпросмотр действия</button></div>

        <div className={styles.adminEntityList}>
          <Card className={styles.adminEntityCard}>
            <div className={styles.adminEntityIcon}><Icon aria-hidden="true" /></div>
            <div>
              <small>{entity.eyebrow}</small>
              <h3>{entity.title}</h3>
              <p>{entity.description}</p>
              <dl>
                <div><dt>Статус</dt><dd>{entity.status}</dd></div>
                <div><dt>Следующий шаг</dt><dd>{entity.nextStep}</dd></div>
              </dl>
            </div>
            <Link href={`/admin/${section.id}/${entity.id}`}>Просмотреть структуру <ArrowRight aria-hidden="true" /></Link>
          </Card>
        </div>

        <AdminBackendNotice />
        <nav className={styles.adminPagination} aria-label="Пагинация раздела"><button type="button" disabled><ArrowLeft aria-hidden="true" /> Назад</button><span>Страниц нет</span><button type="button" disabled>Далее <ChevronRight aria-hidden="true" /></button></nav>
      </section>

      <AdminCapabilities sectionId={section.id} />
      <AdminQueuePreview sectionId={section.id} />
      <AdminPermissionMatrix sectionId={section.id} />
      <AdminAuditPanel sectionId={section.id} />
    </DashboardPage>
  );
}

function AdminMissingState() {
  return <DashboardPage><DashboardHeading eyebrow="Административная панель" title="Раздел не найден" description="Такого административного раздела нет в текущей frontend-модели." /></DashboardPage>;
}
