"use client";

import { Database, RotateCcw, Settings, ShieldCheck, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

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
  const { t } = useI18n();

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={t("settings.interface")}
        title={t("page.settings")}
        description={t("settings.description")}
      />

      <div className={styles.settingsLayout}>
        <DashboardCard icon={Settings} label={t("settings.accessibility")} title={t("settings.motion")}>
          <div className={styles.settingsSwitches}>
            <SettingSwitch
              checked={preferences.reducedMotion}
              onChange={(reducedMotion) => updatePreferences({ reducedMotion })}
              label={t("settings.reducedMotion")}
              description={t("settings.reducedMotionDescription")}
            />
          </div>
        </DashboardCard>

        <DashboardCard icon={Database} label={t("settings.localData")} title={t("settings.device")}>
          <div className={styles.localDataCard}>
            <ShieldCheck aria-hidden="true" />
            <div><strong>{t("settings.deviceOnly")}</strong><p>{t("settings.profileSafe")}</p></div>
          </div>
          <Button type="button" variant="outline" onClick={resetPreferences}><RotateCcw aria-hidden="true" /> {t("settings.reset")}</Button>
        </DashboardCard>

        <DashboardCard icon={UserRound} label={t("settings.space")} title={t("settings.playerArea")}>
          <dl className={styles.settingsSummary}>
            <div><dt>{t("settings.space")}</dt><dd>{t("settings.playerArea")}</dd></div>
            <div><dt>{t("settings.motionLabel")}</dt><dd>{preferences.reducedMotion ? t("settings.reduced") : t("settings.system")}</dd></div>
            <div><dt>{t("settings.state")}</dt><dd>{t("settings.current")}</dd></div>
          </dl>
        </DashboardCard>
      </div>
    </DashboardPage>
  );
}
