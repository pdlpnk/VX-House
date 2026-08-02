"use client";

import { ArrowRight, Check, CircleUserRound, Handshake, MapPin } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AccessCountry, AccessScenario } from "@/lib/access-types";

const roles = [
  { id: "player" as const, title: "onboarding.player" as const, description: "onboarding.playerDescription" as const, icon: CircleUserRound },
  { id: "partner" as const, title: "onboarding.partner" as const, description: "onboarding.partnerDescription" as const, icon: Handshake },
];
const countries = [{ id: "turkey" as const, title: "onboarding.turkey" as const }, { id: "azerbaijan" as const, title: "onboarding.azerbaijan" as const }];

export function AccessOnboardingWelcomeStep({
  scenario,
  country,
  pending,
  onScenarioChange,
  onCountryChange,
  onContinue,
}: {
  scenario: AccessScenario | null;
  country: AccessCountry | null;
  pending: boolean;
  onScenarioChange: (value: AccessScenario) => void;
  onCountryChange: (value: AccessCountry) => void;
  onContinue: () => Promise<void>;
}) {
  const { t } = useI18n();
  const ready = Boolean(scenario && country);
  return <div className={styles.marketContent}>
    <header className={styles.stepHeading}>
      <span className={styles.scenarioEyebrow}>{t("onboarding.welcome")}</span>
      <h1 tabIndex={-1}>{t("onboarding.routeTitle")}</h1>
      <p>{t("onboarding.routeDescription")}</p>
    </header>
    <div className={styles.scenarioGrid} role="radiogroup" aria-label={t("onboarding.roleLabel")}>
      {roles.map(({ id, title, description, icon: Icon }) => <Card key={id} className={styles.scenarioCard} data-selected={scenario === id || undefined}><div className={styles.scenarioCardTop}><span className={styles.scenarioIcon}><Icon aria-hidden="true" /></span>{scenario === id ? <Check aria-hidden="true" /> : null}</div><div className={styles.scenarioCardCopy}><h2>{t(title)}</h2><p>{t(description)}</p></div><Button type="button" variant={scenario === id ? "default" : "outline"} aria-pressed={scenario === id} onClick={() => onScenarioChange(id)}>{t(scenario === id ? "common.selected" : "common.select")}</Button></Card>)}
    </div>
    <div className={styles.marketGrid}>
      <Card className={styles.marketPanel}><div className={styles.marketPanelHeading}><MapPin aria-hidden="true" /><div><h2>{t("onboarding.country")}</h2><p>{t("onboarding.countryDescription")}</p></div></div><fieldset className={styles.marketOptions}><legend className={styles.srOnly}>{t("onboarding.country")}</legend>{countries.map((item) => <label key={item.id} className={styles.marketOption} data-selected={country === item.id || undefined}><input type="radio" name="country" checked={country === item.id} onChange={() => onCountryChange(item.id)} /><span className={styles.optionCheck}>{country === item.id ? <Check /> : null}</span><span><strong>{t(item.title)}</strong></span></label>)}</fieldset></Card>
    </div>
    <div className={styles.stepActions}><Button type="button" size="lg" disabled={!ready || pending} onClick={() => void onContinue()}>{pending ? t("common.saving") : t("onboarding.continueRegistration")}<ArrowRight aria-hidden="true" /></Button></div>
  </div>;
}
