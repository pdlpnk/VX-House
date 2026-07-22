"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertTriangle, FileClock, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "@/app/access/access.module.css";
import { AccessBenefitsStep } from "@/components/access/access-benefits-step";
import { AccessCompleteStep } from "@/components/access/access-complete-step";
import { AccessConsentStep } from "@/components/access/access-consent-step";
import { AccessLoginStep } from "@/components/access/access-login-step";
import { AccessMarketStep } from "@/components/access/access-market-step";
import { AccessProfileStep } from "@/components/access/access-profile-step";
import { AccessProgress } from "@/components/access/access-progress";
import { AccessScenarioStep } from "@/components/access/access-scenario-step";
import { AccessVerificationStep } from "@/components/access/access-verification-step";
import { AccessWelcomeStep } from "@/components/access/access-welcome-step";
import { Container } from "@/components/container";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { AccessCountry, AccessLanguage, AccessScenario } from "@/lib/access-types";

const TOTAL_STEPS = 8;
const stepVariants: Variants = { enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }), center: { opacity: 1, x: 0 }, exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -20 : 20 }) };
type Consent = { id: string; title: string; version: number; accepted: boolean };
type Snapshot = { status: string; profile: { productRole: "PLAYER" | "PARTNER"; user: { email: string; displayName: string }; market: { code: "TR" | "AZ" }; preferredLanguage: "RU" | "TR" | "AZ" }; requiredConsents: Consent[]; redirectTo: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin", headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) throw new Error(body.message ?? "Не удалось выполнить запрос. Повторите попытку.");
  return body;
}

