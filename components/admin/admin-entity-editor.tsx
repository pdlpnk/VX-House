"use client";

import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminCommandForm } from "@/components/admin/admin-command-form";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import { getAdminSection } from "@/lib/admin-data";
import type { AdminRecordView, AdminSectionId } from "@/lib/admin";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function AdminEntityEditor({ sectionId, entityId, record, create = false }: { sectionId: string; entityId: string; record?: AdminRecordView; create?: boolean }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].admin.editor;
  const section = getAdminSection(sectionId);
  if (!section) return <DashboardPage><DashboardHeading eyebrow={copy.noData} title={copy.unavailable} description={copy.sectionMissing} /></DashboardPage>;
  const entity = record;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={copy.mode}
        title={create ? copy.create.replace("{section}", section.singular) : entity?.title ?? section.singular}
        description={copy.description}
        action={<StatusPill tone="success">{copy.audit}</StatusPill>}
      />

      <Card className={styles.adminEditorCard}>
        <header><span><LockKeyhole aria-hidden="true" /></span><div><small>{section.singular}</small><h2>{create ? copy.draft : copy.version}</h2><p>{copy.immutable}</p></div></header>
        <AdminCommandForm sectionId={section.id as AdminSectionId} record={entity} create={create} />
      </Card>
      <Link href={create ? `/admin/${section.id}` : `/admin/${section.id}/${entityId}`} className={styles.adminBackLink}><ArrowLeft aria-hidden="true" /> {copy.back}</Link>
    </DashboardPage>
  );
}
