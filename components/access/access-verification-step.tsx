"use client";

import { ArrowLeft, ArrowRight, KeyRound, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AccessVerificationStep({ email, code, developmentCode, pending, error, onCodeChange, onVerify, onResend, onLogout }: {
  email: string;
  code: string;
  developmentCode?: string | null;
  pending: boolean;
  error?: string | null;
  onCodeChange: (value: string) => void;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function handleResend() {
    await onResend();
    setResendIn(30);
  }

  return <div className={styles.consentContent}>
    <header className={styles.stepHeading}>
      <span className={styles.scenarioEyebrow}>Подтверждение контакта</span>
      <h1 tabIndex={-1}>Введите код из письма</h1>
      <p>Мы отправили одноразовый шестизначный код на {email}. Код ограничен по времени и сработает только один раз.</p>
    </header>
    <Card className={styles.profileFields}>
      <div className={styles.fieldGroup}>
        <label htmlFor="verification-code">Код подтверждения</label>
        <div className={styles.inputWrap}><KeyRound aria-hidden="true" /><Input id="verification-code" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} placeholder="000000" onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
      </div>
      {developmentCode ? <p className={styles.localOnlyNote} role="note"><KeyRound aria-hidden="true" /><span><strong>Код среды разработки:</strong> {developmentCode}</span></p> : null}
      {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
    </Card>
    <div className={styles.stepActions}>
      <Button type="button" size="lg" disabled={pending || code.length !== 6} onClick={() => void onVerify()}>{pending ? "Проверяем…" : "Подтвердить"}<ArrowRight aria-hidden="true" /></Button>
      <button type="button" className={styles.stepBackButton} disabled={pending || resendIn > 0} onClick={() => void handleResend()}>
        <RefreshCw aria-hidden="true" />
        {resendIn > 0 ? `Новый код через 0:${String(resendIn).padStart(2, "0")}` : "Отправить новый код"}
      </button>
      <button type="button" className={styles.stepBackButton} disabled={pending} onClick={() => void onLogout()}><ArrowLeft aria-hidden="true" />Начать с другого адреса</button>
    </div>
  </div>;
}
