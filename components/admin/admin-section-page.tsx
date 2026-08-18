"use client";

import { ArrowLeft, ArrowRight, Bookmark, ChevronRight, Filter, Plus, Search, Square } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminListQuery, AdminSectionView } from "@/lib/admin";
import { getAdminSection } from "@/lib/admin-data";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function AdminSectionPage({ sectionId, data, query }: { sectionId: string; data: AdminSectionView; query: AdminListQuery }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].admin.section;
  const section = getAdminSection(sectionId);
  if (!section) return <AdminMissingState />;
  const Icon = section.icon;
  const canCreate = ["opportunities", "tasks", "rewards", "content", "notifications"].includes(section.id);

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={copy.eyebrow}
        title={section.label}
        description={section.description}
        action={canCreate ? <Button asChild><Link href={`/admin/${section.id}/new`}><Plus aria-hidden="true" /> {copy.create}</Link></Button> : undefined}
      />

      <section className={styles.adminCatalog} aria-labelledby={`${section.id}-catalog-title`}>
        <header>
          <div><span>{copy.workspace}</span><h2 id={`${section.id}-catalog-title`}>{section.purpose}</h2></div>
          <StatusPill tone="success">{copy.serverData.replace("{count}", String(data.total))}</StatusPill>
        </header>

        <form className={styles.adminToolbar} aria-label={copy.searchFilters}>
          <label><Search aria-hidden="true" /><span className="sr-only">{copy.search}</span><input name="search" defaultValue={query.search} placeholder={copy.search} /></label>
          <select name="role" defaultValue={query.role ?? ""} aria-label={copy.roleFilter}><option value="">{copy.allRoles}</option><option value="PLAYER">{copy.player}</option><option value="PARTNER">{copy.partner}</option></select>
          <select name="market" defaultValue={query.market ?? ""} aria-label={copy.marketFilter}><option value="">{copy.allMarkets}</option><option value="TR">{copy.turkey}</option><option value="AZ">{copy.azerbaijan}</option></select>
          <button type="submit"><Filter aria-hidden="true" /> {copy.apply}</button>
          <button type="button" disabled><Bookmark aria-hidden="true" /> {copy.savedViews}</button>
        </form>

        <div className={styles.adminBulkBar} role="note"><Square aria-hidden="true" /><span>{copy.bulkHelp}</span><button type="button" disabled>{copy.selectRecords}</button></div>

        <div className={styles.adminEntityList}>
          {data.items.length ? data.items.map((entity) => <Card className={styles.adminEntityCard} key={entity.id}><div className={styles.adminEntityIcon}><Icon aria-hidden="true" /></div><div><small>{entity.eyebrow}</small><h3>{entity.title}</h3><p>{entity.description}</p><dl><div><dt>{copy.status}</dt><dd>{entity.status}</dd></div><div><dt>{copy.nextStep}</dt><dd>{entity.nextStep}</dd></div></dl></div><Link href={`/admin/${section.id}/${entity.id}`}>{copy.openRecord} <ArrowRight aria-hidden="true" /></Link></Card>) : <Card className={styles.adminEntityCard}><div className={styles.adminEntityIcon}><Icon aria-hidden="true" /></div><div><small>{copy.emptyLabel}</small><h3>{copy.empty}</h3><p>{copy.emptyHelp}</p></div></Card>}
        </div>
        <nav className={styles.adminPagination} aria-label={copy.pagination}><button type="button" disabled><ArrowLeft aria-hidden="true" /> {copy.back}</button><span>{copy.records.replace("{count}", String(data.total))}</span>{data.nextCursor ? <Button asChild variant="outline"><Link href={`?cursor=${data.nextCursor}`}>{copy.next} <ChevronRight aria-hidden="true" /></Link></Button> : <button type="button" disabled>{copy.next} <ChevronRight aria-hidden="true" /></button>}</nav>
      </section>
    </DashboardPage>
  );
}

function AdminMissingState() {
  const { locale } = useI18n(); const copy = workspaceContent[locale].admin.section;
  return <DashboardPage><DashboardHeading eyebrow={copy.eyebrow} title={copy.missing} description={copy.missingHelp} /></DashboardPage>;
}
