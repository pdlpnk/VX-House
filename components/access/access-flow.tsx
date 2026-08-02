"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertTriangle, FileClock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "@/app/access/access.module.css";
import { AccessCompleteStep } from "@/components/access/access-complete-step";
import { AccessConsentStep } from "@/components/access/access-consent-step";
import { AccessLoginStep } from "@/components/access/access-login-step";
import { AccessOnboardingStoryStep } from "@/components/access/access-onboarding-story-step";
import { AccessOnboardingWelcomeStep } from "@/components/access/access-onboarding-welcome-step";
import { AccessProgress } from "@/components/access/access-progress";
import { AccessRegistrationStep } from "@/components/access/access-registration-step";
import { AccessVerificationStep } from "@/components/access/access-verification-step";
import { Container } from "@/components/container";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { AccessCountry, AccessScenario } from "@/lib/access-types";
import { fromDatabaseLanguage, toDatabaseLanguage } from "@/lib/i18n";

const TOTAL_STEPS = 8;
const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -20 : 20 }),
};
type Consent = { id: string; title: string; version: number; accepted: boolean };
type Profile = {
  productRole: "PLAYER" | "PARTNER";
  user: { email: string; displayName: string };
  market: { code: "TR" | "AZ" };
  preferredLanguage: "EN" | "RU" | "TR" | "AZ";
  accountStatus: string;
};
type Snapshot = {
  status: string;
  user?: { email: string; displayName: string | null };
  profile: Profile | null;
  requiredConsents: Consent[];
  redirectTo: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) throw new Error(body.message ?? "Не удалось выполнить запрос. Повторите попытку.");
  return body;
}

