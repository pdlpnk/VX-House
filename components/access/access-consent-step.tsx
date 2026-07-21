import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccessCountry } from "@/lib/access-draft";

type AccessConsentStepProps = {
  scenario: AccessScenario;
  country: AccessCountry;
  isAdult: boolean;
  acceptedRules: boolean;
  acceptedPrivacy: boolean;
  onAdultChange: (value: boolean) => void;
  onRulesChange: (value: boolean) => void;
  onPrivacyChange: (value: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
  reducedMotion: boolean;
};

const roleLabels: Record<AccessScenario, string> = { player: "Игрок", partner: "Партнёр" };
const countryLabels: Record<AccessCountry, string> = { turkey: "Турция", azerbaijan: "Азербайджан" };

export function AccessConsentStep({
  scenario,
  country,
  isAdult,
  acceptedRules,
  acceptedPrivacy,
  onAdultChange,
  onRulesChange,
  onPrivacyChange,
  onContinue,
  onBack,
  reducedMotion,
}: AccessConsentStepProps) {
  const canContinue = isAdult && acceptedRules && acceptedPrivacy;

  return (
    <div className={styles.consentContent}>
      <header className={styles.stepHeading}>
        <span className={styles.scenarioEyebrow}>Обязательные подтверждения</span>
        <h1 tabIndex={-1}>Проверьте выбор и подтвердите условия</h1>
        <p>Без этих подтверждений продолжить нельзя. Они действуют только в текущей вкладке и не отправляются на сервер.</p>
      </header>

      <motion.div
        className={styles.consentGrid}
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={styles.consentCard}>
          <div className={styles.consentHeading}><ShieldCheck aria-hidden="true" /><div><h2>Подтверждения</h2><p>Три обязательных пункта</p></div></div>

          <label className={styles.checkRow} data-checked={isAdult || undefined}>
            <input type="checkbox" checked={isAdult} onChange={(event) => onAdultChange(event.target.checked)} />
            <span className={styles.checkbox} aria-hidden="true">{isAdult ? <Check /> : null}</span>
            <span><strong>Мне исполнилось 18 лет</strong><small>VX House предназначен только для совершеннолетних пользователей.</small></span>
          </label>

          <label className={styles.checkRow} data-checked={acceptedRules || undefined}>
            <input type="checkbox" checked={acceptedRules} onChange={(event) => onRulesChange(event.target.checked)} />
            <span className={styles.checkbox} aria-hidden="true">{acceptedRules ? <Check /> : null}</span>
            <span><strong>Я принимаю правила использования</strong><small>Мне понятны границы платформы и отсутствие гарантий результата.</small></span>
          </label>

          <label className={styles.checkRow} data-checked={acceptedPrivacy || undefined}>
            <input type="checkbox" checked={acceptedPrivacy} onChange={(event) => onPrivacyChange(event.target.checked)} />
            <span className={styles.checkbox} aria-hidden="true">{acceptedPrivacy ? <Check /> : null}</span>
            <span><strong>Я ознакомился с политикой конфиденциальности</strong><small>Понимаю, какие данные будут нужны при создании настоящего профиля.</small></span>
          </label>

          <div className={styles.legalLinks}>
            <Link href="/#responsible-use" target="_blank">Ответственное использование <ExternalLink aria-hidden="true" /></Link>
            <Link href="/#privacy" target="_blank">Приватность <ExternalLink aria-hidden="true" /></Link>
          </div>
        </Card>

        <Card className={styles.reviewCard}>
          <span>Сводка</span>
          <h2>Ваш предварительный сценарий</h2>
          <dl><div><dt>Роль</dt><dd>{roleLabels[scenario]}</dd></div><div><dt>Страна</dt><dd>{countryLabels[country]}</dd></div></dl>
          <p>{scenario === "partner" ? "Партнёрская роль может потребовать ручного подтверждения." : "Конкретные возможности будут определены после подтверждения профиля и рынка."}</p>
        </Card>
      </motion.div>

      <p className={styles.consentStatus} role="status">{canContinue ? "Все обязательные подтверждения отмечены." : "Чтобы продолжить, отметьте все три пункта."}</p>

      <div className={styles.stepActions}>
        <Button type="button" size="lg" disabled={!canContinue} onClick={onContinue}>Завершить знакомство <ArrowRight aria-hidden="true" /></Button>
        <button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />Назад</button>
      </div>
    </div>
  );
}
