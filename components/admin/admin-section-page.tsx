import { ArrowLeft, ArrowRight, Bookmark, ChevronRight, Filter, Plus, Search, Square } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminListQuery, AdminSectionView } from "@/lib/admin";
import { getAdminSection } from "@/lib/admin-data";

export function AdminSectionPage({ sectionId, data, query }: { sectionId: string; data: AdminSectionView; query: AdminListQuery }) {
  const section = getAdminSection(sectionId);
  if (!section) return <AdminMissingState />;
  const Icon = section.icon;
  const canCreate = ["opportunities", "tasks", "rewards", "content", "notifications"].includes(section.id);

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Административная панель"
        title={section.label}
        description={section.description}
        action={canCreate ? <Button asChild><Link href={`/admin/${section.id}/new`}><Plus aria-hidden="true" /> Создать</Link></Button> : undefined}
      />

      <section className={styles.adminCatalog} aria-labelledby={`${section.id}-catalog-title`}>
        <header>
          <div><span>Рабочая область</span><h2 id={`${section.id}-catalog-title`}>{section.purpose}</h2></div>
          <StatusPill tone="success">Серверные данные · {data.total}</StatusPill>
        </header>

        <form className={styles.adminToolbar} aria-label="Поиск и фильтры раздела">
          <label><Search aria-hidden="true" /><span className="sr-only">Поиск</span><input name="search" defaultValue={query.search} placeholder="Поиск" /></label>
          <select name="role" defaultValue={query.role ?? ""} aria-label="Фильтр по роли"><option value="">Все роли</option><option value="PLAYER">Игрок</option><option value="PARTNER">Партнёр</option></select>
          <select name="market" defaultValue={query.market ?? ""} aria-label="Фильтр по рынку"><option value="">Все рынки</option><option value="TR">Турция</option><option value="AZ">Азербайджан</option></select>
          <button type="submit"><Filter aria-hidden="true" /> Применить</button>
          <button type="button" disabled><Bookmark aria-hidden="true" /> Сохранённые представления</button>
        </form>

        <div className={styles.adminBulkBar} role="note"><Square aria-hidden="true" /><span>Массовые изменения выполняются только через защищённые серверные команды.</span><button type="button" disabled>Выберите записи</button></div>

        <div className={styles.adminEntityList}>
          {data.items.length ? data.items.map((entity) => <Card className={styles.adminEntityCard} key={entity.id}><div className={styles.adminEntityIcon}><Icon aria-hidden="true" /></div><div><small>{entity.eyebrow}</small><h3>{entity.title}</h3><p>{entity.description}</p><dl><div><dt>Статус</dt><dd>{entity.status}</dd></div><div><dt>Следующий шаг</dt><dd>{entity.nextStep}</dd></div></dl></div><Link href={`/admin/${section.id}/${entity.id}`}>Открыть запись <ArrowRight aria-hidden="true" /></Link></Card>) : <Card className={styles.adminEntityCard}><div className={styles.adminEntityIcon}><Icon aria-hidden="true" /></div><div><small>Пустое состояние</small><h3>Записей пока нет</h3><p>Фильтрам не соответствует ни одна серверная запись.</p></div></Card>}
        </div>
        <nav className={styles.adminPagination} aria-label="Пагинация раздела"><button type="button" disabled><ArrowLeft aria-hidden="true" /> Назад</button><span>{data.total} записей на странице</span>{data.nextCursor ? <Button asChild variant="outline"><Link href={`?cursor=${data.nextCursor}`}>Далее <ChevronRight aria-hidden="true" /></Link></Button> : <button type="button" disabled>Далее <ChevronRight aria-hidden="true" /></button>}</nav>
      </section>
    </DashboardPage>
  );
}

function AdminMissingState() {
  return <DashboardPage><DashboardHeading eyebrow="Административная панель" title="Раздел не найден" description="Такого административного раздела нет." /></DashboardPage>;
}