export function AccessFlow() {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState<"onboarding" | "login">("onboarding");
  const [scenario, setScenario] = useState<AccessScenario | null>(null);
  const [country, setCountry] = useState<AccessCountry | null>(null);
  const [language, setLanguage] = useState<AccessLanguage | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [isAdult, setIsAdult] = useState(false);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [selectedConsentIds, setSelectedConsentIds] = useState<string[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [destination, setDestination] = useState<"/dashboard" | "/partner">("/dashboard");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  function go(next: number) { setDirection(next >= step ? 1 : -1); setStep(Math.min(Math.max(next, 1), TOTAL_STEPS)); setMessage(null); }
  function applySnapshot(snapshot: Snapshot) {
    setAuthenticated(true); setName(snapshot.profile.user.displayName); setEmail(snapshot.profile.user.email);
    setScenario(snapshot.profile.productRole === "PLAYER" ? "player" : "partner");
    setCountry(snapshot.profile.market.code === "TR" ? "turkey" : "azerbaijan");
    setLanguage(snapshot.profile.preferredLanguage.toLowerCase() as AccessLanguage);
    setConsents(snapshot.requiredConsents); setSelectedConsentIds(snapshot.requiredConsents.filter((item) => item.accepted).map((item) => item.id));
    setDestination(snapshot.profile.productRole === "PLAYER" ? "/dashboard" : "/partner");
    if (["COMPLETED", "PARTNER_APPROVAL_PENDING"].includes(snapshot.status)) go(8);
    else if (["CONTACT_VERIFIED", "CONSENTS_PENDING", "PROFILE_READY"].includes(snapshot.status)) go(7);
    else go(6);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
        if (response.ok) { const snapshot = await response.json() as Snapshot; if (active) applySnapshot(snapshot); }
        else if (active && new URL(window.location.href).searchParams.get("mode") === "login") setMode("login");
      } catch { if (active) setMessage("Не удалось проверить текущий сеанс. Можно начать снова."); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
    // Session restoration intentionally runs once; subsequent transitions are local or API-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (ready) panelRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }); }, [mode, ready, step]);

  useEffect(() => {
    if (!ready || !authenticated || step !== 6) return;
    let active = true;
    void api<{ code: string }>("/api/auth/email/development-code")
      .then((result) => { if (active) setDevelopmentCode(result.code); })
      .catch(() => { if (active) setDevelopmentCode(null); });
    return () => { active = false; };
  }, [authenticated, ready, step]);

  function resetLocal() { setScenario(null); setCountry(null); setLanguage(null); setName(""); setEmail(""); setPassword(""); setCode(""); setConsents([]); setSelectedConsentIds([]); setAuthenticated(false); setMode("onboarding"); go(1); }
  async function register() {
    setPending(true); setMessage(null);
    try {
      const result = await api<{ deliveryAvailable: boolean }>("/api/auth/register", { method: "POST", body: JSON.stringify({ displayName: name, email, password, productRole: scenario === "partner" ? "PARTNER" : "PLAYER", marketCode: country === "azerbaijan" ? "AZ" : "TR", preferredLanguage: language?.toUpperCase(), idempotencyKey: crypto.randomUUID() }) });
      setAuthenticated(true); go(6); await loadDevelopmentCode();
      if (!result.deliveryAvailable) setMessage("Письмо пока не отправлено. Повторите отправку после подключения почтового сервиса.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось создать профиль."); } finally { setPending(false); }
  }
  async function loadDevelopmentCode() { try { const result = await api<{ code: string }>("/api/auth/email/development-code"); setDevelopmentCode(result.code); } catch { setDevelopmentCode(null); } }
  async function verify() { setPending(true); setMessage(null); try { await api("/api/auth/email/verify", { method: "POST", body: JSON.stringify({ code }) }); const snapshot = await api<Snapshot>("/api/onboarding"); applySnapshot(snapshot); } catch (error) { setMessage(error instanceof Error ? error.message : "Код не подтверждён."); } finally { setPending(false); } }
  async function resend() { setPending(true); setMessage(null); try { await api("/api/auth/email/request", { method: "POST", body: "{}" }); setCode(""); await loadDevelopmentCode(); } catch (error) { setMessage(error instanceof Error ? error.message : "Новый код пока недоступен."); } finally { setPending(false); } }
  async function logout() { setPending(true); try { await api("/api/auth/logout", { method: "POST", body: "{}" }); resetLocal(); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось завершить сеанс."); } finally { setPending(false); } }
  async function login() { setPending(true); setMessage(null); try { const result = await api<{ redirectTo: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); if (result.redirectTo === "/dashboard" || result.redirectTo === "/partner") window.location.assign(result.redirectTo); else { const snapshot = await api<Snapshot>("/api/onboarding"); setMode("onboarding"); applySnapshot(snapshot); } } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось войти."); } finally { setPending(false); } }
  async function complete() { setPending(true); setMessage(null); try { const result = await api<{ redirectTo: "/dashboard" | "/partner" }>("/api/onboarding/complete", { method: "POST", body: JSON.stringify({ ageConfirmed: isAdult, consentVersionIds: selectedConsentIds, idempotencyKey: crypto.randomUUID() }) }); setDestination(result.redirectTo); go(8); } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось завершить настройку."); } finally { setPending(false); } }

  return <main id="main-content" className={styles.page}><div className={styles.background} aria-hidden="true"><div className={styles.grid}/><div className={styles.glow}/><div className={styles.portal}/><div className={styles.vignette}/></div><div className={styles.shell}>
    <Container as="header" className={styles.header}><Link href="/" className={styles.logoLink} aria-label="VX House — главная"><span className={styles.logo} aria-hidden="true"><Image src="/vx-house-logo.jpg" alt="" width={232} height={232} priority unoptimized /></span></Link><div className={styles.ageMark}><span>18+</span><p>Только для совершеннолетних</p></div></Container>
    <Container className={styles.main}><div className={styles.flow}>{!ready ? <div className={styles.draftLoading} role="status"><FileClock aria-hidden="true"/><div><h1 tabIndex={-1}>Проверяем безопасный сеанс</h1><p>Это займёт один момент.</p></div></div> : <>
      {mode === "onboarding" ? <div className={styles.progressRow}><AccessProgress currentStep={step}/>{step > 1 && step < 5 && !authenticated ? <button type="button" className={styles.resetButton} onClick={resetLocal}><RotateCcw aria-hidden="true"/>Начать заново</button> : null}</div> : null}
      {message ? <div className={styles.draftNotice} data-error role="alert"><AlertTriangle aria-hidden="true"/><p>{message}</p><button type="button" onClick={() => setMessage(null)} aria-label="Скрыть сообщение">Закрыть</button></div> : null}
      <AnimatePresence mode="wait" initial={false} custom={direction}><motion.section key={`${mode}-${step}`} ref={panelRef} className={styles.stepPanel} custom={direction} variants={reducedMotion ? undefined : stepVariants} initial={reducedMotion ? false : "enter"} animate="center" exit={reducedMotion ? undefined : "exit"} transition={{ duration: .38, ease: [0.22,1,.36,1] }}>
        {mode === "login" ? <AccessLoginStep email={email} password={password} pending={pending} error={message} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={login} onBack={() => { setMode("onboarding"); setMessage(null); }} />
        : step === 1 ? <AccessWelcomeStep onStart={() => go(2)} onLogin={() => setMode("login")} reducedMotion={reducedMotion}/>
        : step === 2 ? <AccessScenarioStep selectedScenario={scenario} onSelect={setScenario} onContinue={() => scenario && go(3)} onBack={() => go(1)} reducedMotion={reducedMotion}/>
        : step === 3 ? <AccessBenefitsStep scenario={scenario ?? "player"} onContinue={() => go(4)} onBack={() => go(2)} reducedMotion={reducedMotion}/>
        : step === 4 ? <AccessMarketStep country={country} language={language} onCountryChange={setCountry} onLanguageChange={setLanguage} onContinue={() => country && language && go(5)} onBack={() => go(3)} reducedMotion={reducedMotion}/>
        : step === 5 ? <AccessProfileStep scenario={scenario ?? "player"} country={country ?? "turkey"} language={language ?? "ru"} name={name} email={email} password={password} onNameChange={setName} onEmailChange={setEmail} onPasswordChange={setPassword} onContinue={register} onBack={() => go(4)} pending={pending} error={message} reducedMotion={reducedMotion}/>
        : step === 6 ? <AccessVerificationStep email={email} code={code} developmentCode={developmentCode} pending={pending} error={message} onCodeChange={setCode} onVerify={verify} onResend={resend} onLogout={logout}/>
        : step === 7 ? <AccessConsentStep scenario={scenario ?? "player"} country={country ?? "turkey"} isAdult={isAdult} consents={consents} selectedConsentIds={selectedConsentIds} onAdultChange={setIsAdult} onConsentChange={(id, value) => setSelectedConsentIds((current) => value ? [...new Set([...current, id])] : current.filter((item) => item !== id))} onContinue={complete} onBack={() => go(6)} pending={pending} error={message} reducedMotion={reducedMotion}/>
        : <AccessCompleteStep scenario={scenario ?? "player"} country={country ?? "turkey"} language={language ?? "ru"} name={name} destination={destination} partnerApprovalPending={scenario === "partner"} onRestart={() => void logout()} reducedMotion={reducedMotion}/>}</motion.section></AnimatePresence>
    </>}</div></Container></div></main>;
}
