import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AccessCountry, AccessScenario } from "@/lib/access-types";
import { accessContent } from "@/lib/i18n/access-content";

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
  const { locale, t } = useI18n();
  const content = accessContent[locale];
  const copy = content.consent;
  const canContinue = isAdult && consents.length > 0 && consents.every(({ id }) => selectedConsentIds.includes(id));

  return (
    <div className={styles.consentContent}>
      <header className={styles.stepHeading}>
        <span className={styles.scenarioEyebrow}>{copy.eyebrow}</span>
        <h1 tabIndex={-1}>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      <motion.div
        className={styles.consentGrid}
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={styles.consentCard}>
          <div className={styles.consentHeading}><ShieldCheck aria-hidden="true" /><div><h2>{copy.heading}</h2><p>{copy.current}</p></div></div>

          <label className={styles.checkRow} data-checked={isAdult || undefined}>
            <input type="checkbox" checked={isAdult} onChange={(event) => onAdultChange(event.target.checked)} />
            <span className={styles.checkbox} aria-hidden="true">{isAdult ? <Check /> : null}</span>
            <span><strong>{copy.adult}</strong><small>{copy.adultHelp}</small></span>
          </label>

          {consents.map((consent) => {
            const checked = selectedConsentIds.includes(consent.id);
            return <label key={consent.id} className={styles.checkRow} data-checked={checked || undefined}><input type="checkbox" checked={checked} onChange={(event) => onConsentChange(consent.id, event.target.checked)} /><span className={styles.checkbox} aria-hidden="true">{checked ? <Check /> : null}</span><span><strong>{consent.title}</strong><small>{copy.version.replace("{version}", String(consent.version))}</small></span></label>;
          })}
          {consents.length === 0 ? <p className={styles.fieldError} role="alert">{copy.missing}</p> : null}
          {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
        </Card>

        <Card className={styles.reviewCard}>
          <span>{copy.summary}</span>
          <h2>{copy.scenario}</h2>
          <dl><div><dt>{copy.role}</dt><dd>{content.labels[scenario]}</dd></div><div><dt>{copy.country}</dt><dd>{content.labels[country]}</dd></div></dl>
          <p>{scenario === "partner" ? copy.partnerNote : copy.playerNote}</p>
        </Card>
      </motion.div>

      <p className={styles.consentStatus} role="status">{canContinue ? copy.ready : copy.blocked}</p>

      <div className={styles.stepActions}>
        <Button type="button" size="lg" disabled={!canContinue || pending} onClick={() => void onContinue()}>{pending ? copy.finishing : copy.finish} <ArrowRight aria-hidden="true" /></Button>
        <button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />{t("common.back")}</button>
      </div>
    </div>
  );
}
