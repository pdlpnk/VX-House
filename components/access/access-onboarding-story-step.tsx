"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Gift, MessageCircle, Route, Sparkles } from "lucide-react";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { accessContent, type StoryKind } from "@/lib/i18n/access-content";

const icons = { tasks: Route, rewards: Gift, manager: MessageCircle } as const;

export function AccessOnboardingStoryStep({ kind, onBack, onContinue }: { kind: StoryKind; onBack: () => void; onContinue: () => void }) {
  const { locale, t } = useI18n();
  const content = accessContent[locale];
  const story = content.stories[kind];
  const Icon = icons[kind];
  return <div className={styles.benefitsContent}>
    <header className={styles.stepHeading}><span className={styles.scenarioEyebrow}>{story.eyebrow}</span><h1 tabIndex={-1}>{story.title}</h1><p>{story.description}</p></header>
    <Card className={styles.benefitsPreview}>
      <div className={styles.benefitsTopbar}><div className={styles.benefitsBrand}><span>VX</span><div><strong>VX House</strong><small>{content.space}</small></div></div><span className={styles.benefitsStatus}><BadgeCheck aria-hidden="true" />{content.controlled}</span></div>
      <div className={styles.benefitsDashboard}>
        <article className={styles.benefitFeatured}><div className={styles.benefitFeaturedIcon}><Icon aria-hidden="true" /></div><div><span>{story.eyebrow}</span><h2>{story.title}</h2><p>{story.description}</p></div></article>
        <div className={styles.benefitsList}>{story.items.map((item, index) => <article key={item} className={styles.benefitRow}><span className={styles.benefitRowIcon}>{kind === "rewards" ? <Sparkles aria-hidden="true" /> : index === 0 ? <BadgeCheck aria-hidden="true" /> : <Icon aria-hidden="true" />}</span><div><h2>{item}</h2><p>{index === 0 ? content.firstHint : content.statusHint}</p></div><ArrowRight aria-hidden="true" /></article>)}</div>
      </div>
    </Card>
    <div className={styles.benefitsActions}><Button type="button" size="lg" onClick={onContinue}>{t("common.continue")}<ArrowRight aria-hidden="true" /></Button><button type="button" className={styles.stepBackButton} onClick={onBack}><ArrowLeft aria-hidden="true" />{t("common.back")}</button></div>
  </div>;
}
