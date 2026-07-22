"use client";

import { Database, RotateCcw, Settings, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";

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
  const { preferences, updatePreferences, resetPreferences } = useDashboard();

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Параметры интерфейса"
        title="Настройки"
        description="Локальные предпочтения интерфейса этого устройства. Продуктовые данные всегда загружаются с сервера."
        action={<StatusPill tone="neutral">Локально</StatusPill>}
      />

      <div className={styles.settingsLayout}>
        <DashboardCard icon={Settings} label="Доступность" title="Движение интерфейса">
          <div className={styles.settingsSwitches}>
            <SettingSwitch
              checked={preferences.reducedMotion}
              onChange={(reducedMotion) => updatePreferences({ reducedMotion })}
              label="Уменьшенное движение"
              description="Отключает перемещения и каскадные анимации. Системная настройка устройства также учитывается автоматически."
            />
          </div>
        </DashboardCard>

        <DashboardCard icon={Database} label="Локальные данные" title="Настройки этого устройства">
          <div className={styles.localDataCard}>
            <ShieldCheck aria-hidden="true" />
            <div><strong>Сохраняется только предпочтение движения</strong><p>Профиль, ранг, Trust Score, VX Points и другие продуктовые данные не сохраняются в браузере как источник истины.</p></div>
          </div>
          <Button type="button" variant="outline" onClick={resetPreferences}><RotateCcw aria-hidden="true" /> Сбросить локальные настройки</Button>
        </DashboardCard>

        <DashboardCard icon={UserRound} label="Текущая конфигурация" title="Кабинет игрока">
          <dl className={styles.settingsSummary}>
            <div><dt>Роль интерфейса</dt><dd>Игрок</dd></div>
            <div><dt>Источник прогресса</dt><dd>Сервер VX House</dd></div>
            <div><dt>Движение</dt><dd>{preferences.reducedMotion ? "Уменьшено" : "Системное"}</dd></div>
            <div><dt>Серверная синхронизация</dt><dd>Подключена</dd></div>
          </dl>
        </DashboardCard>
      </div>
    </DashboardPage>
  );
}
