"use client";

import { AtSign, CalendarDays, Globe2, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";

export function DashboardProfilePage() {
  const { profile } = useDashboard();
  const { locale, t } = useI18n();
  if (!profile) return null;
  const accountStatusLabels: Record<string, string> = { PENDING: t("profile.emailVerified"), ACTIVE: t("dashboard.profileActive"), SUSPENDED: t("profile.suspended"), CLOSED: t("profile.closed") };
  return <DashboardPage>
    <DashboardHeading eyebrow={t("profile.playerArea")} title={t("profile.title")} description={t("profile.description")} action={<StatusPill tone="success">{t("dashboard.profileActive")}</StatusPill>} />
    <div className={styles.profilePageGrid}>
      <DashboardCard icon={UserRound} label={t("profile.personalData")} title={profile.user.displayName ?? t("profile.userFallback")}>
        <dl className={styles.profileFacts}>
          <div><dt><AtSign aria-hidden="true" /> {t("profile.email")}</dt><dd>{profile.user.email}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> {t("profile.country")}</dt><dd>{profile.market.name}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> {t("profile.language")}</dt><dd>{profile.preferredLanguage}</dd></div>
          <div><dt><CalendarDays aria-hidden="true" /> {t("profile.created")}</dt><dd>{new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(profile.createdAt))}</dd></div>
        </dl>
      </DashboardCard>
      <div className={styles.profileAside}><DashboardCard icon={ShieldCheck} label={t("profile.state")} title={t("profile.contactVerified")} action={<StatusPill tone="success">{accountStatusLabels[profile.accountStatus] ?? t("profile.statusUpdating")}</StatusPill>}><p className={styles.cardLead}>{t("profile.managerReady")}</p></DashboardCard></div>
    </div>
  </DashboardPage>;
}
