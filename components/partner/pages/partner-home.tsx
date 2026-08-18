"use client";

import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  Coins,
  History,
  Inbox,
  Route,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { EconomySnapshotView } from "@/lib/economy";
import type { WorkspaceSummary } from "@/lib/platform-operations";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function PartnerHome({ economy, summary }: { economy: EconomySnapshotView; summary: WorkspaceSummary }) {
  const { profile } = useDashboard();
  const { locale } = useI18n();
  const copy = workspaceContent[locale].partner.home;
  const partnerAreas = [
    { title: copy.opportunities, description: copy.noOpportunities, icon: ClipboardList, href: "/partner/opportunities" },
    { title: copy.workSections, description: copy.accessHelp, icon: BookOpenCheck, href: "/partner/materials" },
    { title: copy.promocodes, description: copy.accessHelp, icon: TicketPercent, href: "/partner/materials" },
    { title: copy.forecasts, description: copy.accessHelp, icon: ChartNoAxesCombined, href: "/partner/forecasts" },
    { title: workspaceContent[locale].partner.history.title, description: workspaceContent[locale].partner.history.description, icon: History, href: "/partner/history" },
  ];

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={copy.area}
        title={copy.title}
        description={`${profile?.user.displayName ?? "VX House"}. ${copy.description}`}
        action={<StatusPill tone={summary.partnerStatus === "ACTIVE" ? "success" : "attention"}>{summary.partnerStatus === "ACTIVE" ? copy.approved : copy.pending}</StatusPill>}
      />

      <DashboardGrid className={styles.homeGrid}>
        <DashboardGridItem className={styles.heroGridItem}>
          <section className={styles.playerHero}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}><Route aria-hidden="true" /> {copy.recommended}</span>
              <h2>{summary.recommended?.title ?? (summary.partnerStatus === "ACTIVE" ? copy.openOpportunities : copy.checkProfile)}</h2>
              <p>{summary.recommended?.description ?? (summary.partnerStatus === "ACTIVE" ? copy.noOpportunities : copy.approvalRequired)}</p>
              <Button asChild size="lg"><Link href={summary.recommended?.href ?? (summary.partnerStatus === "ACTIVE" ? "/partner/opportunities" : "/partner/profile")}>{copy.openNext} <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <div className={styles.heroStatus} aria-label={copy.profileState}>
              <div><span>{copy.profile}</span><strong>{summary.partnerStatus === "ACTIVE" ? copy.active : copy.awaitingDecision}</strong></div>
              <div><span>{copy.opportunities}</span><strong>{summary.availableOpportunities}</strong></div>
              <div><span>{copy.unread}</span><strong>{summary.unreadNotifications}</strong></div>
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem className={styles.rankGridItem}>
          <DashboardCard icon={BriefcaseBusiness} label={copy.serverCalculation} title={copy.currentRank} action={<StatusPill tone="neutral">{economy.rank.current ? copy.assigned : copy.undefined}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.rank.current?.label ?? copy.noData}</strong>
            <p className={styles.metricCaption}>{copy.rankHelp}</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.trustGridItem}>
          <DashboardCard icon={ShieldCheck} label={economy.trust.zone ?? copy.serverCalculation} title="Trust Score" action={<StatusPill tone="neutral">{economy.trust.score === null ? copy.noData : copy.current}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.trust.score ?? copy.noData}</strong>
            <p className={styles.metricCaption}>{economy.trust.explanation}</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.pointsGridItem}>
          <DashboardCard icon={Coins} label={copy.confirmedBalance} title="VX Points" action={<StatusPill tone="neutral">{copy.serverData}</StatusPill>}>
            <strong className={styles.metricValue}>{economy.points.confirmedBalance}</strong>
            <p className={styles.metricCaption}>{copy.pointsHelp}</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.progressGridItem}>
          <DashboardCard icon={BriefcaseBusiness} label={copy.cooperation} title={summary.partnerStatus === "ACTIVE" ? copy.accessActive : copy.decisionPending} action={<StatusPill tone={summary.partnerStatus === "ACTIVE" ? "success" : "attention"}>{summary.partnerStatus ?? "PENDING"}</StatusPill>}>
            <p className={styles.cardLead}>{copy.accessHelp}</p>
            <dl className={styles.profileFacts}>
              <div><dt>{copy.forecasts}</dt><dd>{summary.availableForecasts}</dd></div>
              <div><dt>{copy.promocodes}</dt><dd>{summary.availablePromocodes}</dd></div>
              <div><dt>{copy.managerMessages}</dt><dd>{summary.openSupport}</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.statsGridItem}>
          <DashboardCard icon={Inbox} label={copy.statistics} title={copy.activity}>
            <dl className={styles.emptyStats}>
              <div><dt>{copy.days}</dt><dd>{summary.daysWithPlatform}</dd></div>
              <div><dt>{copy.activeTasks}</dt><dd>{summary.activeTasks}</dd></div>
              <div><dt>{copy.completedTasks}</dt><dd>{summary.completedTasks}</dd></div>
              <div><dt>VX Rewards</dt><dd>{summary.rewards}</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.preparedGridItem}>
          <DashboardCard icon={Award} label={copy.workSections} title={copy.partnerSpace}>
            <div className={styles.preparedSections}>
              {partnerAreas.map(({ title, description, icon: Icon, href }) => (
                <Link key={title} href={href}><span><Icon aria-hidden="true" /></span><div><strong>{title}</strong><p>{description}</p></div><ArrowRight aria-hidden="true" /></Link>
              ))}
            </div>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
    </DashboardPage>
  );
}
