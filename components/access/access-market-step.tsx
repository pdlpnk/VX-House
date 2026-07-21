import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Globe2, Languages, MapPin } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccessCountry, AccessLanguage } from "@/lib/access-draft";

type AccessMarketStepProps = {
  country: AccessCountry | null;
  language: AccessLanguage | null;
  onCountryChange: (country: AccessCountry) => void;
  onLanguageChange: (language: AccessLanguage) => void;
  onContinue: () => void;
  onBack: () => void;
  reducedMotion: boolean;
};

const countries = [
  { id: "turkey" as const, title: "Турция", description: "Условия и партнёрские сервисы для рынка Турции." },
  { id: "azerbaijan" as const, title: "Азербайджан", description: "Условия и партнёрские сервисы для рынка Азербайджана." },
] as const;

const languages = [
  { id: "ru" as const, title: "Русский", status: "Доступен сейчас" },
  { id: "tr" as const, title: "Türkçe", status: "Предпочтение для будущей локализации" },
  { id: "az" as const, title: "Azərbaycan dili", status: "Предпочтение для будущей локализации" },
] as const;

export function AccessMarketStep({
  country,
  language,
  onCountryChange,
  onLanguageChange,
  onContinue,
  onBack,
  reducedMotion,
}: AccessMarketStepProps) {
  const canContinue = Boolean(country && language);

  return (
    <div className={styles.marketContent}>
      <header className={styles.stepHeading}>
        <span className={styles.scenarioEyebrow}>Рынок и язык</span>
        <h1 tabIndex={-1}>Уточните страну и язык</h1>
        <p>
          Страна влияет на применимые условия. Язык сейчас сохраняется только как
          предпочтение: интерфейс остаётся на русском до этапа локализации.
        </p>
      </header>

      <motion.div
        className={styles.marketGrid}
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={styles.marketPanel}>
          <div className={styles.marketPanelHeading}>
            <MapPin aria-hidden="true" />
            <div><h2>Страна</h2><p>Выберите один стартовый рынок.</p></div>
          </div>
          <fieldset className={styles.marketOptions}>
            <legend className={styles.srOnly}>Выберите страну</legend>
            {countries.map((option) => (
              <label key={option.id} className={styles.marketOption} data-selected={country === option.id || undefined}>
                <input type="radio" name="access-country" value={option.id} checked={country === option.id} onChange={() => onCountryChange(option.id)} />
                <span className={styles.optionCheck} aria-hidden="true">{country === option.id ? <Check /> : null}</span>
                <span><strong>{option.title}</strong><small>{option.description}</small></span>
              </label>
            ))}
          </fieldset>
        </Card>

        <Card className={styles.marketPanel}>
          <div className={styles.marketPanelHeading}>
            <Languages aria-hidden="true" />
            <div><h2>Предпочтительный язык</h2><p>Это не переключает язык текущей версии.</p></div>
          </div>
          <fieldset className={styles.marketOptions}>
            <legend className={styles.srOnly}>Выберите предпочтительный язык</legend>
            {languages.map((option) => (
              <label key={option.id} className={styles.marketOption} data-selected={language === option.id || undefined}>
                <input type="radio" name="access-language" value={option.id} checked={language === option.id} onChange={() => onLanguageChange(option.id)} />
                <span className={styles.optionCheck} aria-hidden="true">{language === option.id ? <Check /> : null}</span>
                <span><strong>{option.title}</strong><small>{option.status}</small></span>
              </label>
            ))}
          </fieldset>
        </Card>
      </motion.div>

      <div className={styles.marketNotice} role="note">
        <Globe2 aria-hidden="true" />
        <p><strong>Выбор не подтверждает доступность.</strong> Конкретные условия будут проверяться отдельно после подключения профиля и партнёрских сервисов.</p>
      </div>

      <div className={styles.stepActions}>
        <Button type="button" size="lg" disabled={!canContinue} onClick={onContinue}>Продолжить <ArrowRight aria-hidden="true" /></Button>
        <button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />Назад</button>
      </div>
    </div>
  );
}
