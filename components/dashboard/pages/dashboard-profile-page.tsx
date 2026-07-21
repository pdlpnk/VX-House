"use client";

import { AtSign, CalendarDays, Check, Save, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roleLabel, type DashboardRole } from "@/lib/dashboard-data";

export function DashboardProfilePage() {
  const { profile, updateProfile } = useDashboard();
  const [saved, setSaved] = useState(false);
  const isPartner = profile.role === "partner";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Данные пространства"
        title="Профиль"
        description="Управляйте основными данными и проверяйте состояние вашего пространства VX House."
        action={<StatusPill tone="success">Профиль подготовлен</StatusPill>}
      />

      <div className={styles.profilePageGrid}>
        <form className={styles.profileForm} onSubmit={submit} onChange={() => setSaved(false)}>
          <DashboardCard icon={UserRound} label="Основные данные" title="Личная информация">
            <div className={styles.formGrid}>
              <label className={styles.fieldLabel}>
                <span>Имя</span>
                <div className={styles.dashboardInput}><UserRound aria-hidden="true" /><Input value={profile.name} autoComplete="name" onChange={(event) => updateProfile({ name: event.target.value })} /></div>
              </label>
              <label className={styles.fieldLabel}>
                <span>Электронная почта</span>
                <div className={styles.dashboardInput}><AtSign aria-hidden="true" /><Input type="email" value={profile.email} autoComplete="email" onChange={(event) => updateProfile({ email: event.target.value })} /></div>
              </label>
              <label className={styles.fieldLabel}>
                <span>Роль</span>
                <select value={profile.role} onChange={(event) => updateProfile({ role: event.target.value as DashboardRole })}>
                  <option value="player">Игрок</option>
                  <option value="partner">Партнёр</option>
                </select>
                <small>При смене роли содержимое кабинета обновится автоматически.</small>
              </label>
              <div className={styles.fieldLabel}>
                <span>Дата создания пространства</span>
                <div className={styles.readonlyField}><CalendarDays aria-hidden="true" /><strong>{profile.createdAt}</strong></div>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" size="lg"><Save aria-hidden="true" /> Сохранить</Button>
              {saved && <span role="status"><Check aria-hidden="true" /> Изменения сохранены локально</span>}
            </div>
          </DashboardCard>
        </form>

        <div className={styles.profileAside}>
          <DashboardCard icon={ShieldCheck} label="Статус профиля" title="Пространство активно" action={<StatusPill tone="success">Готово</StatusPill>}>
            <div className={styles.profileCompletion}>
              <div className={styles.profileCompletionRing}><span>100%</span></div>
              <div><strong>Основные данные заполнены</strong><p>{isPartner ? "Партнёрский сценарий подключён и готов к демонстрации." : "Профиль готов к использованию возможностей платформы."}</p></div>
            </div>
            <ul className={styles.profileChecks}>
              <li><Check aria-hidden="true" /> Имя и контакт указаны</li>
              <li><Check aria-hidden="true" /> Роль: {roleLabel(profile.role)}</li>
              <li><Check aria-hidden="true" /> Пространство создано</li>
            </ul>
          </DashboardCard>

          <DashboardCard icon={AtSign} label="Использование данных" title="Локальный демонстрационный профиль">
            <p className={styles.cardLead}>Данные хранятся только на этом устройстве. Сервер, авторизация и отправка электронной почты в первой версии не подключены.</p>
          </DashboardCard>
        </div>
      </div>
    </DashboardPage>
  );
}
