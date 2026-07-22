"use client";

import { ArrowLeft, ArrowRight, AtSign, KeyRound } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AccessLoginStep({ email, password, pending, error, onEmailChange, onPasswordChange, onSubmit, onBack }: {
  email: string;
  password: string;
  pending: boolean;
  error?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
}) {
  return <div className={styles.consentContent}>
    <header className={styles.stepHeading}><span className={styles.scenarioEyebrow}>Возвращение в VX House</span><h1 tabIndex={-1}>Войти в пространство</h1><p>Используйте электронную почту и пароль, указанные при создании профиля.</p></header>
    <Card className={styles.profileFields}>
      <div className={styles.fieldGroup}><label htmlFor="login-email">Электронная почта</label><div className={styles.inputWrap}><AtSign aria-hidden="true" /><Input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} /></div></div>
      <div className={styles.fieldGroup}><label htmlFor="login-password">Пароль</label><div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} /></div></div>
      {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
    </Card>
    <div className={styles.stepActions}><Button type="button" size="lg" disabled={pending || !email || !password} onClick={() => void onSubmit()}>{pending ? "Входим…" : "Войти"}<ArrowRight aria-hidden="true" /></Button><button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />Назад</button></div>
  </div>;
}
