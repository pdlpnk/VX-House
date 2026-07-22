import { ArrowLeft, FolderOpen } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { PromocodeCatalog } from "@/components/partner/promocode-catalog";
import type { PromocodeView } from "@/lib/platform-operations";

export function PartnerMaterialsPage({ promocodes }: { promocodes: PromocodeView[] }) {
  return <DashboardPage><DashboardHeading eyebrow="Рабочий контент" title="Материалы" description="Промокоды и применимые условия партнёра с серверной проверкой роли, рынка и срока." action={<StatusPill tone={promocodes.length ? "success" : "neutral"}>{promocodes.length} материалов</StatusPill>} />{promocodes.length ? <PromocodeCatalog initialItems={promocodes} /> : <section className={styles.activityEmpty}><div className={styles.emptyStateIcon}><FolderOpen aria-hidden="true" /></div><small>Нет доступных материалов</small><h2>Материалы пока не назначены</h2><p>Система проверила роль, рынок, статус партнёрского доступа и опубликованные сроки.</p></section>}<Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link></DashboardPage>;
}
