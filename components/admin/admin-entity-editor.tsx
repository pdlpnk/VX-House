import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminCommandForm } from "@/components/admin/admin-command-form";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import { getAdminSection } from "@/lib/admin-data";
import type { AdminRecordView, AdminSectionId } from "@/lib/admin";

export function AdminEntityEditor({ sectionId, entityId, record, create = false }: { sectionId: string; entityId: string; record?: AdminRecordView; create?: boolean }) {
  const section = getAdminSection(sectionId);
  if (!section) return <DashboardPage><DashboardHeading eyebrow="Нет данных" title="Редактирование недоступно" description="Раздел не найден." /></DashboardPage>;
  const entity = record;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Режим редактирования"
        title={create ? `Создать: ${section.singular}` : entity?.title ?? section.singular}
        description="Изменение создаёт новую серверную версию и сохраняет автора, основание и время."
        action={<StatusPill tone="success">RBAC и аудит</StatusPill>}
      />

      <Card className={styles.adminEditorCard}>
        <header><span><LockKeyhole aria-hidden="true" /></span><div><small>{section.singular}</small><h2>{create ? "Новый черновик" : "Новая версия"}</h2><p>Опубликованная версия не перезаписывается.</p></div></header>
        <AdminCommandForm sectionId={section.id as AdminSectionId} record={entity} create={create} />
      </Card>
      <Link href={create ? `/admin/${section.id}` : `/admin/${section.id}/${entityId}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> Вернуться</Link>
    </DashboardPage>
  );
}
