"use client";

import { ArrowRight, DatabaseZap, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import type { AdminDashboardView } from "@/lib/admin";
import type { FunnelReport } from "@/lib/analytics";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function AdminOverview({ stats, funnel }: { stats: AdminDashboardView; funnel: FunnelReport }) {
  const { locale } = useI18n();
  const copy = workspaceContent[locale].admin.overview;
  const coreSections = [
    { href: "/admin/users", label: copy.members, description: copy.membersHelp, purpose: copy.membersPurpose, icon: UsersRound },
    { href: "/admin/messenger", label: "Messenger", description: copy.messengerHelp, purpose: copy.messengerPurpose, icon: MessageCircle },
  ];
  const primary = [
    { label: copy.users, value: stats.users, icon: DatabaseZap },
    { label: copy.registrations, value: stats.registrationsToday, icon: ShieldCheck },
  ];
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={<StatusPill tone="success">{copy.serverData}</StatusPill>}
      />

      <DashboardGrid className={styles.adminReadinessGrid}>
        {primary.map(({ label, value, icon: Icon }) => (
          <DashboardGridItem key={label}>
            <Card className={styles.adminReadinessCard}>
              <span><Icon aria-hidden="true" /></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{copy.calculated}</p>
            </Card>
          </DashboardGridItem>
        ))}
      </DashboardGrid>

      <section className={styles.adminOperationsSummary} aria-labelledby="admin-funnel-title">
        <header><div><span>{copy.analytics}</span><h2 id="admin-funnel-title">{copy.funnel}</h2><p>{copy.funnelHelp}</p></div><StatusPill tone="success">{copy.internalEvents}</StatusPill></header>
        <div>
          {[
            [copy.visitors, funnel.landingViewed, null],
            [copy.accessClicks, funnel.accessClicked.count, funnel.accessClicked.rate],
            [copy.registrationStarted, funnel.registrationStarted.count, funnel.registrationStarted.rate],
            [copy.emailConfirmed, funnel.emailConfirmed.count, funnel.emailConfirmed.rate],
            [copy.dashboardOpened, funnel.dashboardOpened.count, funnel.dashboardOpened.rate],
          ].map(([label, value, conversion]) => <article key={String(label)}><small>{label}</small><strong>{value}</strong><p>{conversion === null ? copy.firstView : copy.conversion.replace("{value}", String(conversion))}</p></article>)}
        </div>
      </section>

      <section className={styles.adminSectionHub} aria-labelledby="admin-sections-title">
        <header>
          <div><span>{copy.workspace}</span><h2 id="admin-sections-title">{copy.areas}</h2><p>{copy.areasHelp}</p></div>
          <StatusPill tone="success">{copy.rbac}</StatusPill>
        </header>
        <div className={styles.adminSectionGrid}>
          {coreSections.map(({ href, label, description, purpose, icon: Icon }) => (
            <Link key={href} href={href} className={styles.adminSectionCard}>
              <div><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">{copy.open}</StatusPill></div>
              <h3>{label}</h3>
              <p>{description}</p>
              <small>{purpose}</small>
              <strong>{copy.openSection} <ArrowRight aria-hidden="true" /></strong>
            </Link>
          ))}
        </div>
      </section>

      {process.env.NODE_ENV === "development" ? (
        <section className={styles.adminOperationsSummary} aria-labelledby="demo-accounts-title">
          <header><div><span>{copy.local}</span><h2 id="demo-accounts-title">{copy.demo}</h2><p>{copy.demoHelp}</p></div><StatusPill tone="neutral">{copy.localOnly}</StatusPill></header>
          <div>
            {[
              [copy.administrator, "admin@vxhouse.local"],
              [copy.playerOne, "player1@vxhouse.local"],
              [copy.playerTwo, "player2@vxhouse.local"],
            ].map(([role, email]) => <article key={email}><small>{role}</small><strong>{email}</strong><p>{copy.password}: VXHouse-Demo-2026!</p></article>)}
          </div>
        </section>
      ) : null}

      <section className={styles.adminSafetyPanel} aria-labelledby="admin-safety-title">
        <span><ShieldCheck aria-hidden="true" /></span>
        <div><small>{copy.boundary}</small><h2 id="admin-safety-title">{copy.safety}</h2><p>{copy.safetyHelp}</p></div>
        <DatabaseZap aria-hidden="true" />
      </section>
    </DashboardPage>
  );
}