export function AccessFlow() {
  const reducedMotion = useReducedMotion();
  const { locale, setLocale, t } = useI18n();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [mode, setMode] = useState<"onboarding" | "login">("onboarding");
  const [scenario, setScenario] = useState<AccessScenario | null>(null);
  const [country, setCountry] = useState<AccessCountry | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [isAdult, setIsAdult] = useState(false);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [selectedConsentIds, setSelectedConsentIds] = useState<string[]>([]);
  const [destination, setDestination] = useState<"/dashboard/opportunities" | "/partner/opportunities">("/dashboard/opportunities");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  function go(next: number) {
    setDirection(next >= step ? 1 : -1);
    setStep(Math.min(Math.max(next, 1), TOTAL_STEPS));
    setMessage(null);
  }

  function applyProfile(profile: Profile) {
    setName(profile.user.displayName);
    setEmail(profile.user.email);
    setScenario(profile.productRole === "PLAYER" ? "player" : "partner");
    setCountry(profile.market.code === "TR" ? "turkey" : "azerbaijan");
    setLocale(fromDatabaseLanguage(profile.preferredLanguage));
    setDestination(profile.productRole === "PLAYER" ? "/dashboard/opportunities" : "/partner/opportunities");
  }

  function applySnapshot(snapshot: Snapshot) {
    if (snapshot.profile) applyProfile(snapshot.profile);
    else {
      setName(snapshot.user?.displayName ?? name);
      setEmail(snapshot.user?.email ?? email);
    }
    setConsents(snapshot.requiredConsents);
    setSelectedConsentIds(snapshot.requiredConsents.filter((item) => item.accepted).map((item) => item.id));
    if (["COMPLETED", "PARTNER_APPROVAL_PENDING"].includes(snapshot.status)) go(8);
    else if (snapshot.status === "CONSENTS_PENDING" || snapshot.status === "PROFILE_READY") go(4);
    else if (snapshot.status === "CONTACT_PENDING" || snapshot.status === "ACCOUNT_CREATED") go(3);
    else go(1);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
        if (response.ok) {
          const snapshot = await response.json() as Snapshot;
          if (active) applySnapshot(snapshot);
        } else if (active && new URL(window.location.href).searchParams.get("mode") === "login") {
          setMode("login");
        }
      } catch {
        if (active) setMessage(t("access.sessionFailed"));
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
    // Initial server session restoration intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) panelRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [mode, ready, step]);

  useEffect(() => {
    if (!ready || step !== 3) return;
    let active = true;
    void api<{ code: string }>("/api/auth/email/development-code")
      .then((result) => { if (active) setDevelopmentCode(result.code); })
      .catch(() => { if (active) setDevelopmentCode(null); });
    return () => { active = false; };
  }, [ready, step]);

  async function register() {
    setPending(true); setMessage(null);
    try {
      if (!scenario || !country) return;
      const result = await api<{ deliveryAvailable: boolean }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          displayName: name,
          email,
          password,
          productRole: scenario === "partner" ? "PARTNER" : "PLAYER",
          marketCode: country === "azerbaijan" ? "AZ" : "TR",
          preferredLanguage: toDatabaseLanguage(locale),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      go(3);
      if (!result.deliveryAvailable) setMessage(t("access.emailFailed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("access.createFailed"));
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    setPending(true); setMessage(null);
    try {
      await api("/api/auth/email/verify", { method: "POST", body: JSON.stringify({ code }) });
      applySnapshot(await api<Snapshot>("/api/onboarding"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("access.verifyFailed"));
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setPending(true); setMessage(null);
    try {
      const delivery = await api<{ deliveryAvailable: boolean }>("/api/auth/email/request", { method: "POST", body: "{}" });
      setCode("");
      if (!delivery.deliveryAvailable) {
        setMessage(t("access.emailFailed"));
        return;
      }
      const result = await api<{ code: string }>("/api/auth/email/development-code").catch(() => null);
      setDevelopmentCode(result?.code ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("access.resendFailed"));
    } finally {
      setPending(false);
    }
  }

  async function complete() {
    setPending(true); setMessage(null);
    try {
      const result = await api<{ redirectTo: "/dashboard" | "/partner" }>("/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({ ageConfirmed: isAdult, consentVersionIds: selectedConsentIds, idempotencyKey: crypto.randomUUID() }),
      });
      setDestination(result.redirectTo === "/dashboard" ? "/dashboard/opportunities" : "/partner/opportunities");
      go(8);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("access.completeFailed"));
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      window.location.assign("/access");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("access.logoutFailed"));
      setPending(false);
    }
  }

  async function login() {
    setPending(true); setMessage(null);
    try {
      const result = await api<{ redirectTo: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (["/dashboard", "/partner", "/admin"].includes(result.redirectTo)) {
        window.location.assign(result.redirectTo);
      } else {
        setMode("onboarding");
        applySnapshot(await api<Snapshot>("/api/onboarding"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("access.loginFailed"));
    } finally {
      setPending(false);
    }
  }

  return <main id="main-content" className={styles.page}>
    <div className={styles.background} aria-hidden="true"><div className={styles.grid} /><div className={styles.glow} /><div className={styles.portal} /><div className={styles.vignette} /></div>
    <div className={styles.shell}>
      <Container as="header" className={styles.header}>
        <Link href="/" className={styles.logoLink} aria-label={t("access.logo")}><span className={styles.logo} aria-hidden="true"><Image src="/vx-house-logo.jpg" alt="" width={232} height={232} priority unoptimized /></span></Link>
        <div className="flex items-center gap-3"><LanguageSwitcher /><div className={styles.ageMark}><span>18+</span><p>{t("access.adultsOnly")}</p></div></div>
      </Container>
      <Container className={styles.main}><div className={styles.flow}>
        {!ready ? <div className={styles.draftLoading} role="status"><FileClock aria-hidden="true" /><div><h1 tabIndex={-1}>{t("access.checking")}</h1><p>{t("access.moment")}</p></div></div> : <>
          {mode === "onboarding" ? <div className={styles.progressRow}><AccessProgress currentStep={step} /></div> : null}
          {message ? <div className={styles.draftNotice} data-error role="alert"><AlertTriangle aria-hidden="true" /><p>{message}</p><button type="button" onClick={() => setMessage(null)} aria-label={t("access.hideMessage")}>{t("common.close")}</button></div> : null}
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.section key={`${mode}-${step}`} ref={panelRef} className={styles.stepPanel} custom={direction} variants={reducedMotion ? undefined : stepVariants} initial={reducedMotion ? false : "enter"} animate="center" exit={reducedMotion ? undefined : "exit"} transition={{ duration: .38, ease: [0.22, 1, .36, 1] }}>
              {mode === "login"
                ? <AccessLoginStep email={email} password={password} pending={pending} error={message} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={login} onBack={() => { setMode("onboarding"); setMessage(null); }} />
                : step === 1
                  ? <AccessOnboardingWelcomeStep scenario={scenario} country={country} pending={pending} onScenarioChange={setScenario} onCountryChange={setCountry} onContinue={async () => go(2)} />
                  : step === 2
                    ? <AccessRegistrationStep name={name} email={email} password={password} pending={pending} onNameChange={setName} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={register} onLogin={() => setMode("login")} />
                    : step === 3
                      ? <AccessVerificationStep email={email} code={code} developmentCode={developmentCode} pending={pending} error={message} onCodeChange={setCode} onVerify={verify} onResend={resend} onLogout={logout} />
                      : step === 4
                        ? <AccessOnboardingStoryStep kind="tasks" onBack={() => go(3)} onContinue={() => go(5)} />
                        : step === 5
                          ? <AccessOnboardingStoryStep kind="rewards" onBack={() => go(4)} onContinue={() => go(6)} />
                          : step === 6
                            ? <AccessOnboardingStoryStep kind="manager" onBack={() => go(5)} onContinue={() => go(7)} />
                            : step === 7
                              ? <AccessConsentStep scenario={scenario ?? "player"} country={country ?? "turkey"} isAdult={isAdult} consents={consents} selectedConsentIds={selectedConsentIds} onAdultChange={setIsAdult} onConsentChange={(id, value) => setSelectedConsentIds((current) => value ? [...new Set([...current, id])] : current.filter((item) => item !== id))} onContinue={complete} onBack={() => go(6)} pending={pending} error={message} reducedMotion={reducedMotion} />
                              : <AccessCompleteStep scenario={scenario ?? "player"} country={country ?? "turkey"} language={locale} name={name} destination={destination} partnerApprovalPending={scenario === "partner"} onRestart={() => void logout()} reducedMotion={reducedMotion} />}
            </motion.section>
          </AnimatePresence>
        </>}
      </div></Container>
    </div>
  </main>;
}
