"use client";

import { ArrowRight, Check, CircleUserRound, Handshake, Languages, MapPin } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccessCountry, AccessLanguage, AccessScenario } from "@/lib/access-types";

const roles = [
  { id: "player" as const, title: "Игрок", description: "Задания, прогресс и награды в личном маршруте.", icon: CircleUserRound },
  { id: "partner" as const, title: "Партнёр", description: "Материалы и сценарии сотрудничества с VX House.", icon: Handshake },
];
const countries = [{ id: "turkey" as const, title: "Турция" }, { id: "azerbaijan" as const, title: "Азербайджан" }];
const languages = [{ id: "ru" as const, title: "Русский" }, { id: "tr" as const, title: "Türkçe" }, { id: "az" as const, title: "Azərbaycan dili" }];

export function AccessOnboardingWelcomeStep({
  scenario,
  country,
  language,
  pending,
  onScenarioChange,
  onCountryChange,
  onLanguageChange,
  onContinue,
}: {
  scenario: AccessScenario | null;
  country: AccessCountry | null;
  language: AccessLanguage | null;
  pending: boolean;
  onScenarioChange: (value: AccessScenario) => void;
  onCountryChange: (value: AccessCountry) => void;
  onLanguageChange: (value: AccessLanguage) => void;
  onContinue: () => Promise<void>;
}) {
  const ready = Boolean(scenario && country && language);
  return <div className={styles.marketContent}>
    <header className={styles.stepHeading}>
      <span className={styles.scenarioEyebrow}>Добро пожаловать в VX House</span>
      <h1 tabIndex={-1}>Настроим ваш маршрут</h1>
      <p>VX House — частная платформа лояльности: вы выполняете последовательные задания, открываете преимущества и всегда можете написать своему менеджеру.</p>
    </header>
    <div className={styles.scenarioGrid} role="radiogroup" aria-label="Роль в VX House">
      {roles.map(({ id, title, description, icon: Icon }) => <Card key={id} className={styles.scenarioCard} data-selected={scenario === id || undefined}><div className={styles.scenarioCardTop}><span className={styles.scenarioIcon}><Icon aria-hidden="true" /></span>{scenario === id ? <Check aria-hidden="true" /> : null}</div><div className={styles.scenarioCardCopy}><h2>{title}</h2><p>{description}</p></div><Button type="button" variant={scenario === id ? "default" : "outline"} aria-pressed={scenario === id} onClick={() => onScenarioChange(id)}>{scenario === id ? "Выбрано" : "Выбрать"}</Button></Card>)}
    </div>
    <div className={styles.marketGrid}>
      <Card className={styles.marketPanel}><div className={styles.marketPanelHeading}><MapPin aria-hidden="true" /><div><h2>Страна</h2><p>Определяет доступные условия.</p></div></div><fieldset className={styles.marketOptions}><legend className={styles.srOnly}>Страна</legend>{countries.map((item) => <label key={item.id} className={styles.marketOption} data-selected={country === item.id || undefined}><input type="radio" name="country" checked={country === item.id} onChange={() => onCountryChange(item.id)} /><span className={styles.optionCheck}>{country === item.id ? <Check /> : null}</span><span><strong>{item.title}</strong></span></label>)}</fieldset></Card>
      <Card className={styles.marketPanel}><div className={styles.marketPanelHeading}><Languages aria-hidden="true" /><div><h2>Язык</h2><p>Сохраним ваше предпочтение.</p></div></div><fieldset className={styles.marketOptions}><legend className={styles.srOnly}>Язык</legend>{languages.map((item) => <label key={item.id} className={styles.marketOption} data-selected={language === item.id || undefined}><input type="radio" name="language" checked={language === item.id} onChange={() => onLanguageChange(item.id)} /><span className={styles.optionCheck}>{language === item.id ? <Check /> : null}</span><span><strong>{item.title}</strong></span></label>)}</fieldset></Card>
    </div>
    <div className={styles.stepActions}><Button type="button" size="lg" disabled={!ready || pending} onClick={() => void onContinue()}>{pending ? "Сохраняем…" : "Продолжить"}<ArrowRight aria-hidden="true" /></Button></div>
  </div>;
}
