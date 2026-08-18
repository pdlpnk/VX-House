import type { Metadata } from "next";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminWorkspace } from "@/lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  description: "Secure VX House administration workspace.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminWorkspace();
  return <div className={styles.dashboardRoot}><AdminShell>{children}</AdminShell></div>;
}
