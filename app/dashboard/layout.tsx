import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/app/dashboard/dashboard.module.css";
import { getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Кабинет игрока",
  description: "Защищённый кабинет игрока VX House.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { principal, profile } = await requireProductWorkspaceContext("PLAYER", "/dashboard");
  return <div className={styles.dashboardRoot}><DashboardShell profile={profile} notifications={await getSupportNotificationService().listNotifications(principal)}>{children}</DashboardShell></div>;
}
