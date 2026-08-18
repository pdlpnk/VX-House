import { motion } from "framer-motion";
import { Check, Clock3, KeyRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/access/access.module.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AccessCountry, AccessScenario } from "@/lib/access-types";
import type { Locale } from "@/lib/i18n";
import { accessContent } from "@/lib/i18n/access-content";
import { localeNames } from "@/lib/i18n";

type AccessCompleteStepProps = {
  scenario: AccessScenario;
  country: AccessCountry;
  language: Locale;
  name: string;
  onRestart: () => void;
  destination: "/dashboard/opportunities" | "/partner/opportunities";
  partnerApprovalPending?: boolean;
  reducedMotion: boolean;
};

export function AccessCompleteStep({ scenario, country, language, name, onRestart, destination, partnerApprovalPending, reducedMotion }: AccessCompleteStepProps) {
  const { locale } = useI18n();
  const content = accessContent[locale];
  const copy = content.complete;
  const displayedName = name.trim() ? `, ${name.trim()}` : "";
  return (
    <div className={styles.completeContent}>
      <motion.div className={styles.completeMark} initial={reducedMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}><Check aria-hidden="true" /></motion.div>
      <span className={styles.completeEyebrow}>{copy.eyebrow}</span>
      <h1 tabIndex={-1}>{copy.thanks.replace("{name}", displayedName)}</h1>
      <p className={styles.completeLead}>{partnerApprovalPending ? copy.partnerLead : copy.playerLead}</p>

      <div className={styles.completeGrid}>
        <Card className={styles.completeSummary}>
          <h2>{copy.summary}</h2>
          <dl><div><dt>{copy.role}</dt><dd>{content.labels[scenario]}</dd></div><div><dt>{copy.country}</dt><dd>{content.labels[country]}</dd></div><div><dt>{copy.language}</dt><dd>{localeNames[language]}</dd></div></dl>
        </Card>
        <Card className={styles.nextStepCard}>
          <KeyRound aria-hidden="true" />
          <span>{copy.next}</span>
          <h2>{partnerApprovalPending ? copy.partnerTitle : copy.playerTitle}</h2>
          <p>{partnerApprovalPending ? copy.partnerText : copy.playerText}</p>
          <small><Clock3 aria-hidden="true" /> {copy.updates}</small>
        </Card>
      </div>

      <div className={styles.completeActions}>
        <Button asChild size="lg"><Link href={destination}>{copy.tasks}</Link></Button>
        <button type="button" className={styles.stepBackButton} onClick={onRestart}>{copy.restart}</button>
      </div>
    </div>
  );
}
