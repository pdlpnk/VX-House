"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, AtSign, CircleUserRound, FileClock, KeyRound } from "lucide-react";
import { useState } from "react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AccessCountry, AccessLanguage } from "@/lib/access-types";

type AccessProfileStepProps = {
  scenario: AccessScenario;
  country: AccessCountry;
  language: AccessLanguage;
  name: string;
  email: string;
  password: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onContinue: () => Promise<void>;
  onBack: () => void;
  reducedMotion: boolean;
  pending?: boolean;
  error?: string | null;
};

const roleLabels: Record<AccessScenario, string> = { player: "Игрок", partner: "Партнёр" };
const countryLabels: Record<AccessCountry, string> = { turkey: "Турция", azerbaijan: "Азербайджан" };
const languageLabels: Record<AccessLanguage, string> = { ru: "Русский", tr: "Türkçe", az: "Azərbaycan dili" };

export function AccessProfileStep({
  scenario,
  country,
  language,
  name,
  email,
  password,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onContinue,
  onBack,
  reducedMotion,
  pending = false,
  error,
}: AccessProfileStepProps) {
  const [attempted, setAttempted] = useState(false);
  const nameValid = name.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = new TextEncoder().encode(password).length >= 12 && password.length <= 128;

  function handleContinue() {
    setAttempted(true);
    if (nameValid && emailValid && passwordValid) void onContinue();
  }

  return (
    <div className={styles.profileContent}>
      <div className={styles.profileIntro}>
        <span className={styles.scenarioEyebrow}>Контакт для будущего доступа</span>
        <h1 tabIndex={-1}>Как с вами связаться</h1>
        <p>
          Укажите имя, электронную почту и пароль. Мы создадим защищённый
          профиль, а затем попросим подтвердить контакт.
        </p>

        <Card className={styles.profileFields}>
          <div className={styles.fieldGroup}>
            <label htmlFor="access-name">Имя</label>
            <div className={styles.inputWrap}>
              <CircleUserRound aria-hidden="true" />
              <Input
                id="access-name"
                name="name"
                type="text"
                value={name}
                autoComplete="name"
                placeholder="Как к вам обращаться"
                aria-invalid={attempted && !nameValid}
                aria-describedby={attempted && !nameValid ? "access-name-error" : undefined}
                onChange={(event) => onNameChange(event.target.value)}
              />
            </div>
            {attempted && !nameValid ? <small id="access-name-error" className={styles.fieldError}>Введите не менее двух символов.</small> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="access-email">Электронная почта</label>
            <div className={styles.inputWrap}>
              <AtSign aria-hidden="true" />
              <Input
                id="access-email"
                name="email"
                type="email"
                value={email}
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.com"
                aria-invalid={attempted && !emailValid}
                aria-describedby={attempted && !emailValid ? "access-email-error" : undefined}
                onChange={(event) => onEmailChange(event.target.value)}
              />
            </div>
            {attempted && !emailValid ? <small id="access-email-error" className={styles.fieldError}>Проверьте формат электронной почты.</small> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="access-password">Пароль</label>
            <div className={styles.inputWrap}>
              <KeyRound aria-hidden="true" />
              <Input id="access-password" name="password" type="password" value={password} autoComplete="new-password" placeholder="Не менее 12 символов" aria-invalid={attempted && !passwordValid} aria-describedby="access-password-help" onChange={(event) => onPasswordChange(event.target.value)} />
            </div>
            <small id="access-password-help" className={attempted && !passwordValid ? styles.fieldError : undefined}>От 12 до 128 символов.</small>
          </div>
          {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
        </Card>

        <div className={styles.profileActions}>
          <Button type="button" size="lg" disabled={pending} onClick={handleContinue}>{pending ? "Создаём профиль…" : "Создать профиль"} <ArrowRight aria-hidden="true" /></Button>
          <button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />Назад</button>
        </div>
      </div>

      <motion.div
        className={styles.requestPreviewWrap}
        initial={reducedMotion ? false : { opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={styles.requestPreview} aria-label="Сводка выбранного сценария">
          <div className={styles.requestPreviewHeading}><FileClock aria-hidden="true" /><div><span>Подготовка</span><h2>Данные будущего профиля</h2></div></div>
          <dl>
            <div><dt>Роль</dt><dd>{roleLabels[scenario]}</dd></div>
            <div><dt>Страна</dt><dd>{countryLabels[country]}</dd></div>
            <div><dt>Язык</dt><dd>{languageLabels[language]}</dd></div>
            <div><dt>Контакт</dt><dd>{emailValid ? email.trim() : "Ожидает проверки"}</dd></div>
          </dl>
          <p>После создания профиля потребуется одноразовый код из письма. Пароль никогда не отображается и не сохраняется в черновике.</p>
        </Card>
      </motion.div>
    </div>
  );
}
