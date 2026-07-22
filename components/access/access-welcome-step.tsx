import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, KeyRound, MapPin } from "lucide-react";
import Link from "next/link";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion";

type AccessWelcomeStepProps = {
  onStart: () => void;
  onLogin: () => void;
  reducedMotion: boolean;
};

export function AccessWelcomeStep({ onStart, onLogin, reducedMotion }: AccessWelcomeStepProps) {
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
        <span>Получение доступа</span>
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
        VX House — платформа лояльности и сотрудничества для совершеннолетних
        пользователей в Турции и Азербайджане. Этот короткий сценарий поможет
        определить роль, рынок и предпочтительный язык.
      </motion.p>

      <motion.p
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.duration}
      >
        Создание профиля займёт несколько минут: вы выберете роль и рынок,
        подтвердите электронную почту и примете актуальные условия.
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
          Продолжить
          <ArrowRight aria-hidden="true" />
        </Button>
        <Link href="/" className={styles.backLink}>
          Вернуться
        </Link>
        <button type="button" className={styles.backLink} onClick={onLogin}>У меня уже есть профиль</button>
      </motion.div>

      <motion.div
        variants={reducedMotion ? undefined : fadeUp}
        className={styles.trust}
        aria-label="Этапы знакомства с VX House"
      >
        <span><CheckCircle2 aria-hidden="true" /> Только необходимые данные</span>
        <i aria-hidden="true" />
        <span><MapPin aria-hidden="true" /> Учёт страны и языка</span>
        <i aria-hidden="true" />
        <span><KeyRound aria-hidden="true" /> Защищённый вход</span>
      </motion.div>
    </motion.div>
  );
}
