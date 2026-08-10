"use client";

import { ArrowLeft, ArrowRight, AtSign, KeyRound, ShieldCheck } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type PasswordResetStage = "email" | "code" | "password" | "success";

export function AccessPasswordResetStep(props: {
  stage: PasswordResetStage;
  email: string;
  code: string;
  password: string;
  confirmation: string;
  pending: boolean;
  cooldown: number;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onRequest: () => Promise<void>;
  onVerify: () => Promise<void>;
  onComplete: () => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  onLogin: () => void;
}) {
  const { t } = useI18n();
  const title = props.stage === "email" ? t("passwordReset.requestTitle") : props.stage === "code" ? t("passwordReset.codeTitle") : props.stage === "password" ? t("passwordReset.passwordTitle") : t("passwordReset.successTitle");
  const description = props.stage === "email" ? t("passwordReset.requestDescription") : props.stage === "code" ? t("passwordReset.neutral") : props.stage === "password" ? t("passwordReset.passwordDescription") : t("passwordReset.successDescription");
  const passwordsMatch = props.password.length >= 8 && props.password === props.confirmation;

  return <div className={styles.consentContent}>
    <header className={styles.stepHeading}><span className={styles.scenarioEyebrow}>{t("passwordReset.eyebrow")}</span><h1 tabIndex={-1}>{title}</h1><p>{description}</p></header>
    {props.stage !== "success" ? <Card className={styles.profileFields}>
      {props.stage === "email" ? <div className={styles.fieldGroup}><label htmlFor="reset-email">{t("registration.email")}</label><div className={styles.inputWrap}><AtSign aria-hidden="true" /><Input id="reset-email" type="email" autoComplete="email" value={props.email} onChange={(event) => props.onEmailChange(event.target.value)} /></div></div> : null}
      {props.stage === "code" ? <><div className={styles.fieldGroup}><label htmlFor="reset-code">{t("passwordReset.code")}</label><div className={styles.inputWrap}><ShieldCheck aria-hidden="true" /><Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={props.code} onChange={(event) => props.onCodeChange(event.target.value.replace(/\D/gu, "").slice(0, 6))} /></div></div><button type="button" className={styles.stepBackButton} disabled={props.pending || props.cooldown > 0} onClick={() => void props.onResend()}>{props.cooldown > 0 ? t("passwordReset.resendIn", { seconds: props.cooldown }) : t("passwordReset.resend")}</button></> : null}
      {props.stage === "password" ? <><div className={styles.fieldGroup}><label htmlFor="reset-password">{t("passwordReset.newPassword")}</label><div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="reset-password" type="password" autoComplete="new-password" value={props.password} onChange={(event) => props.onPasswordChange(event.target.value)} /></div></div><div className={styles.fieldGroup}><label htmlFor="reset-confirmation">{t("passwordReset.confirmPassword")}</label><div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="reset-confirmation" type="password" autoComplete="new-password" value={props.confirmation} onChange={(event) => props.onConfirmationChange(event.target.value)} /></div></div>{props.confirmation && !passwordsMatch ? <p className={styles.fieldError}>{t("passwordReset.passwordMismatch")}</p> : null}</> : null}
    </Card> : null}
    <div className={styles.stepActions}>
      {props.stage === "email" ? <Button size="lg" disabled={props.pending || !props.email} onClick={() => void props.onRequest()}>{t("passwordReset.continue")}<ArrowRight aria-hidden="true" /></Button> : null}
      {props.stage === "code" ? <Button size="lg" disabled={props.pending || props.code.length !== 6} onClick={() => void props.onVerify()}>{t("passwordReset.verify")}<ArrowRight aria-hidden="true" /></Button> : null}
      {props.stage === "password" ? <Button size="lg" disabled={props.pending || !passwordsMatch} onClick={() => void props.onComplete()}>{t("passwordReset.change")}<ArrowRight aria-hidden="true" /></Button> : null}
      {props.stage === "success" ? <Button size="lg" onClick={props.onLogin}>{t("passwordReset.backToLogin")}<ArrowRight aria-hidden="true" /></Button> : null}
      {props.stage !== "success" ? <button type="button" className={styles.stepBackButton} onClick={props.onBack}><ArrowLeft aria-hidden="true" />{t("common.back")}</button> : null}
    </div>
  </div>;
}
