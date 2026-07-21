import { motion } from "framer-motion";
import { ArrowRight, Clock3, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion";

type AccessWelcomeStepProps = {
  onStart: () => void;
  reducedMotion: boolean;
};

export function AccessWelcomeStep({ onStart, reducedMotion }: AccessWelcomeStepProps) {
  const contentVariants = reducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : staggerContainer(0.09, 0.04);

  return (
    <motion.div
      className={styles.welcomeContent}
      variants={contentVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.eyebrow}
      >
        <KeyRound aria-hidden="true" />
        <span>Приватный доступ</span>
      </motion.div>

      <motion.h1
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.title}
        tabIndex={-1}
      >
        Добро пожаловать в VX House
      </motion.h1>

      <motion.p
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.description}
      >
        Здесь начинается ваше личное пространство. Выберите подходящий сценарий,
        подтвердите контакт — и мы подготовим кабинет с нужными возможностями.
      </motion.p>

      <motion.p
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.duration}
      >
        Около двух минут. Без пароля и длинной анкеты.
      </motion.p>

      <motion.div
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.actions}
      >
        <Button
          type="button"
          size="lg"
          className={styles.startButton}
          onClick={onStart}
        >
          Начать
          <ArrowRight aria-hidden="true" />
        </Button>
        <Link href="/" className={styles.backLink}>
          Вернуться
        </Link>
      </motion.div>

      <motion.div
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.trust}
        aria-label="Преимущества процесса получения доступа"
      >
        <span><Clock3 aria-hidden="true" /> Около двух минут</span>
        <i aria-hidden="true" />
        <span><KeyRound aria-hidden="true" /> Вход без пароля</span>
        <i aria-hidden="true" />
        <span><ShieldCheck aria-hidden="true" /> Данные защищены</span>
      </motion.div>
    </motion.div>
  );
}
