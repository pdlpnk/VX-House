"use client";

import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

export function DashboardHome() {
  const { profile } = useDashboard();
  const { t } = useI18n();
  return <DashboardPage>
    <DashboardHeading eyebrow={t("page.home")} title={t("dashboard.greeting", { name: profile?.user.displayName ?? t("dashboard.playerFallback") })} description={t("dashboard.welcome")} />
    <section className={styles.managerHomeHero} aria-labelledby="personal-manager-title">
      <div className={styles.managerHomeIcon}><MessageCircle aria-hidden="true" /></div>
      <div>
        <small>{t("dashboard.personalChannel")}</small>
        <h2 id="personal-manager-title">{t("dashboard.personalManager")}</h2>
        <p>{t("dashboard.managerHelp")}</p>
        <Button asChild size="lg"><Link href="/dashboard/support">{t("dashboard.contactManager")}<ArrowRight aria-hidden="true" /></Link></Button>
      </div>
      <span className={styles.managerHomeTrust}><ShieldCheck aria-hidden="true" />{t("dashboard.privateConversation")}</span>
    </section>
  </DashboardPage>;
}
