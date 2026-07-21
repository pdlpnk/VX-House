"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "@/app/access/access.module.css";
import { AccessBenefitsStep } from "@/components/access/access-benefits-step";
import { AccessPreparationStep } from "@/components/access/access-preparation-step";
import { AccessProgress } from "@/components/access/access-progress";
import { AccessProfileStep } from "@/components/access/access-profile-step";
import { AccessReadyStep } from "@/components/access/access-ready-step";
import {
  AccessScenarioStep,
  type AccessScenario,
} from "@/components/access/access-scenario-step";
import { AccessWelcomeStep } from "@/components/access/access-welcome-step";
import { Container } from "@/components/container";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -22 : 22 }),
};

export function AccessFlow() {
  const prefersReducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState<AccessScenario | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const stepPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    stepPanelRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [currentStep]);

  function goToStep(step: number) {
    setDirection(step >= currentStep ? 1 : -1);
    setCurrentStep(step);
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
              <Image
                src="/vx-house-logo.jpg"
                alt=""
                width={232}
                height={232}
                priority
                unoptimized
              />
            </span>
          </Link>

          <div className={styles.ageMark} aria-label="Доступ только для совершеннолетних">
            <span>18+</span>
            <p>Только для совершеннолетних</p>
          </div>
        </Container>

        <Container className={styles.main}>
          <div className={styles.flow}>
            <AccessProgress currentStep={currentStep} />

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
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                {currentStep === 1 ? (
                  <AccessWelcomeStep
                    onStart={() => goToStep(2)}
                    reducedMotion={prefersReducedMotion}
                  />
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
                  <AccessProfileStep
                    scenario={selectedScenario ?? "player"}
                    name={name}
                    email={email}
                    onNameChange={setName}
                    onEmailChange={setEmail}
                    onContinue={() => goToStep(5)}
                    onBack={() => goToStep(3)}
                    reducedMotion={prefersReducedMotion}
                  />
                ) : currentStep === 5 ? (
                  <AccessPreparationStep
                    scenario={selectedScenario ?? "player"}
                    name={name}
                    onContinue={() => goToStep(6)}
                    reducedMotion={prefersReducedMotion}
                  />
                ) : (
                  <AccessReadyStep
                    scenario={selectedScenario ?? "player"}
                    name={name}
                    reducedMotion={prefersReducedMotion}
                  />
                )}
              </motion.section>
            </AnimatePresence>
          </div>
        </Container>
      </div>
    </main>
  );
}
