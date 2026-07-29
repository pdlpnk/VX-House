"use client";

import { Database, RotateCcw, Settings, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
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
        description="Настройте интерфейс VX House под себя."
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
            <div><strong>Настройка действует на этом устройстве</strong><p>Данные профиля, VX Points и награды останутся без изменений.</p></div>
          </div>
          <Button type="button" variant="outline" onClick={resetPreferences}><RotateCcw aria-hidden="true" /> Сбросить локальные настройки</Button>
        </DashboardCard>

        <DashboardCard icon={UserRound} label="Ваше пространство" title="Кабинет игрока">
          <dl className={styles.settingsSummary}>
            <div><dt>Пространство</dt><dd>Кабинет игрока</dd></div>
            <div><dt>Прогресс</dt><dd>Синхронизирован</dd></div>
            <div><dt>Движение</dt><dd>{preferences.reducedMotion ? "Уменьшено" : "Системное"}</dd></div>
            <div><dt>Состояние</dt><dd>Актуально</dd></div>
          </dl>
        </DashboardCard>
      </div>
    </DashboardPage>
  );
}
