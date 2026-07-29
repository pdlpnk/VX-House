"use client";

import { ArrowRight, AtSign, CircleUserRound, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const nameValid = name.trim().length >= 2 && name.trim().length <= 80;
  const emailValid = email.trim().length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = new TextEncoder().encode(password).length >= 12 && password.length <= 128;
  const canSubmit = nameValid && emailValid && passwordValid;

  return <div className={styles.profileContent}>
    <div className={styles.profileIntro}>
      <span className={styles.scenarioEyebrow}>Частный доступ VX House</span>
      <h1 tabIndex={-1}>Создайте профиль</h1>
      <p>Только имя, электронная почта и пароль. После подтверждения адреса мы коротко познакомим вас с платформой.</p>
      <Card className={styles.profileFields}>
        <div className={styles.fieldGroup}>
          <label htmlFor="registration-name">Имя</label>
          <div className={styles.inputWrap}><CircleUserRound aria-hidden="true" /><Input id="registration-name" autoComplete="name" value={name} placeholder="Как к вам обращаться" aria-invalid={attempted && !nameValid} onChange={(event) => onNameChange(event.target.value)} /></div>
          {attempted && !nameValid ? <small className={styles.fieldError}>Введите от 2 до 80 символов.</small> : null}
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="registration-email">Электронная почта</label>
          <div className={styles.inputWrap}><AtSign aria-hidden="true" /><Input id="registration-email" type="email" inputMode="email" autoComplete="email" value={email} placeholder="name@example.com" aria-invalid={attempted && !emailValid} onChange={(event) => onEmailChange(event.target.value)} /></div>
          {attempted && !emailValid ? <small className={styles.fieldError}>Проверьте адрес электронной почты.</small> : null}
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="registration-password">Пароль</label>
          <div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="registration-password" type="password" autoComplete="new-password" value={password} placeholder="Не менее 12 символов" aria-invalid={attempted && !passwordValid} onChange={(event) => onPasswordChange(event.target.value)} /></div>
          <small className={attempted && !passwordValid ? styles.fieldError : undefined}>Используйте от 12 до 128 символов.</small>
        </div>
      </Card>
      <div className={styles.profileActions}>
        <Button type="button" size="lg" disabled={pending} onClick={() => { setAttempted(true); if (canSubmit) void onSubmit(); }}>{pending ? "Создаём профиль…" : "Продолжить"}<ArrowRight aria-hidden="true" /></Button>
        <button type="button" className={styles.stepBackButton} onClick={onLogin}>У меня уже есть профиль</button>
      </div>
    </div>
    <Card className={styles.requestPreview} aria-label="Как проходит получение доступа">
      <div className={styles.requestPreviewHeading}><ShieldCheck aria-hidden="true" /><div><span>Несколько минут</span><h2>Понятный путь без анкеты</h2></div></div>
      <dl>
        <div><dt>1</dt><dd>Подтвердите почту</dd></div>
        <div><dt>2</dt><dd>Познакомьтесь с VX House</dd></div>
        <div><dt>3</dt><dd>Перейдите к заданиям</dd></div>
      </dl>
      <p>Неподтверждённый профиль автоматически удаляется через 12 часов.</p>
    </Card>
  </div>;
}
