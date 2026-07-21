"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleDot,
  Headphones,
  History,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AccessPreparationStepProps = {
  scenario: AccessScenario;
  name: string;
  onContinue: () => void;
  reducedMotion: boolean;
};

const preparationSteps = [
  "Проверка данных",
  "Создание профиля",
  "Подготовка личного кабинета",
  "Подключение возможностей",
] as const;

const dashboardItems = [
  { title: "Профиль", icon: UserRound, activatesAt: 2 },
  { title: "Специальные условия", icon: Sparkles, activatesAt: 4 },
  { title: "Поддержка", icon: Headphones, activatesAt: 3 },
  { title: "История активности", icon: History, activatesAt: 4 },
] as const;

export function AccessPreparationStep({
  scenario,
  name,
  onContinue,
  reducedMotion,
}: AccessPreparationStepProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const visibleCompletedCount = reducedMotion ? preparationSteps.length : completedCount;
  const isComplete = visibleCompletedCount === preparationSteps.length;
  const isPartner = scenario === "partner";

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let nextCompleted = 0;
    const interval = window.setInterval(() => {
      nextCompleted += 1;
      setCompletedCount(nextCompleted);

      if (nextCompleted === preparationSteps.length) {
        window.clearInterval(interval);
      }
    }, 520);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  return (
    <div className={styles.preparationContent}>
      <div className={styles.preparationHeading}>
        <span className={styles.scenarioEyebrow}>Настройка VX House</span>
        <h1 tabIndex={-1}>Подготавливаем ваше пространство</h1>
        <p>
          Это займёт всего несколько секунд. Мы создаём ваш профиль и активируем
          выбранный сценарий.
        </p>
      </div>

      <div className={styles.preparationGrid}>
        <Card className={styles.preparationStatusCard}>
          <div className={styles.preparationCardHeader}>
            <div>
              <span>{isComplete ? "Подготовка завершена" : "Система работает"}</span>
              <strong>{isComplete ? "Пространство готово" : "Настраиваем доступ"}</strong>
            </div>
            <motion.span
              className={styles.preparationPulse}
              data-complete={isComplete || undefined}
              animate={
                reducedMotion || isComplete
                  ? undefined
                  : { opacity: [0.45, 1, 0.45], scale: [0.92, 1, 0.92] }
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {isComplete ? <Check aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            </motion.span>
          </div>

          <ol className={styles.preparationList} aria-label="Этапы подготовки">
            {preparationSteps.map((label, index) => {
              const isDone = visibleCompletedCount > index;
              const isCurrent = visibleCompletedCount === index && !isComplete;

              return (
                <li key={label} data-complete={isDone || undefined} data-current={isCurrent || undefined}>
                  <motion.span
                    className={styles.preparationStepIcon}
                    animate={
                      reducedMotion
                        ? undefined
                        : isDone
                          ? { scale: [0.82, 1.08, 1] }
                          : { scale: 1 }
                    }
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {isDone ? <Check aria-hidden="true" /> : <CircleDot aria-hidden="true" />}
                  </motion.span>
                  <span>{label}</span>
                  <small>{isDone ? "Готово" : isCurrent ? "В процессе" : "Ожидает"}</small>
                </li>
              );
            })}
          </ol>

          <div className={styles.preparationNote} role="status" aria-live="polite">
            <ShieldCheck aria-hidden="true" />
            <span>
              {isComplete
                ? "Все основные возможности подключены."
                : "Данные остаются внутри защищённого пространства VX House."}
            </span>
          </div>
        </Card>

        <div className={styles.preparationPreviewWrap} aria-label="Будущий кабинет VX House">
          <div className={styles.preparationGlow} aria-hidden="true" />
          <Card className={styles.preparationPreview}>
            <div className={styles.preparationPreviewTop}>
              <div className={styles.preparationMiniBrand}>
                <span>VX</span>
                <div>
                  <strong>{isPartner ? "Партнёрский кабинет" : "Личный кабинет"}</strong>
                  <small>{name.trim() || "Новое пространство"}</small>
                </div>
              </div>
              <span className={styles.preparationLive} data-complete={isComplete || undefined}>
                <i /> {isComplete ? "Готово" : "Подключение"}
              </span>
            </div>

            <div className={styles.preparationDashboard}>
              {dashboardItems.map(({ title, icon: Icon, activatesAt }, index) => {
                const isActive = visibleCompletedCount >= activatesAt;

                return (
                  <motion.div
                    key={title}
                    className={styles.preparationDashboardItem}
                    data-active={isActive || undefined}
                    initial={false}
                    animate={
                      reducedMotion
                        ? undefined
                        : { opacity: isActive ? 1 : 0.38, y: isActive ? 0 : 5 }
                    }
                    transition={{ duration: 0.38, delay: isActive ? index * 0.025 : 0 }}
                  >
                    <span><Icon aria-hidden="true" /></span>
                    <div>
                      <strong>{title}</strong>
                      <small>{isActive ? "Подключено" : "Подготовка"}</small>
                    </div>
                    {isActive && <Check aria-hidden="true" />}
                  </motion.div>
                );
              })}
            </div>

            <div className={styles.preparationPreviewFooter}>
              <div>
                <span style={{ width: `${visibleCompletedCount * 25}%` }} />
              </div>
              <small>{isComplete ? "Пространство активно" : "Активация возможностей"}</small>
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.preparationActions}>
        <AnimatePresence initial={false}>
          {isComplete && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button type="button" size="lg" onClick={onContinue}>
                Продолжить
                <ArrowRight aria-hidden="true" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
