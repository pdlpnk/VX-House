"use client";

import { AtSign, CalendarDays, Globe2, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

export function DashboardProfilePage() {
  const { profile } = useDashboard();
  if (!profile) return null;
  return <DashboardPage>
    <DashboardHeading eyebrow="Кабинет игрока" title="Профиль" description="Подтверждённые данные вашего профиля VX House." action={<StatusPill tone="success">Профиль активен</StatusPill>} />
    <div className={styles.profilePageGrid}>
      <DashboardCard icon={UserRound} label="Личные данные" title={profile.user.displayName ?? "Пользователь VX House"}>
        <dl className={styles.profileFacts}>
          <div><dt><AtSign aria-hidden="true" /> Электронная почта</dt><dd>{profile.user.email}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> Рынок</dt><dd>{profile.market.name}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> Язык</dt><dd>{profile.preferredLanguage}</dd></div>
          <div><dt><CalendarDays aria-hidden="true" /> Профиль создан</dt><dd>{new Intl.DateTimeFormat("ru-RU").format(new Date(profile.createdAt))}</dd></div>
        </dl>
      </DashboardCard>
      <div className={styles.profileAside}><DashboardCard icon={ShieldCheck} label="Состояние" title="Контакт подтверждён" action={<StatusPill tone="success">{profile.accountStatus}</StatusPill>}><p className={styles.cardLead}>Роль: игрок. Электронная почта подтверждена, а доступ определён серверным профилем.</p></DashboardCard></div>
    </div>
  </DashboardPage>;
}
