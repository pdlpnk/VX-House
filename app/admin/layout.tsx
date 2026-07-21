import type { Metadata } from "next";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Административная панель",
  description: "Демонстрационная frontend-структура административной панели VX House.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.dashboardRoot}><AdminShell>{children}</AdminShell></div>;
}
