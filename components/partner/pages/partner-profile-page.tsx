"use client";

import { AtSign, CalendarDays, Globe2, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import { intlLocales } from "@/lib/i18n";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function PartnerProfilePage() {
  const { profile } = useDashboard();
  const { locale } = useI18n();
  const copy = workspaceContent[locale].partner.profile;
  if (!profile) return null;
  const pending = profile.partnerProfile?.status === "PENDING";
  return <DashboardPage>
    <DashboardHeading eyebrow={copy.area} title={copy.title} description={copy.description} action={<StatusPill tone={pending ? "attention" : "success"}>{pending ? copy.pending : copy.approved}</StatusPill>} />
    <div className={styles.profilePageGrid}>
      <DashboardCard icon={UserRound} label={copy.personal} title={profile.user.displayName ?? copy.fallback}>
        <dl className={styles.profileFacts}>
          <div><dt><AtSign aria-hidden="true" /> {copy.email}</dt><dd>{profile.user.email}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> {copy.market}</dt><dd>{profile.market.name}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> {copy.language}</dt><dd>{profile.preferredLanguage}</dd></div>
          <div><dt><CalendarDays aria-hidden="true" /> {copy.created}</dt><dd>{new Intl.DateTimeFormat(intlLocales[locale]).format(new Date(profile.createdAt))}</dd></div>
        </dl>
      </DashboardCard>
      <div className={styles.profileAside}><DashboardCard icon={ShieldCheck} label={copy.state} title={pending ? copy.manual : copy.accessApproved} action={<StatusPill tone={pending ? "attention" : "success"}>{profile.accountStatus}</StatusPill>}><p className={styles.cardLead}>{pending ? copy.pendingHelp : copy.approvedHelp}</p></DashboardCard></div>
    </div>
  </DashboardPage>;
}
