import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AccessProfileStepProps = {
  scenario: AccessScenario;
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  reducedMotion: boolean;
};

export function AccessProfileStep({
  scenario,
  name,
  email,
  onNameChange,
  onEmailChange,
  onContinue,
  onBack,
  reducedMotion,
}: AccessProfileStepProps) {
  const displayName = name.trim() || "Ваше имя";
  const displayEmail = email.trim() || "Контакт появится здесь";
  const progress = 28 + (name.trim() ? 28 : 0) + (email.trim() ? 28 : 0);
  const isPartner = scenario === "partner";
  const canContinue = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className={styles.profileContent}>
      <div className={styles.profileIntro}>
        <span className={styles.scenarioEyebrow}>Подготовка пространства</span>
        <h1 tabIndex={-1}>Создадим ваше пространство VX House</h1>
        <p>
          Остался один небольшой шаг. Укажите контакт, чтобы мы подготовили ваш
          личный кабинет.
        </p>

        <Card className={styles.profileFields}>
          <div className={styles.fieldGroup}>
            <label htmlFor="access-name">Имя</label>
            <div className={styles.inputWrap}>
              <UserRound aria-hidden="true" />
              <Input
                id="access-name"
                name="name"
                type="text"
                value={name}
                autoComplete="name"
                placeholder="Как к вам обращаться"
                onChange={(event) => onNameChange(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="access-email">Электронная почта</label>
            <div className={styles.inputWrap}>
              <AtSign aria-hidden="true" />
              <Input
                id="access-email"
                name="email"
                type="email"
                value={email}
                autoComplete="email"
                inputMode="email"
                placeholder="name@example.com"
                onChange={(event) => onEmailChange(event.target.value)}
              />
            </div>
            <small>Используем только для входа и важных уведомлений.</small>
          </div>

          <div className={styles.noPasswordNote}>
            <LockKeyhole aria-hidden="true" />
            <span><strong>Без пароля</strong> — безопасный вход подключим на следующем шаге.</span>
          </div>
        </Card>

        <div className={styles.profileActions}>
          <Button
            type="button"
            size="lg"
            disabled={!canContinue}
            onClick={onContinue}
          >
            Продолжить
            <ArrowRight aria-hidden="true" />
          </Button>

          <button type="button" className={styles.stepBackButton} onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            Назад к возможностям
          </button>
        </div>
      </div>

      <motion.div
        className={styles.accountPreviewWrap}
        initial={reducedMotion ? false : { opacity: 0, x: 26, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Предпросмотр будущего кабинета"
      >
        <div className={styles.previewGlow} aria-hidden="true" />
        <Card className={styles.accountPreview}>
          <div className={styles.accountPreviewTop}>
            <div className={styles.previewBrand}>
              <span>VX</span>
              <div>
                <strong>{isPartner ? "Партнёрский кабинет" : "Личный кабинет"}</strong>
                <small>Пространство VX House</small>
              </div>
            </div>
            <span className={styles.previewSecure}><ShieldCheck aria-hidden="true" /> Защищено</span>
          </div>

          <div className={styles.previewProfile}>
            <motion.div
              className={styles.previewAvatar}
              animate={reducedMotion ? undefined : { boxShadow: [
                "0 0 0 0 oklch(0.6 0.22 25 / 0)",
                "0 0 0 7px oklch(0.6 0.22 25 / 0.09)",
                "0 0 0 0 oklch(0.6 0.22 25 / 0)",
              ] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {name.trim().charAt(0).toLocaleUpperCase("ru") || "VX"}
            </motion.div>
            <div className={styles.previewIdentity}>
              <small>{isPartner ? "Представитель партнёра" : "Участник платформы"}</small>
              <AnimatePresence mode="wait" initial={false}>
                <motion.strong
                  key={displayName}
                  initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {displayName}
                </motion.strong>
              </AnimatePresence>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={displayEmail}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {displayEmail}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className={styles.previewStatus}>
            <div className={styles.previewStatusHeading}>
              <div>
                <span><i /> Профиль создаётся</span>
                <strong>Подготовка пространства</strong>
              </div>
              <Sparkles aria-hidden="true" />
            </div>
            <div
              className={styles.previewProgress}
              role="progressbar"
              aria-label="Подготовка профиля"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <motion.span
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <small>Данные обновляются в предпросмотре</small>
          </div>

          <div className={styles.previewFeatures}>
            <div><Check aria-hidden="true" /><span>Профиль</span></div>
            <div><ShieldCheck aria-hidden="true" /><span>Защита</span></div>
            <div><Sparkles aria-hidden="true" /><span>{isPartner ? "Сотрудничество" : "Условия"}</span></div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
