import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Crown,
  FileText,
  Headphones,
  History,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AccessBenefitsStepProps = {
  scenario: AccessScenario;
  onContinue: () => void;
  onBack: () => void;
  reducedMotion: boolean;
};

const content = {
  player: {
    title: "Ваше пространство игрока",
    description:
      "После создания профиля вам будут доступны основные возможности VX House в одном личном пространстве.",
    spaceLabel: "Личное пространство",
    status: "Сценарий подготовлен",
    featuredIcon: LayoutDashboard,
    features: [
      {
        title: "Личный кабинет",
        description:
          "Статус профиля, доступные функции и важные обновления в одном месте.",
        icon: LayoutDashboard,
      },
      {
        title: "Персональные условия",
        description:
          "Доступные предложения и условия, сформированные с учётом профиля пользователя.",
        icon: Sparkles,
      },
      {
        title: "Поддержка",
        description: "Прямой доступ к сопровождению и истории обращений.",
        icon: Headphones,
      },
      {
        title: "История активности",
        description:
          "Основные события, изменения статуса и действия внутри платформы.",
        icon: History,
      },
      {
        title: "Привилегии участника",
        description:
          "Уровень, доступные преимущества и новые возможности аккаунта.",
        icon: Crown,
      },
    ],
  },
  partner: {
    title: "Ваше партнёрское пространство",
    description:
      "После создания профиля вы получите единое пространство для управления сотрудничеством с VX House.",
    spaceLabel: "Партнёрское пространство",
    status: "Сценарий подготовлен",
    featuredIcon: BriefcaseBusiness,
    features: [
      {
        title: "Партнёрский кабинет",
        description:
          "Основная информация о сотрудничестве, статусах и доступных действиях.",
        icon: BriefcaseBusiness,
      },
      {
        title: "Условия сотрудничества",
        description:
          "Понятное отображение актуальных условий и формата взаимодействия.",
        icon: FileText,
      },
      {
        title: "Статус взаимодействия",
        description: "Текущий этап работы и следующие необходимые действия.",
        icon: Workflow,
      },
      {
        title: "Поддержка партнёров",
        description:
          "Прямая связь с командой VX House по вопросам сотрудничества.",
        icon: Headphones,
      },
      {
        title: "История активности",
        description:
          "История изменений, запросов и основных событий партнёрского профиля.",
        icon: History,
      },
    ],
  },
} as const;

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AccessBenefitsStep({
  scenario,
  onContinue,
  onBack,
  reducedMotion,
}: AccessBenefitsStepProps) {
  const scenarioContent = content[scenario];
  const [featured, ...features] = scenarioContent.features;
  const FeaturedIcon = scenarioContent.featuredIcon;

  return (
    <div className={styles.benefitsContent}>
      <div className={styles.benefitsHeading}>
        <span className={styles.scenarioEyebrow}>Возможности пространства</span>
        <h1 tabIndex={-1}>{scenarioContent.title}</h1>
        <p>{scenarioContent.description}</p>
      </div>

      <motion.div
        className={styles.benefitsPreviewWrap}
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.benefitsGlow} aria-hidden="true" />
        <Card className={styles.benefitsPreview}>
          <div className={styles.benefitsTopbar}>
            <div className={styles.benefitsBrand}>
              <span>VX</span>
              <div>
                <strong>{scenarioContent.spaceLabel}</strong>
                <small>VX House</small>
              </div>
            </div>
            <span className={styles.benefitsStatus}>
              <BadgeCheck aria-hidden="true" />
              {scenarioContent.status}
            </span>
          </div>

          <motion.div
            className={styles.benefitsDashboard}
            variants={reducedMotion ? undefined : listVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="visible"
          >
            <motion.article
              className={styles.benefitFeatured}
              variants={reducedMotion ? undefined : itemVariants}
            >
              <div className={styles.benefitFeaturedIcon}>
                <FeaturedIcon aria-hidden="true" />
              </div>
              <div>
                <span>Основное пространство</span>
                <h2>{featured.title}</h2>
                <p>{featured.description}</p>
              </div>
              <div className={styles.benefitSecurity}>
                <ShieldCheck aria-hidden="true" />
                <span>Доступ защищён</span>
              </div>
            </motion.article>

            <div className={styles.benefitsList}>
              {features.map(({ title, description, icon: Icon }) => (
                <motion.article
                  key={title}
                  className={styles.benefitRow}
                  variants={reducedMotion ? undefined : itemVariants}
                >
                  <span className={styles.benefitRowIcon}>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                  </div>
                  <ArrowRight aria-hidden="true" />
                </motion.article>
              ))}
            </div>
          </motion.div>
        </Card>
      </motion.div>

      <div className={styles.benefitsActions}>
        <Button
          type="button"
          size="lg"
          className={styles.benefitsContinue}
          onClick={onContinue}
        >
          Продолжить создание пространства
          <ArrowRight aria-hidden="true" />
        </Button>
        <button type="button" className={styles.stepBackButton} onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Назад к выбору
        </button>
      </div>
    </div>
  );
}
