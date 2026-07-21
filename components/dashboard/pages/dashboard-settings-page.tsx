"use client";

import { Bell, Check, Database, RotateCcw, Save, Settings, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardRole } from "@/lib/dashboard-data";

function SettingSwitch({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description: string }) {
  return (
    <label className={styles.settingSwitch}>
      <div><strong>{label}</strong><p>{description}</p></div>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span aria-hidden="true"><i /></span>
    </label>
  );
}

export function DashboardSettingsPage() {
  const { profile, updateProfile, resetProfile } = useDashboard();
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Управление пространством"
        title="Настройки"
        description="Настройте локальный профиль, роль и поведение демонстрационного кабинета."
        action={<StatusPill tone="neutral">Локальные данные</StatusPill>}
      />

      <form className={styles.settingsLayout} onSubmit={submit} onChange={() => setSaved(false)}>
        <DashboardCard icon={UserRound} label="Пользователь" title="Профиль и роль">
          <div className={styles.settingsFields}>
            <label className={styles.fieldLabel}><span>Имя</span><Input value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} /></label>
            <label className={styles.fieldLabel}><span>Роль</span><select value={profile.role} onChange={(event) => updateProfile({ role: event.target.value as DashboardRole })}><option value="player">Игрок</option><option value="partner">Партнёр</option></select><small>Контент всех страниц изменится сразу после выбора.</small></label>
          </div>
        </DashboardCard>

        <DashboardCard icon={Settings} label="Интерфейс" title="Поведение кабинета">
          <div className={styles.settingsSwitches}>
            <SettingSwitch checked={profile.reducedMotion} onChange={(reducedMotion) => updateProfile({ reducedMotion })} label="Уменьшенное движение" description="Отключает перемещения и каскадные анимации внутри кабинета." />
            <SettingSwitch checked={profile.notificationsEnabled} onChange={(notificationsEnabled) => updateProfile({ notificationsEnabled })} label="Демонстрационные уведомления" description="Показывает локальные примеры важных изменений пространства." />
            <SettingSwitch checked={profile.demoMode} onChange={(demoMode) => updateProfile({ demoMode })} label="Демонстрационный режим" description="Обозначает, что данные и действия не связаны с реальными сервисами." />
          </div>
        </DashboardCard>

        <DashboardCard icon={Database} label="Локальные данные" title="Хранение на устройстве">
          <div className={styles.localDataCard}>
            <ShieldCheck aria-hidden="true" />
            <div><strong>Данные остаются в браузере</strong><p>Имя, роль и настройки используются только для демонстрационного кабинета VX House.</p></div>
          </div>
          <Button type="button" variant="outline" onClick={() => { resetProfile(); setSaved(false); }}><RotateCcw aria-hidden="true" /> Сбросить демо-данные</Button>
        </DashboardCard>

        <DashboardCard icon={Bell} label="Сводка" title="Текущая конфигурация">
          <dl className={styles.settingsSummary}>
            <div><dt>Роль</dt><dd>{profile.role === "partner" ? "Партнёр" : "Игрок"}</dd></div>
            <div><dt>Движение</dt><dd>{profile.reducedMotion ? "Уменьшено" : "Стандартное"}</dd></div>
            <div><dt>Уведомления</dt><dd>{profile.notificationsEnabled ? "Включены" : "Выключены"}</dd></div>
            <div><dt>Режим</dt><dd>{profile.demoMode ? "Демонстрационный" : "Локальный"}</dd></div>
          </dl>
        </DashboardCard>

        <div className={styles.settingsActions}>
          <Button type="submit" size="lg"><Save aria-hidden="true" /> Сохранить настройки</Button>
          {saved && <span role="status"><Check aria-hidden="true" /> Настройки сохранены</span>}
        </div>
      </form>
    </DashboardPage>
  );
}
