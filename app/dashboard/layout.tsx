import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/app/dashboard/dashboard.module.css";

export const metadata: Metadata = {
  title: "Кабинет игрока",
  description: "Демонстрационный кабинет игрока VX House с прозрачным отображением будущего прогресса.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.dashboardRoot}><DashboardShell>{children}</DashboardShell></div>;
}
