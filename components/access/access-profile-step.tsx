"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, AtSign, CircleUserRound, FileClock, Info } from "lucide-react";
import { useState } from "react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AccessCountry, AccessLanguage } from "@/lib/access-draft";

type AccessProfileStepProps = {
  scenario: AccessScenario;
  country: AccessCountry;
  language: AccessLanguage;
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  reducedMotion: boolean;
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
  onNameChange,
  onEmailChange,
  onContinue,
  onBack,
  reducedMotion,
}: AccessProfileStepProps) {
  const [attempted, setAttempted] = useState(false);
  const nameValid = name.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function handleContinue() {
    setAttempted(true);
    if (nameValid && emailValid) onContinue();
  }

  return (
    <div className={styles.profileContent}>
      <div className={styles.profileIntro}>
        <span className={styles.scenarioEyebrow}>Контакт для будущего доступа</span>
        <h1 tabIndex={-1}>Как с вами связаться</h1>
        <p>
          Укажите имя и электронную почту. Сейчас данные остаются только в
          открытой вкладке и не отправляются на сервер.
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
                aria-describedby={attempted && !emailValid ? "access-email-error access-storage-note" : "access-storage-note"}
                onChange={(event) => onEmailChange(event.target.value)}
              />
            </div>
            {attempted && !emailValid ? <small id="access-email-error" className={styles.fieldError}>Проверьте формат электронной почты.</small> : null}
          </div>

          <div id="access-storage-note" className={styles.localOnlyNote}>
            <Info aria-hidden="true" />
            <span><strong>Контакт не сохраняется в черновике.</strong> После обновления страницы его потребуется ввести снова.</span>
          </div>
        </Card>

        <div className={styles.profileActions}>
          <Button type="button" size="lg" onClick={handleContinue}>Проверить данные <ArrowRight aria-hidden="true" /></Button>
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
          <div className={styles.requestPreviewHeading}><FileClock aria-hidden="true" /><div><span>Черновик</span><h2>Запрос ещё не отправлен</h2></div></div>
          <dl>
            <div><dt>Роль</dt><dd>{roleLabels[scenario]}</dd></div>
            <div><dt>Страна</dt><dd>{countryLabels[country]}</dd></div>
            <div><dt>Язык</dt><dd>{languageLabels[language]}</dd></div>
            <div><dt>Контакт</dt><dd>{emailValid ? email.trim() : "Ожидает проверки"}</dd></div>
          </dl>
          <p>Авторизация, подтверждение электронной почты и создание профиля будут подключены отдельно.</p>
        </Card>
      </motion.div>
    </div>
  );
}

