"use client";

import { AtSign, CalendarDays, Globe2, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

export function PartnerProfilePage() {
  const { profile } = useDashboard();
  if (!profile) return null;
  const pending = profile.partnerProfile?.status === "PENDING";
  return <DashboardPage>
    <DashboardHeading eyebrow="Кабинет партнёра" title="Профиль" description="Подтверждённые данные партнёрского профиля VX House." action={<StatusPill tone={pending ? "attention" : "success"}>{pending ? "Ожидает одобрения" : "Одобрен"}</StatusPill>} />
    <div className={styles.profilePageGrid}>
      <DashboardCard icon={UserRound} label="Личные данные" title={profile.user.displayName ?? "Партнёр VX House"}>
        <dl className={styles.profileFacts}>
          <div><dt><AtSign aria-hidden="true" /> Электронная почта</dt><dd>{profile.user.email}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> Рынок</dt><dd>{profile.market.name}</dd></div>
          <div><dt><Globe2 aria-hidden="true" /> Язык</dt><dd>{profile.preferredLanguage}</dd></div>
          <div><dt><CalendarDays aria-hidden="true" /> Профиль создан</dt><dd>{new Intl.DateTimeFormat("ru-RU").format(new Date(profile.createdAt))}</dd></div>
        </dl>
      </DashboardCard>
      <div className={styles.profileAside}><DashboardCard icon={ShieldCheck} label="Состояние доступа" title={pending ? "Требуется ручное одобрение" : "Партнёрский доступ одобрен"} action={<StatusPill tone={pending ? "attention" : "success"}>{profile.accountStatus}</StatusPill>}><p className={styles.cardLead}>{pending ? "Профиль и контакт подтверждены. Партнёрские функции остаются ограниченными до решения команды VX House." : "Права определяются серверным партнёрским профилем."}</p></DashboardCard></div>
    </div>
  </DashboardPage>;
}
