"use client";

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
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function AdminEntityDetail({ sectionId, record, create = false }: { sectionId: string; entityId: string; record?: AdminRecordView; create?: boolean }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].admin.detail;
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
        action={entity.editable === false ? undefined : <Button asChild variant="outline"><Link href={`/admin/${section.id}/${entity.id}/edit`}>{copy.edit} <ArrowRight aria-hidden="true" /></Link></Button>}
      />

      <div className={styles.adminDetailLayout}>
        <Card className={styles.adminDetailCard}>
          <header><span><Icon aria-hidden="true" /></span><div><small>{section.singular}</small><h2>{copy.serverData}</h2></div><StatusPill tone="neutral">{entity.status}</StatusPill></header>
          <dl>
            {entity.fields.map((field) => <div key={field.label}><dt>{field.label}<small>{field.help}</small></dt><dd>{field.value}</dd></div>)}
          </dl>
        </Card>

        <aside className={styles.adminDetailAside}>
          <Card>
            <LockKeyhole aria-hidden="true" /><small>{copy.rights}</small><h2>{copy.control}</h2><p>{copy.controlHelp}</p>
          </Card>
          <Card>
            <History aria-hidden="true" />
            <small>{copy.history}</small>
            <h2>{copy.historyTitle}</h2><p>{copy.historyHelp}</p>
          </Card>
        </aside>
      </div>

      {entity.editable !== false && (["opportunities", "tasks", "content", "rewards"] as string[]).includes(section.id) ? <AdminPublicationActions sectionId={section.id as AdminSectionId} record={entity} /> : null}
      {(["users", "reviews", "support", "economy", "notifications"] as string[]).includes(section.id) ? <Card className={styles.adminEditorCard}><header><span><LockKeyhole aria-hidden="true" /></span><div><small>{copy.operation}</small><h2>{copy.operationTitle}</h2><p>{copy.operationHelp}</p></div></header><AdminCommandForm sectionId={section.id as AdminSectionId} record={entity} /></Card> : null}

      <Link href={`/admin/${section.id}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> {copy.backSection.replace("{section}", section.label)}</Link>
    </DashboardPage>
  );
}

function AdminEntityMissing({ sectionId }: { sectionId: string }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].admin.detail;
  return <DashboardPage><DashboardHeading eyebrow={copy.noData} title={copy.missing} description={copy.missingHelp} /><Link href={`/admin/${sectionId}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> {copy.backList}</Link></DashboardPage>;
}
