import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/app/dashboard/dashboard.module.css";
import { getEconomyRewardService, getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Кабинет игрока",
  description: "Защищённый кабинет игрока VX House.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { principal, profile, database } = await requireProductWorkspaceContext("PLAYER", "/dashboard");
  const notifications = await getSupportNotificationService(database).listNotifications(principal);
  const personalConversation = await getSupportNotificationService(database).getPersonalConversation(principal);
  const economy = await getEconomyRewardService(database).getSnapshot(principal);
  return <div className={styles.dashboardRoot}><DashboardShell profile={profile} notifications={notifications} personalConversation={personalConversation} economy={economy} canAdmin={principal.roleKeys.includes("admin")}>{children}</DashboardShell></div>;
}
