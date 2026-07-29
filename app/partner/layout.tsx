import type { Metadata } from "next";

import styles from "@/app/dashboard/dashboard.module.css";
import { PartnerShell } from "@/components/partner/partner-shell";
import { getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Кабинет партнёра",
  description: "Защищённое рабочее пространство партнёра VX House.",
  robots: { index: false, follow: false },
};

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { principal, profile, database } = await requireProductWorkspaceContext("PARTNER", "/partner");
  const support = getSupportNotificationService(database);
  return <div className={styles.dashboardRoot}><PartnerShell profile={profile} notifications={await support.listNotifications(principal)} personalConversation={await support.getPersonalConversation(principal)}>{children}</PartnerShell></div>;
}
