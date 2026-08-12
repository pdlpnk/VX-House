import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardAnalyticsTracker } from "@/components/analytics/dashboard-analytics-tracker";
import styles from "@/app/dashboard/dashboard.module.css";
import { getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VX House",
  description: "VX House private member workspace.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { principal, profile, database } = await requireProductWorkspaceContext("PLAYER", "/dashboard");
  const support = getSupportNotificationService(database);
  const notifications = (await support.listNotifications(principal)).filter((item) => !/(task|reward|economy|points|trust|rank)/i.test(`${item.category} ${item.relatedType ?? ""}`));
  const personalConversation = await support.getPersonalConversation(principal);
  return <div className={styles.dashboardRoot}><DashboardAnalyticsTracker /><DashboardShell profile={profile} notifications={notifications} personalConversation={personalConversation} canAdmin={principal.roleKeys.includes("admin")}>{children}</DashboardShell></div>;
}
