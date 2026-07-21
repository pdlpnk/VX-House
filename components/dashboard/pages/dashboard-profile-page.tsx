"use client";

import { AtSign, Check, Globe2, Save, ShieldAlert, UserRound } from "lucide-react";
import { type FormEvent, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardProfilePage() {
  const { preferences, updatePreferences } = useDashboard();
  const [draftName, setDraftName] = useState(preferences.displayName);
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updatePreferences({ displayName: draftName.trim() || "Демо-профиль" });
    setSaved(true);
  }

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Кабинет игрока"
        title="Профиль"
        description="Локальное представление будущего профиля. Аккаунт, электронная почта и рынок ещё не подключены."
        action={<StatusPill tone="neutral">Демонстрация</StatusPill>}
      />

      <div className={styles.profilePageGrid}>
        <form className={styles.profileForm} onSubmit={submit} onChange={() => setSaved(false)}>
          <DashboardCard icon={UserRound} label="Локальная настройка" title="Отображаемое имя">
            <label className={styles.fieldLabel}>
              <span>Имя в интерфейсе</span>
              <div className={styles.dashboardInput}><UserRound aria-hidden="true" /><Input value={draftName} autoComplete="off" maxLength={48} onChange={(event) => setDraftName(event.target.value)} /></div>
              <small>Сохраняется только в браузере и не создаёт профиль VX House.</small>
            </label>
            <div className={styles.formActions}>
              <Button type="submit" size="lg"><Save aria-hidden="true" /> Сохранить локально</Button>
              {saved ? <span role="status"><Check aria-hidden="true" /> Имя сохранено на этом устройстве</span> : null}
            </div>
          </DashboardCard>
        </form>

        <div className={styles.profileAside}>
          <DashboardCard icon={ShieldAlert} label="Состояние профиля" title="Профиль не создан" action={<StatusPill tone="attention">Нет серверных данных</StatusPill>}>
            <dl className={styles.profileFacts}>
              <div><dt><UserRound aria-hidden="true" /> Роль</dt><dd>Игрок</dd></div>
              <div><dt><AtSign aria-hidden="true" /> Электронная почта</dt><dd>Не подключена</dd></div>
              <div><dt><Globe2 aria-hidden="true" /> Страна</dt><dd>Не подтверждена</dd></div>
              <div><dt><ShieldAlert aria-hidden="true" /> Доступ</dt><dd>Демонстрационный</dd></div>
            </dl>
          </DashboardCard>

          <DashboardCard icon={ShieldAlert} label="О данных" title="Без ложной активации">
            <p className={styles.cardLead}>Интерфейс не утверждает, что аккаунт создан или проверен. Настоящие данные появятся только после реализации авторизации и backend.</p>
          </DashboardCard>
        </div>
      </div>
    </DashboardPage>
  );
}
