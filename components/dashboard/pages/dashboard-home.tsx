"use client";

import { ArrowRight, Award, Bell, CheckCircle2, ClipboardList, Gift, Headphones, History, Route } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import type { EconomySnapshotView } from "@/lib/economy";
import type { ActivityEventView, ForecastView, PromocodeView, WorkspaceSummary } from "@/lib/platform-operations";

const quickAccess = [
  { titleKey: "page.tasks" as const, descriptionKey: "dashboard.tasksDescription" as const, icon: ClipboardList, href: "/dashboard/opportunities" },
  { titleKey: "page.rewards" as const, descriptionKey: "dashboard.rewardsDescription" as const, icon: Gift, href: "/dashboard/rewards" },
  { titleKey: "dashboard.manager" as const, descriptionKey: "dashboard.managerDescription" as const, icon: Headphones, href: "/dashboard/support" },
] as const;

export function DashboardHome({ economy, summary, activity }: { economy: EconomySnapshotView; summary: WorkspaceSummary; activity: ActivityEventView[]; forecasts: ForecastView[]; promocodes: PromocodeView[] }) {
  const { profile } = useDashboard();
  const { locale, t } = useI18n();
  const visibleActivity = activity.filter((item) => item.category !== "TRUST").slice(0, 4);
  return (
    <DashboardPage>
      <DashboardHeading eyebrow={t("page.home")} title={t("dashboard.greeting", { name: profile?.user.displayName ?? t("dashboard.playerFallback") })} description={t("dashboard.description")} action={<StatusPill tone="success"><CheckCircle2 aria-hidden="true" /> {t("dashboard.profileActive")}</StatusPill>} />

      <section className={styles.playerHero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}><Route aria-hidden="true" /> {t("dashboard.nextStep")}</span>
          <h2>{summary.recommended?.title ?? t("dashboard.firstTask")}</h2>
          <p>{summary.recommended?.description ?? t("dashboard.firstTaskDescription")}</p>
          <Button asChild size="lg"><Link href={summary.recommended?.href ?? "/dashboard/opportunities"}>{t("dashboard.viewTasks")} <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        <div className={styles.heroStatus} aria-label={t("dashboard.summary")}>
          <div><span>{t("dashboard.activeTasks")}</span><strong>{summary.activeTasks}</strong></div>
          <div><span>{t("dashboard.availableRewards")}</span><strong>{summary.rewards}</strong></div>
          <div><span>VX Points</span><strong>{economy.points.confirmedBalance}</strong></div>
        </div>
      </section>

      <DashboardGrid className={styles.homeSimpleGrid}>
        <DashboardGridItem>
          <DashboardCard icon={ClipboardList} label={t("dashboard.now")} title={t("dashboard.activeTasks")} action={<StatusPill tone={summary.activeTasks ? "attention" : "neutral"}>{summary.activeTasks}</StatusPill>}>
            <div className={styles.homeTaskSummary}>
              <strong>{summary.activeTasks ? t("dashboard.continueTask") : t("dashboard.startTask")}</strong>
              <p>{summary.activeTasks ? t("dashboard.activeTaskDescription") : t("dashboard.newTaskDescription")}</p>
              <Link href="/dashboard/opportunities">{t("dashboard.openTasks")} <ArrowRight aria-hidden="true" /></Link>
            </div>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem>
          <DashboardCard icon={History} label={t("dashboard.recentChanges")} title={t("dashboard.recentEvents")} action={<Link className={styles.cardTextLink} href="/dashboard/activity">{t("dashboard.fullHistory")}</Link>}>
            {visibleActivity.length ? <ol className={styles.homeActivityList}>{visibleActivity.map((event) => <li key={event.id}><span><Bell aria-hidden="true" /></span><div><small>{t("dashboard.event")}</small><strong>{event.title}</strong><time dateTime={event.occurredAt}>{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(event.occurredAt))}</time></div></li>)}</ol> : <div className={styles.homeActivityEmpty}><Award aria-hidden="true" /><strong>{t("dashboard.historyStart")}</strong><p>{t("dashboard.historyStartDescription")}</p></div>}
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>

      <section className={styles.quickAccessSection} aria-labelledby="quick-access-title">
        <div><small>{t("dashboard.quickAccess")}</small><h2 id="quick-access-title">{t("dashboard.everythingClose")}</h2></div>
        <div className={styles.quickAccessGrid}>{quickAccess.map(({ titleKey, descriptionKey, icon: Icon, href }) => <Link key={href} href={href}><span><Icon aria-hidden="true" /></span><div><strong>{t(titleKey)}</strong><p>{t(descriptionKey)}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div>
      </section>
    </DashboardPage>
  );
}
