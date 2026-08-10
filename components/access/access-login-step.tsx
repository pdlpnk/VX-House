"use client";

import { ArrowLeft, ArrowRight, AtSign, KeyRound } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AccessLoginStep({ email, password, pending, error, onEmailChange, onPasswordChange, onSubmit, onBack, onForgotPassword }: {
  email: string;
  password: string;
  pending: boolean;
  error?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  onForgotPassword: () => void;
}) {
  const { t } = useI18n();
  return <div className={styles.consentContent}>
    <header className={styles.stepHeading}><span className={styles.scenarioEyebrow}>{t("login.eyebrow")}</span><h1 tabIndex={-1}>{t("login.title")}</h1><p>{t("login.description")}</p></header>
    <Card className={styles.profileFields}>
      <div className={styles.fieldGroup}><label htmlFor="login-email">{t("registration.email")}</label><div className={styles.inputWrap}><AtSign aria-hidden="true" /><Input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} /></div></div>
      <div className={styles.fieldGroup}><label htmlFor="login-password">{t("registration.password")}</label><div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} /></div></div>
      <button type="button" className={styles.stepBackButton} onClick={onForgotPassword}>{t("passwordReset.forgot")}</button>
      {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
    </Card>
    <div className={styles.stepActions}><Button type="button" size="lg" disabled={pending || !email || !password} onClick={() => void onSubmit()}>{pending ? t("login.pending") : t("login.submit")}<ArrowRight aria-hidden="true" /></Button><button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />{t("common.back")}</button></div>
  </div>;
}
