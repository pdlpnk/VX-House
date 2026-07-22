import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccessCountry } from "@/lib/access-types";

type AccessConsentStepProps = {
  scenario: AccessScenario;
  country: AccessCountry;
  isAdult: boolean;
  consents: readonly { id: string; title: string; version: number; accepted: boolean }[];
  selectedConsentIds: readonly string[];
  onAdultChange: (value: boolean) => void;
  onConsentChange: (id: string, value: boolean) => void;
  onContinue: () => Promise<void>;
  onBack: () => void;
  reducedMotion: boolean;
  pending?: boolean;
  error?: string | null;
};

const roleLabels: Record<AccessScenario, string> = { player: "Игрок", partner: "Партнёр" };
const countryLabels: Record<AccessCountry, string> = { turkey: "Турция", azerbaijan: "Азербайджан" };

export function AccessConsentStep({
  scenario,
  country,
  isAdult,
  consents,
  selectedConsentIds,
  onAdultChange,
  onConsentChange,
  onContinue,
  onBack,
  reducedMotion,
  pending = false,
  error,
}: AccessConsentStepProps) {
  const canContinue = isAdult && consents.length > 0 && consents.every(({ id }) => selectedConsentIds.includes(id));

  return (
    <div className={styles.consentContent}>
      <header className={styles.stepHeading}>
        <span className={styles.scenarioEyebrow}>Обязательные подтверждения</span>
        <h1 tabIndex={-1}>Проверьте выбор и подтвердите условия</h1>
        <p>Фиксируются только опубликованные версии обязательных документов для выбранного рынка и языка.</p>
      </header>

      <motion.div
        className={styles.consentGrid}
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={styles.consentCard}>
          <div className={styles.consentHeading}><ShieldCheck aria-hidden="true" /><div><h2>Подтверждения</h2><p>Актуальные версии документов</p></div></div>

          <label className={styles.checkRow} data-checked={isAdult || undefined}>
            <input type="checkbox" checked={isAdult} onChange={(event) => onAdultChange(event.target.checked)} />
            <span className={styles.checkbox} aria-hidden="true">{isAdult ? <Check /> : null}</span>
            <span><strong>Мне исполнилось 18 лет</strong><small>VX House предназначен только для совершеннолетних пользователей.</small></span>
          </label>

          {consents.map((consent) => {
            const checked = selectedConsentIds.includes(consent.id);
            return <label key={consent.id} className={styles.checkRow} data-checked={checked || undefined}><input type="checkbox" checked={checked} onChange={(event) => onConsentChange(consent.id, event.target.checked)} /><span className={styles.checkbox} aria-hidden="true">{checked ? <Check /> : null}</span><span><strong>{consent.title}</strong><small>Версия {consent.version}. Согласие будет связано именно с этой опубликованной версией.</small></span></label>;
          })}
          {consents.length === 0 ? <p className={styles.fieldError} role="alert">Для выбранного рынка не опубликованы обязательные документы. Продолжение безопасно заблокировано.</p> : null}
          {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
        </Card>

        <Card className={styles.reviewCard}>
          <span>Сводка</span>
          <h2>Ваш предварительный сценарий</h2>
          <dl><div><dt>Роль</dt><dd>{roleLabels[scenario]}</dd></div><div><dt>Страна</dt><dd>{countryLabels[country]}</dd></div></dl>
          <p>{scenario === "partner" ? "Партнёрская роль может потребовать ручного подтверждения." : "Конкретные возможности будут определены после подтверждения профиля и рынка."}</p>
        </Card>
      </motion.div>

      <p className={styles.consentStatus} role="status">{canContinue ? "Все обязательные подтверждения отмечены." : "Чтобы продолжить, подтвердите возраст и все документы."}</p>

      <div className={styles.stepActions}>
        <Button type="button" size="lg" disabled={!canContinue || pending} onClick={() => void onContinue()}>{pending ? "Завершаем…" : "Завершить настройку"} <ArrowRight aria-hidden="true" /></Button>
        <button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />Назад</button>
      </div>
    </div>
  );
}
