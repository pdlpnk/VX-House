"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Gift, MessageCircle, Route, Sparkles } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const stories = {
  tasks: {
    eyebrow: "Ваш маршрут",
    title: "Выполняйте задания по шагам",
    description: "Каждое задание содержит понятную инструкцию, условия и следующий шаг. Новое задание открывается после проверки предыдущего.",
    icon: Route,
    items: ["Актуальная инструкция", "Понятный статус проверки", "История результата"],
  },
  rewards: {
    eyebrow: "Ваш прогресс",
    title: "Открывайте новые преимущества",
    description: "За подтверждённые действия вы получаете VX Points, Cashback, VX Rewards и продвигаетесь к следующему уровню.",
    icon: Gift,
    items: ["VX Points", "Cashback и Rewards", "Уровни участника"],
  },
  manager: {
    eyebrow: "Личный контакт",
    title: "Ваш менеджер всегда рядом",
    description: "Внутренний диалог сохраняет историю и контекст задания. Не нужно каждый раз объяснять ситуацию заново.",
    icon: MessageCircle,
    items: ["Сообщения в одном месте", "Контекст заданий", "Статус диалога"],
  },
} as const;

export function AccessOnboardingStoryStep({ kind, onBack, onContinue }: { kind: keyof typeof stories; onBack: () => void; onContinue: () => void }) {
  const story = stories[kind];
  const Icon = story.icon;
  return <div className={styles.benefitsContent}>
    <header className={styles.stepHeading}><span className={styles.scenarioEyebrow}>{story.eyebrow}</span><h1 tabIndex={-1}>{story.title}</h1><p>{story.description}</p></header>
    <Card className={styles.benefitsPreview}>
      <div className={styles.benefitsTopbar}><div className={styles.benefitsBrand}><span>VX</span><div><strong>VX House</strong><small>Личное пространство</small></div></div><span className={styles.benefitsStatus}><BadgeCheck aria-hidden="true" />Всё под контролем</span></div>
      <div className={styles.benefitsDashboard}>
        <article className={styles.benefitFeatured}><div className={styles.benefitFeaturedIcon}><Icon aria-hidden="true" /></div><div><span>{story.eyebrow}</span><h2>{story.title}</h2><p>{story.description}</p></div></article>
        <div className={styles.benefitsList}>{story.items.map((item, index) => <article key={item} className={styles.benefitRow}><span className={styles.benefitRowIcon}>{kind === "rewards" ? <Sparkles aria-hidden="true" /> : index === 0 ? <BadgeCheck aria-hidden="true" /> : <Icon aria-hidden="true" />}</span><div><h2>{item}</h2><p>{index === 0 ? "Сразу видно, что делать дальше." : "Статус обновляется в личном пространстве."}</p></div><ArrowRight aria-hidden="true" /></article>)}</div>
      </div>
    </Card>
    <div className={styles.benefitsActions}><Button type="button" size="lg" onClick={onContinue}>Продолжить<ArrowRight aria-hidden="true" /></Button><button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />Назад</button></div>
  </div>;
}
