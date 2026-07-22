import { ArrowLeft, ArrowRight, History, LockKeyhole } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminCommandForm, AdminPublicationActions } from "@/components/admin/admin-command-form";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminSection } from "@/lib/admin-data";
import type { AdminRecordView, AdminSectionId } from "@/lib/admin";
import { AdminEntityEditor } from "@/components/admin/admin-entity-editor";

export function AdminEntityDetail({ sectionId, record, create = false }: { sectionId: string; entityId: string; record?: AdminRecordView; create?: boolean }) {
  const section = getAdminSection(sectionId);
  if (!section) return <AdminEntityMissing sectionId={sectionId} />;
  if (create) return <AdminEntityEditor sectionId={sectionId} entityId="new" create />;
  if (!record) return <AdminEntityMissing sectionId={sectionId} />;
  const entity = record;
  const Icon = section.icon;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={entity.eyebrow}
        title={entity.title}
        description={entity.description}
        action={entity.editable === false ? undefined : <Button asChild variant="outline"><Link href={`/admin/${section.id}/${entity.id}/edit`}>Открыть редактирование <ArrowRight aria-hidden="true" /></Link></Button>}
      />

      <div className={styles.adminDetailLayout}>
        <Card className={styles.adminDetailCard}>
          <header><span><Icon aria-hidden="true" /></span><div><small>{section.singular}</small><h2>Серверные данные</h2></div><StatusPill tone="neutral">{entity.status}</StatusPill></header>
          <dl>
            {entity.fields.map((field) => <div key={field.label}><dt>{field.label}<small>{field.help}</small></dt><dd>{field.value}</dd></div>)}
          </dl>
        </Card>

        <aside className={styles.adminDetailAside}>
          <Card>
            <LockKeyhole aria-hidden="true" /><small>Права и изменения</small><h2>Серверный контроль</h2><p>Каждая команда повторно проверяет RBAC и сохраняет основание в неизменяемом аудите.</p>
          </Card>
          <Card>
            <History aria-hidden="true" />
            <small>История изменений</small>
            <h2>История сохраняется</h2><p>Изменения статуса, публикации и решения добавляют новую запись, не перезаписывая прошлое.</p>
          </Card>
        </aside>
      </div>

      {entity.editable !== false && (["opportunities", "tasks", "content", "rewards"] as string[]).includes(section.id) ? <AdminPublicationActions sectionId={section.id as AdminSectionId} record={entity} /> : null}
      {(["users", "reviews", "support", "economy", "notifications"] as string[]).includes(section.id) ? <Card className={styles.adminEditorCard}><header><span><LockKeyhole aria-hidden="true" /></span><div><small>Операционная команда</small><h2>Выполнить разрешённое действие</h2><p>Основание обязательно, результат фиксируется сервером.</p></div></header><AdminCommandForm sectionId={section.id as AdminSectionId} record={entity} /></Card> : null}

      <Link href={`/admin/${section.id}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> Вернуться в раздел «{section.label}»</Link>
    </DashboardPage>
  );
}

function AdminEntityMissing({ sectionId }: { sectionId: string }) {
  return <DashboardPage><DashboardHeading eyebrow="Нет данных" title="Сущность не найдена" description="Запись отсутствует или недоступна с текущими правами." /><Link href={`/admin/${sectionId}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> Вернуться к списку</Link></DashboardPage>;
}
