"use client";

import { AtSign, CalendarDays, Globe2, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

const accountStatusLabels: Record<string, string> = {
  PENDING: "Почта подтверждена",
  ACTIVE: "Профиль активен",
  SUSPENDED: "Доступ приостановлен",
  CLOSED: "Профиль закрыт",
};

export function DashboardProfilePage() {
  const { profile } = useDashboard();
  if (!profile) return null;
  return <DashboardPage>
    <DashboardHeading eyebrow="Кабинет игрока" title="Профиль" description="Подтверждённые данные вашего профиля VX House." action={<StatusPill tone="success">Профиль активен</StatusPill>} />
    <div className={styles.profilePageGrid}>
      <DashboardCard icon={UserRound} label="Личные данные" title={profile.user.displayName ?? "Пользователь VX House"}>
        <dl className={styles.profileFacts}>
          <div><dt><AtSign aria-hidden="true" /> Электронная почта</dt><dd>{profile.user.email}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> Страна</dt><dd>{profile.market.name}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> Язык</dt><dd>{profile.preferredLanguage}</dd></div>
          <div><dt><CalendarDays aria-hidden="true" /> Профиль создан</dt><dd>{new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC" }).format(new Date(profile.createdAt))}</dd></div>
        </dl>
      </DashboardCard>
      <div className={styles.profileAside}><DashboardCard icon={ShieldCheck} label="Состояние" title="Контакт подтверждён" action={<StatusPill tone="success">{accountStatusLabels[profile.accountStatus] ?? "Статус обновляется"}</StatusPill>}><p className={styles.cardLead}>Электронная почта подтверждена. Доступные возможности отображаются в вашем кабинете.</p></DashboardCard></div>
    </div>
  </DashboardPage>;
}
