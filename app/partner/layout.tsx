import type { Metadata } from "next";

import styles from "@/app/dashboard/dashboard.module.css";
import { PartnerShell } from "@/components/partner/partner-shell";

export const metadata: Metadata = {
  title: "Кабинет партнёра",
  description: "Демонстрационное рабочее пространство партнёра VX House.",
  robots: { index: false, follow: false },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.dashboardRoot}><PartnerShell>{children}</PartnerShell></div>;
}
