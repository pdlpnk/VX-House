import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock3, KeyRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/access/access.module.css";
import type { AccessScenario } from "@/components/access/access-scenario-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccessCountry, AccessLanguage } from "@/lib/access-draft";

type AccessCompleteStepProps = {
  scenario: AccessScenario;
  country: AccessCountry;
  language: AccessLanguage;
  name: string;
  onRestart: () => void;
  reducedMotion: boolean;
};

const roleLabels: Record<AccessScenario, string> = { player: "Игрок", partner: "Партнёр" };
const countryLabels: Record<AccessCountry, string> = { turkey: "Турция", azerbaijan: "Азербайджан" };
const languageLabels: Record<AccessLanguage, string> = { ru: "Русский", tr: "Türkçe", az: "Azərbaycan dili" };

export function AccessCompleteStep({ scenario, country, language, name, onRestart, reducedMotion }: AccessCompleteStepProps) {
  return (
    <div className={styles.completeContent}>
      <motion.div className={styles.completeMark} initial={reducedMotion ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}><Check aria-hidden="true" /></motion.div>
      <span className={styles.completeEyebrow}>Знакомство завершено</span>
      <h1 tabIndex={-1}>Спасибо{ name.trim() ? `, ${name.trim()}` : ""}.</h1>
      <p className={styles.completeLead}>Ваш выбор подготовлен, но аккаунт ещё не создан и доступ не активирован.</p>

      <div className={styles.completeGrid}>
        <Card className={styles.completeSummary}>
          <h2>Выбранный сценарий</h2>
          <dl><div><dt>Роль</dt><dd>{roleLabels[scenario]}</dd></div><div><dt>Страна</dt><dd>{countryLabels[country]}</dd></div><div><dt>Язык</dt><dd>{languageLabels[language]}</dd></div></dl>
        </Card>
        <Card className={styles.nextStepCard}>
          <KeyRound aria-hidden="true" />
          <span>Следующий этап</span>
          <h2>Подтверждение контакта и безопасный вход</h2>
          <p>Когда настоящая авторизация будет подключена, потребуется подтвердить электронную почту. Для партнёра также может понадобиться ручное одобрение роли.</p>
          <small><Clock3 aria-hidden="true" /> Сейчас данные никуда не отправлены.</small>
        </Card>
      </div>

      <div className={styles.completeActions}>
        <Button asChild size="lg"><Link href="/"><ArrowLeft aria-hidden="true" />Вернуться на главную</Link></Button>
        <button type="button" className={styles.stepBackButton} onClick={onRestart}>Начать заново</button>
      </div>
    </div>
  );
}
