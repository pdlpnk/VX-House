"use client";

import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { PromocodeCatalog } from "@/components/partner/promocode-catalog";
import type { PromocodeView } from "@/lib/platform-operations";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function PartnerMaterialsPage({ promocodes }: { promocodes: PromocodeView[] }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].partner.materials;
  return <DashboardPage><DashboardHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} action={<StatusPill tone={promocodes.length ? "success" : "neutral"}>{copy.count.replace("{count}", String(promocodes.length))}</StatusPill>} />{promocodes.length ? <PromocodeCatalog initialItems={promocodes} /> : <section className={styles.activityEmpty}><div className={styles.emptyStateIcon}><FolderOpen aria-hidden="true" /></div><small>{copy.none}</small><h2>{copy.empty}</h2><p>{copy.emptyHelp}</p></section>}<Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> {copy.back}</Link></DashboardPage>;
}
