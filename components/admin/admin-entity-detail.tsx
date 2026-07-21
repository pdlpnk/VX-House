import { ArrowLeft, ArrowRight, History, LockKeyhole } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminBackendNotice, AdminDemoNotice } from "@/components/admin/admin-ui";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminEntity } from "@/lib/admin-data";

export function AdminEntityDetail({ sectionId, entityId }: { sectionId: string; entityId: string }) {
  const data = getAdminEntity(sectionId, entityId);
  if (!data) return <AdminEntityMissing sectionId={sectionId} />;
  const { section, entity } = data;
  const Icon = section.icon;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={entity.eyebrow}
        title={entity.title}
        description={entity.description}
        action={<Button asChild variant="outline"><Link href={`/admin/${section.id}/${entity.id}/edit`}>Открыть редактирование <ArrowRight aria-hidden="true" /></Link></Button>}
      />

      <AdminDemoNotice>Это схема карточки, а не реальная запись. Значения не загружены из продукта и не подтверждают никаких действий.</AdminDemoNotice>

      <div className={styles.adminDetailLayout}>
        <Card className={styles.adminDetailCard}>
          <header><span><Icon aria-hidden="true" /></span><div><small>{section.singular}</small><h2>Состав сущности</h2></div><StatusPill tone="neutral">{entity.status}</StatusPill></header>
          <dl>
            {entity.fields.map((field) => <div key={field.label}><dt>{field.label}<small>{field.help}</small></dt><dd>{field.value}</dd></div>)}
          </dl>
        </Card>

        <aside className={styles.adminDetailAside}>
          <Card>
            <LockKeyhole aria-hidden="true" />
            <small>Права и изменения</small>
            <h2>Действия отключены</h2>
            <p>Просмотр не предоставляет право публикации, проверки, финансового решения или изменения конфигурации.</p>
            <AdminBackendNotice />
          </Card>
          <Card>
            <History aria-hidden="true" />
            <small>История изменений</small>
            <h2>Событий нет</h2>
            <p>После подключения аудита здесь появятся автор, время, основание и значения до и после изменения.</p>
          </Card>
        </aside>
      </div>

      <Link href={`/admin/${section.id}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> Вернуться в раздел «{section.label}»</Link>
    </DashboardPage>
  );
}

function AdminEntityMissing({ sectionId }: { sectionId: string }) {
  return <DashboardPage><DashboardHeading eyebrow="Нет данных" title="Сущность не найдена" description="Запись отсутствует в демонстрационной frontend-модели." /><Link href={`/admin/${sectionId}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> Вернуться к списку</Link></DashboardPage>;
}
