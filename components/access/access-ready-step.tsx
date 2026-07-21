"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Check,
  Crown,
  Headphones,
  History,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AccessReadyStepProps = {
  scenario: AccessScenario;
  name: string;
  reducedMotion: boolean;
};

const completedStatuses = [
  "Профиль активирован",
  "Личный кабинет готов",
  "Выбранный сценарий подключён",
  "Пространство VX House создано",
] as const;

const revealVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 13 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AccessReadyStep({ scenario, name, reducedMotion }: AccessReadyStepProps) {
  const isPartner = scenario === "partner";
  const displayName = name.trim() || "Участник VX House";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  function openDialog() {
    dialogRef.current?.showModal();
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    dialogRef.current?.close();
  }

  return (
    <div className={styles.readyContent}>
      <div className={styles.readyHeading}>
        <motion.div
          className={styles.readyMark}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          <Check aria-hidden="true" />
        </motion.div>
        <span className={styles.scenarioEyebrow}>Пространство активировано</span>
        <h1 tabIndex={-1}>Ваше пространство VX House готово</h1>
        <p>
          Профиль подготовлен. Личный кабинет активирован. Теперь вам доступны
          возможности платформы в соответствии с выбранным сценарием.
        </p>
      </div>

      <motion.div
        className={styles.readyGrid}
        variants={reducedMotion ? undefined : revealVariants}
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
      >
        <motion.div variants={reducedMotion ? undefined : revealItemVariants}>
          <Card className={styles.readyStatusCard}>
            <div className={styles.readyStatusHeader}>
              <div>
                <span>Статус пространства</span>
                <strong>Всё готово к работе</strong>
              </div>
              <span className={styles.readySecure}>
                <ShieldCheck aria-hidden="true" /> Защищено
              </span>
            </div>

            <ul className={styles.readyStatusList} aria-label="Статусы пространства">
              {completedStatuses.map((status, index) => (
                <motion.li
                  key={status}
                  variants={reducedMotion ? undefined : revealItemVariants}
                >
                  <span><Check aria-hidden="true" /></span>
                  <strong>{status}</strong>
                  <small>Готово</small>
                  {index < completedStatuses.length - 1 && <i aria-hidden="true" />}
                </motion.li>
              ))}
            </ul>

            <div className={styles.readyStatusFooter}>
              <span>VX</span>
              <p>Ваше приватное пространство настроено и готово к следующему этапу.</p>
            </div>
          </Card>
        </motion.div>

        <motion.div
          className={styles.readyDashboardWrap}
          variants={reducedMotion ? undefined : revealItemVariants}
        >
          <div className={styles.readyDashboardGlow} aria-hidden="true" />
          <Card className={styles.readyDashboard}>
            <div className={styles.readyDashboardTop}>
              <div className={styles.readyDashboardBrand}>
                <span>VX</span>
                <div>
                  <strong>{isPartner ? "Партнёрское пространство" : "Личное пространство"}</strong>
                  <small>VX House</small>
                </div>
              </div>
              <span className={styles.readyOnline}><i /> Активно</span>
            </div>

            <motion.div
              className={styles.readyProfileCard}
              variants={reducedMotion ? undefined : revealItemVariants}
            >
              <div className={styles.readyAvatar}>
                {displayName.charAt(0).toLocaleUpperCase("ru")}
              </div>
              <div className={styles.readyProfileIdentity}>
                <small>{isPartner ? "Партнёр VX House" : "Участник VX House"}</small>
                <strong>{displayName}</strong>
                <span><ShieldCheck aria-hidden="true" /> Профиль активирован</span>
              </div>
              <Bell aria-label="Уведомления доступны" />
            </motion.div>

            <div className={styles.readyDashboardCards}>
              <motion.article
                className={styles.readyConditionCard}
                variants={reducedMotion ? undefined : revealItemVariants}
              >
                <span><Sparkles aria-hidden="true" /></span>
                <small>{isPartner ? "Условия сотрудничества" : "Специальные условия"}</small>
                <strong>{isPartner ? "Сценарий подключён" : "Доступны в кабинете"}</strong>
                <p>{isPartner ? "Формат взаимодействия подготовлен" : "Условия сформированы для профиля"}</p>
              </motion.article>

              <motion.article
                className={styles.readyLevelCard}
                variants={reducedMotion ? undefined : revealItemVariants}
              >
                <span><Crown aria-hidden="true" /></span>
                <small>Уровень участника</small>
                <strong>{isPartner ? "Партнёр" : "Прайм"}</strong>
                <p>Статус активен</p>
              </motion.article>

              <motion.article
                className={styles.readySupportCard}
                variants={reducedMotion ? undefined : revealItemVariants}
              >
                <span><Headphones aria-hidden="true" /></span>
                <div>
                  <small>Поддержка</small>
                  <strong>Канал сопровождения доступен</strong>
                </div>
                <Check aria-hidden="true" />
              </motion.article>

              <motion.article
                className={styles.readyHistoryCard}
                variants={reducedMotion ? undefined : revealItemVariants}
              >
                <div className={styles.readyHistoryHeader}>
                  <span><History aria-hidden="true" /></span>
                  <div>
                    <small>История активности</small>
                    <strong>Последние события</strong>
                  </div>
                </div>
                <ul>
                  <li><i /> <span>Пространство создано</span><small>сейчас</small></li>
                  <li><i /> <span>Сценарий подключён</span><small>сейчас</small></li>
                </ul>
              </motion.article>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.readyActions}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, delay: reducedMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <Button type="button" size="lg" onClick={openDialog}>
          Перейти в VX House
          <ArrowRight aria-hidden="true" />
        </Button>
      </motion.div>

      <dialog
        ref={dialogRef}
        className={styles.readyDialog}
        aria-labelledby="next-stage-title"
        aria-describedby="next-stage-description"
        onCancel={() => setIsDialogOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        {isDialogOpen && (
          <motion.div
            className={styles.readyDialogPanel}
            initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className={styles.readyDialogClose}
              onClick={closeDialog}
              aria-label="Закрыть окно"
            >
              <X aria-hidden="true" />
            </button>
            <div className={styles.readyDialogMark}><UserRound aria-hidden="true" /></div>
            <span>VX House</span>
            <h2 id="next-stage-title">Следующий этап разработки</h2>
            <div id="next-stage-description" className={styles.readyDialogCopy}>
              <p>Вы завершили сценарий знакомства с VX House.</p>
              <p>
                Полноценный личный кабинет, авторизация и внутренняя платформа
                будут реализованы на следующих этапах разработки.
              </p>
            </div>
            <div className={styles.readyDialogActions}>
              <Button asChild size="lg">
                <Link href="/">Вернуться на главную</Link>
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={closeDialog}>
                Закрыть
              </Button>
            </div>
          </motion.div>
        )}
      </dialog>
    </div>
  );
}
