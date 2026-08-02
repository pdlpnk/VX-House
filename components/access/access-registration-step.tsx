"use client";

import { ArrowRight, AtSign, CircleUserRound, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AccessRegistrationStep({
  name,
  email,
  password,
  pending,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onLogin,
}: {
  name: string;
  email: string;
  password: string;
  pending: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onLogin: () => void;
}) {
  const [attempted, setAttempted] = useState(false);
  const { t } = useI18n();
  const nameValid = name.trim().length >= 2 && name.trim().length <= 80;
  const emailValid = email.trim().length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordLength = Array.from(password).length;
  const passwordValid = passwordLength >= 8 && passwordLength <= 128 && new TextEncoder().encode(password).length <= 1024;
  const canSubmit = nameValid && emailValid && passwordValid;

  return <div className={styles.profileContent}>
    <div className={styles.profileIntro}>
      <span className={styles.scenarioEyebrow}>{t("registration.eyebrow")}</span>
      <h1 tabIndex={-1}>{t("registration.title")}</h1>
      <p>{t("registration.description")}</p>
      <Card className={styles.profileFields}>
        <div className={styles.fieldGroup}>
          <label htmlFor="registration-name">{t("registration.name")}</label>
          <div className={styles.inputWrap}><CircleUserRound aria-hidden="true" /><Input id="registration-name" autoComplete="name" value={name} placeholder={t("registration.namePlaceholder")} aria-invalid={attempted && !nameValid} onChange={(event) => onNameChange(event.target.value)} /></div>
          {attempted && !nameValid ? <small className={styles.fieldError}>{t("registration.nameError")}</small> : null}
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="registration-email">{t("registration.email")}</label>
          <div className={styles.inputWrap}><AtSign aria-hidden="true" /><Input id="registration-email" type="email" inputMode="email" autoComplete="email" value={email} placeholder="name@example.com" aria-invalid={attempted && !emailValid} onChange={(event) => onEmailChange(event.target.value)} /></div>
          {attempted && !emailValid ? <small className={styles.fieldError}>{t("registration.emailError")}</small> : null}
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="registration-password">{t("registration.password")}</label>
          <div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="registration-password" type="password" autoComplete="new-password" value={password} placeholder={t("registration.passwordPlaceholder")} aria-invalid={attempted && !passwordValid} onChange={(event) => onPasswordChange(event.target.value)} /></div>
          <small className={attempted && !passwordValid ? styles.fieldError : undefined}>{t("registration.passwordHint")}</small>
        </div>
      </Card>
      <div className={styles.profileActions}>
        <Button type="button" size="lg" disabled={pending} onClick={() => { setAttempted(true); if (canSubmit) void onSubmit(); }}>{pending ? t("registration.creating") : t("common.continue")}<ArrowRight aria-hidden="true" /></Button>
        <button type="button" className={styles.stepBackButton} onClick={onLogin}>{t("registration.existing")}</button>
      </div>
    </div>
    <Card className={styles.requestPreview} aria-label={t("registration.simplePath")}>
      <div className={styles.requestPreviewHeading}><ShieldCheck aria-hidden="true" /><div><span>{t("registration.minutes")}</span><h2>{t("registration.simplePath")}</h2></div></div>
      <dl>
        <div><dt>1</dt><dd>{t("registration.previewEmail")}</dd></div>
        <div><dt>2</dt><dd>{t("registration.previewExplore")}</dd></div>
        <div><dt>3</dt><dd>{t("registration.previewTasks")}</dd></div>
      </dl>
      <p>{t("registration.expiration")}</p>
    </Card>
  </div>;
}
