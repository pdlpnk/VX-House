import { AtSign, CalendarDays, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { getDatabase } from "@/lib/db";
import { requireAdminWorkspace } from "@/lib/server";

export default async function AdminProfilePage() {
  const principal = await requireAdminWorkspace();
  const user = await getDatabase().user.findUniqueOrThrow({
    where: { id: principal.userId },
    include: { roles: true },
  });

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Административная панель"
        title="Профиль"
        description="Данные текущего административного аккаунта и его инфраструктурный доступ."
        action={<StatusPill tone="success">Доступ активен</StatusPill>}
      />
      <div className={styles.profilePageGrid}>
        <DashboardCard icon={UserRound} label="Администратор" title={user.displayName || "Администратор VX House"}>
          <dl className={styles.profileFacts}>
            <div><dt><AtSign aria-hidden="true" /> Электронная почта</dt><dd>{user.email}</dd></div>
            <div><dt><ShieldCheck aria-hidden="true" /> Роль</dt><dd>{user.roles.map((role) => role.name).join(", ") || "Администратор"}</dd></div>
            <div><dt><CalendarDays aria-hidden="true" /> Аккаунт создан</dt><dd>{new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC" }).format(user.createdAt)}</dd></div>
          </dl>
        </DashboardCard>
        <div className={styles.profileAside}>
          <DashboardCard icon={ShieldCheck} label="Безопасность" title="Серверный контроль доступа" action={<StatusPill tone="success">RBAC</StatusPill>}>
            <p className={styles.cardLead}>Права проверяются сервером для каждого административного действия.</p>
          </DashboardCard>
        </div>
      </div>
    </DashboardPage>
  );
}
