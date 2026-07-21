import { ArrowLeft, LockKeyhole, Save } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminBackendNotice, AdminDemoNotice } from "@/components/admin/admin-ui";
import { AdminCriticalActionPreview, AdminUserResultPreview } from "@/components/admin/admin-operational-panels";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminEntity } from "@/lib/admin-data";

export function AdminEntityEditor({ sectionId, entityId }: { sectionId: string; entityId: string }) {
  const data = getAdminEntity(sectionId, entityId);
  if (!data) return <DashboardPage><DashboardHeading eyebrow="Нет данных" title="Редактирование недоступно" description="Сущность не найдена в демонстрационной frontend-модели." /></DashboardPage>;
  const { section, entity } = data;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Режим редактирования"
        title={entity.title}
        description="Форма подготовлена для будущего подключения прав, валидации, версий и подтверждения критических действий."
        action={<StatusPill tone="attention">Изменения отключены</StatusPill>}
      />

      <AdminDemoNotice>Поля недоступны для ввода. Открытие этого экрана не создаёт черновик и не изменяет сущность.</AdminDemoNotice>

      <Card className={styles.adminEditorCard}>
        <header><span><LockKeyhole aria-hidden="true" /></span><div><small>{section.singular}</small><h2>Параметры будущей версии</h2><p>Каждое изменение потребует автора, основания и записи аудита.</p></div></header>
        <fieldset disabled>
          {entity.fields.map((field) => (
            <label key={field.label}>
              <span>{field.label}</span>
              {field.type === "textarea" ? <textarea defaultValue={field.value} /> : field.type === "select" ? <select defaultValue={field.value}><option>{field.value}</option></select> : <input defaultValue={field.value} />}
              <small>{field.help}</small>
            </label>
          ))}
          <label className={styles.adminReasonField}>
            <span>Основание изменения</span>
            <textarea defaultValue="Будет обязательным после подключения backend" />
            <small>Критическое изменение нельзя будет сохранить без объяснения и необходимых прав.</small>
          </label>
          <Button disabled><Save aria-hidden="true" /> Сохранить изменения</Button>
        </fieldset>
        <AdminBackendNotice />
      </Card>

      <div className={styles.adminReviewGrid}>
        <AdminUserResultPreview sectionId={section.id} />
        <AdminCriticalActionPreview />
      </div>

      <Link href={`/admin/${section.id}/${entity.id}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> Вернуться к просмотру</Link>
    </DashboardPage>
  );
}
