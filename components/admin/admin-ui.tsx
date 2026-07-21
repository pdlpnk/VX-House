import { Info, LockKeyhole } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";

export function AdminDemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminDemoNotice} role="note">
      <Info aria-hidden="true" />
      <p><strong>Демонстрационный административный интерфейс.</strong> {children}</p>
    </div>
  );
}

export function AdminBackendNotice() {
  return (
    <div className={styles.adminBackendNotice} role="status">
      <LockKeyhole aria-hidden="true" />
      <span>Будет доступно после подключения backend</span>
    </div>
  );
}
