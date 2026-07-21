import { motion } from "framer-motion";
import { ArrowLeft, Check, Gamepad2, Handshake } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type AccessScenario = "player" | "partner";

type AccessScenarioStepProps = {
  selectedScenario: AccessScenario | null;
  onSelect: (scenario: AccessScenario) => void;
  onContinue: () => void;
  onBack: () => void;
  reducedMotion: boolean;
};

const scenarios = [
  {
    id: "player" as const,
    title: "Игрок",
    description:
      "Получите доступ к личному кабинету, специальным условиям, сопровождению и возможностям платформы.",
    icon: Gamepad2,
    number: "01",
  },
  {
    id: "partner" as const,
    title: "Партнёр",
    description:
      "Используйте инструменты сотрудничества, поддержку и управление партнёрским взаимодействием.",
    icon: Handshake,
    number: "02",
  },
] as const;

export function AccessScenarioStep({
  selectedScenario,
  onSelect,
  onContinue,
  onBack,
  reducedMotion,
}: AccessScenarioStepProps) {
  return (
    <div className={styles.scenarioContent}>
      <div className={styles.scenarioHeading}>
        <span className={styles.scenarioEyebrow}>Персональное пространство</span>
        <h1 tabIndex={-1}>Выберите подходящий сценарий</h1>
        <p>
          Это поможет подготовить пространство VX House именно под ваши задачи.
          Вы всегда сможете изменить выбор позже.
        </p>
      </div>

      <div className={styles.scenarioGrid} role="group" aria-label="Выбор сценария доступа">
        {scenarios.map(({ id, title, description, icon: Icon, number }, index) => {
          const isSelected = selectedScenario === id;

          return (
            <motion.div
              key={id}
              initial={reducedMotion ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.48,
                delay: reducedMotion ? 0 : 0.08 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={reducedMotion ? undefined : { y: -5 }}
            >
              <Card
                className={styles.scenarioCard}
                data-selected={isSelected || undefined}
              >
                <div className={styles.scenarioCardTop}>
                  <span className={styles.scenarioIcon}><Icon aria-hidden="true" /></span>
                  <span className={styles.scenarioNumber}>{number}</span>
                </div>

                <div className={styles.scenarioCardCopy}>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  variant={isSelected ? "default" : "outline"}
                  className={styles.scenarioButton}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(id)}
                >
                  {isSelected ? (
                    <><Check aria-hidden="true" /> Выбрано</>
                  ) : (
                    "Выбрать"
                  )}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className={styles.scenarioFooter}>
        <Button
          type="button"
          size="lg"
          className={styles.scenarioContinue}
          disabled={!selectedScenario}
          onClick={onContinue}
        >
          Продолжить
        </Button>
        <button type="button" className={styles.stepBackButton} onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Назад
        </button>
      </div>
    </div>
  );
}
