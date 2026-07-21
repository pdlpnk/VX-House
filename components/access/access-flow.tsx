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
import { AccessMarketStep } from "@/components/access/access-market-step";
import { AccessProfileStep } from "@/components/access/access-profile-step";
import { AccessProgress } from "@/components/access/access-progress";
import { AccessScenarioStep } from "@/components/access/access-scenario-step";
import { AccessWelcomeStep } from "@/components/access/access-welcome-step";
import { Container } from "@/components/container";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  ACCESS_DRAFT_KEY,
  createAccessDraft,
  getSafeResumeStep,
  parseAccessDraft,
  type AccessCountry,
  type AccessLanguage,
  type AccessScenario,
} from "@/lib/access-draft";

const TOTAL_STEPS = 7;

const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -20 : 20 }),
};

type DraftStatus = "loading" | "ready" | "error";

export function AccessFlow() {
  const prefersReducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState<AccessScenario | null>(null);
  const [country, setCountry] = useState<AccessCountry | null>(null);
  const [language, setLanguage] = useState<AccessLanguage | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("loading");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const stepPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;

    try {
      const rawDraft = window.localStorage.getItem(ACCESS_DRAFT_KEY);

      if (rawDraft) {
        const draft = parseAccessDraft(rawDraft);
        if (draft) {
          queueMicrotask(() => {
            if (!active) return;
            setSelectedScenario(draft.scenario);
            setCountry(draft.country);
            setLanguage(draft.language);
            setCurrentStep(getSafeResumeStep(draft));
            setDraftMessage("Незавершённый процесс восстановлен. Контакт и согласия не сохранялись.");
            setDraftStatus("ready");
          });
        } else {
          window.localStorage.removeItem(ACCESS_DRAFT_KEY);
          queueMicrotask(() => {
            if (!active) return;
            setDraftMessage("Устаревший черновик удалён. Начните с актуального сценария.");
            setDraftStatus("ready");
          });
        }
      } else {
        queueMicrotask(() => active && setDraftStatus("ready"));
      }
    } catch {
      queueMicrotask(() => {
        if (!active) return;
        setDraftStatus("error");
        setDraftMessage("Не удалось прочитать временный черновик. Можно продолжить, но обновление страницы сбросит прогресс.");
      });
    }

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (draftStatus !== "ready" || currentStep === TOTAL_STEPS || !selectedScenario) return;

    try {
      const draft = createAccessDraft({
        step: Math.min(currentStep, 5),
        scenario: selectedScenario,
        country,
        language,
      });
      window.localStorage.setItem(ACCESS_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      queueMicrotask(() => {
        setDraftStatus("error");
        setDraftMessage("Не удалось сохранить временный черновик. Оставьте вкладку открытой, чтобы не потерять выбор.");
      });
    }
  }, [country, currentStep, draftStatus, language, selectedScenario]);

  useEffect(() => {
    if (draftStatus === "loading") return;
    window.scrollTo({ top: 0, behavior: "auto" });
    stepPanelRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [currentStep, draftStatus]);

  function goToStep(step: number) {
    const nextStep = Math.min(Math.max(step, 1), TOTAL_STEPS);
    if (draftStatus === "ready") setDraftMessage(null);
    setDirection(nextStep >= currentStep ? 1 : -1);
    setCurrentStep(nextStep);
  }

  function resetFlow() {
    try {
      window.localStorage.removeItem(ACCESS_DRAFT_KEY);
    } catch {
      setDraftStatus("error");
    }

    setDirection(-1);
    setCurrentStep(1);
    setSelectedScenario(null);
    setCountry(null);
    setLanguage(null);
    setName("");
    setEmail("");
    setIsAdult(false);
    setAcceptedRules(false);
    setAcceptedPrivacy(false);
    setDraftMessage(null);
  }

  function completeFlow() {
    try {
      window.localStorage.removeItem(ACCESS_DRAFT_KEY);
    } catch {
      setDraftStatus("error");
    }
    goToStep(7);
  }

  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.glow} />
        <div className={styles.portal} />
        <div className={styles.vignette} />
      </div>

      <div className={styles.shell}>
        <Container as="header" className={styles.header}>
          <Link href="/" className={styles.logoLink} aria-label="VX House — главная">
            <span className={styles.logo} aria-hidden="true">
              <Image src="/vx-house-logo.jpg" alt="" width={232} height={232} priority unoptimized />
            </span>
          </Link>
          <div className={styles.ageMark} aria-label="Доступ только для совершеннолетних">
            <span>18+</span><p>Только для совершеннолетних</p>
          </div>
        </Container>

        <Container className={styles.main}>
          <div className={styles.flow}>
            {draftStatus === "loading" ? (
              <div className={styles.draftLoading} role="status">
                <FileClock aria-hidden="true" />
                <div><h1 tabIndex={-1}>Проверяем незавершённый процесс</h1><p>Это займёт один момент.</p></div>
              </div>
            ) : (
              <>
                <div className={styles.progressRow}>
                  <AccessProgress currentStep={currentStep} />
                  {currentStep > 1 && currentStep < TOTAL_STEPS ? (
                    <button type="button" className={styles.resetButton} onClick={resetFlow}><RotateCcw aria-hidden="true" />Начать заново</button>
                  ) : null}
                </div>

                {draftMessage ? (
                  <div className={styles.draftNotice} data-error={draftStatus === "error" || undefined} role={draftStatus === "error" ? "alert" : "status"}>
                    {draftStatus === "error" ? <AlertTriangle aria-hidden="true" /> : <FileClock aria-hidden="true" />}
                    <p>{draftMessage}</p>
                    <button type="button" onClick={() => setDraftMessage(null)} aria-label="Скрыть сообщение">Закрыть</button>
                  </div>
                ) : null}

                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.section
                    key={currentStep}
                    ref={stepPanelRef}
                    className={styles.stepPanel}
                    custom={direction}
                    variants={prefersReducedMotion ? undefined : stepVariants}
                    initial={prefersReducedMotion ? false : "enter"}
                    animate="center"
                    exit={prefersReducedMotion ? undefined : "exit"}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {currentStep === 1 ? (
                      <AccessWelcomeStep onStart={() => goToStep(2)} reducedMotion={prefersReducedMotion} />
                    ) : currentStep === 2 ? (
                      <AccessScenarioStep
                        selectedScenario={selectedScenario}
                        onSelect={setSelectedScenario}
                        onContinue={() => selectedScenario && goToStep(3)}
                        onBack={() => goToStep(1)}
                        reducedMotion={prefersReducedMotion}
                      />
                    ) : currentStep === 3 ? (
                      <AccessBenefitsStep
                        scenario={selectedScenario ?? "player"}
                        onContinue={() => goToStep(4)}
                        onBack={() => goToStep(2)}
                        reducedMotion={prefersReducedMotion}
                      />
                    ) : currentStep === 4 ? (
                      <AccessMarketStep
                        country={country}
                        language={language}
                        onCountryChange={setCountry}
                        onLanguageChange={setLanguage}
                        onContinue={() => country && language && goToStep(5)}
                        onBack={() => goToStep(3)}
                        reducedMotion={prefersReducedMotion}
                      />
                    ) : currentStep === 5 ? (
                      <AccessProfileStep
                        scenario={selectedScenario ?? "player"}
                        country={country ?? "turkey"}
                        language={language ?? "ru"}
                        name={name}
                        email={email}
                        onNameChange={setName}
                        onEmailChange={setEmail}
                        onContinue={() => goToStep(6)}
                        onBack={() => goToStep(4)}
                        reducedMotion={prefersReducedMotion}
                      />
                    ) : currentStep === 6 ? (
                      <AccessConsentStep
                        scenario={selectedScenario ?? "player"}
                        country={country ?? "turkey"}
                        isAdult={isAdult}
                        acceptedRules={acceptedRules}
                        acceptedPrivacy={acceptedPrivacy}
                        onAdultChange={setIsAdult}
                        onRulesChange={setAcceptedRules}
                        onPrivacyChange={setAcceptedPrivacy}
                        onContinue={completeFlow}
                        onBack={() => goToStep(5)}
                        reducedMotion={prefersReducedMotion}
                      />
                    ) : (
                      <AccessCompleteStep
                        scenario={selectedScenario ?? "player"}
                        country={country ?? "turkey"}
                        language={language ?? "ru"}
                        name={name}
                        onRestart={resetFlow}
                        reducedMotion={prefersReducedMotion}
                      />
                    )}
                  </motion.section>
                </AnimatePresence>
              </>
            )}
          </div>
        </Container>
      </div>
    </main>
  );
}
