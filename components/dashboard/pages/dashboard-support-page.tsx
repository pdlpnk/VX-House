"use client";

import { ArrowRight, Check, ChevronDown, CircleHelp, Clock3, Headphones, MessageSquareText, ShieldCheck } from "lucide-react";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardCard, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";

const playerFaq = [
  ["Как обновляются персональные условия?", "В демонстрационной версии условия меняются вместе с локальным профилем и выбранной ролью."],
  ["Где посмотреть уровень участника?", "Текущий уровень виден на главной и в разделе «Возможности»."],
  ["Как изменить данные профиля?", "Откройте раздел «Профиль», внесите изменения и нажмите «Сохранить»."],
] as const;

const partnerFaq = [
  ["Где отображается этап сотрудничества?", "Текущий этап виден на главной, а его изменения — в разделе «Активность»."],
  ["Как посмотреть условия сотрудничества?", "Актуальная демонстрационная версия находится в разделе «Возможности»."],
  ["Как изменить данные представителя?", "Откройте раздел «Профиль», внесите изменения и нажмите «Сохранить»."],
] as const;

export function DashboardSupportPage() {
  const { profile } = useDashboard();
  const [created, setCreated] = useState(false);
  const isPartner = profile.role === "partner";
  const faq = isPartner ? partnerFaq : playerFaq;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={isPartner ? "Партнёрское сопровождение" : "Персональное сопровождение"}
        title="Поддержка"
        description="Помощь по профилю, возможностям и текущему сценарию — в одном разделе."
        action={<StatusPill tone="success">Поддержка доступна</StatusPill>}
      />

      <section className={styles.supportHero}>
        <div className={styles.supportHeroIcon}><Headphones aria-hidden="true" /></div>
        <div><span><i /> Канал доступен</span><h2>{isPartner ? "Команда по работе с партнёрами" : "Команда сопровождения VX House"}</h2><p>{isPartner ? "Вопросы сотрудничества, статусов и условий собраны в едином контексте." : "Получите понятный ответ по профилю, условиям и работе пространства."}</p></div>
        <Button type="button" size="lg" onClick={() => setCreated(true)}>{created ? <Check aria-hidden="true" /> : <MessageSquareText aria-hidden="true" />}{created ? "Обращение создано" : "Создать демо-обращение"}</Button>
      </section>

      {created && <div className={styles.supportNotice} role="status"><ShieldCheck aria-hidden="true" /><div><strong>Демонстрационное обращение создано</strong><p>Оно сохранено только в текущем интерфейсе. Реальная отправка и чат не подключены.</p></div></div>}

      <div className={styles.supportGrid}>
        <DashboardCard icon={Clock3} label="История обращений" title="Последние запросы" action={<StatusPill tone="neutral">2 обращения</StatusPill>}>
          <div className={styles.ticketsList}>
            <article><span>VX-1048</span><div><strong>{isPartner ? "Уточнение текущего этапа" : "Обновление данных профиля"}</strong><small>21 июля, 09:45</small></div><StatusPill tone="success">Закрыто</StatusPill></article>
            <article><span>VX-1031</span><div><strong>{isPartner ? "Вопрос по условиям" : "Вопрос по уровню участника"}</strong><small>18 июля, 14:20</small></div><StatusPill tone="brand">Есть ответ</StatusPill></article>
          </div>
        </DashboardCard>

        <DashboardCard icon={CircleHelp} label="Быстрые темы" title="Частые вопросы">
          <div className={styles.faqList}>
            {faq.map(([question, answer]) => <details key={question}><summary><span>{question}</span><ChevronDown aria-hidden="true" /></summary><p>{answer}</p></details>)}
          </div>
        </DashboardCard>
      </div>

      <div className={styles.demoDisclosure}><ShieldCheck aria-hidden="true" /><div><strong>Демонстрационный режим</strong><p>В первой версии реальные сообщения не отправляются. Все обращения и ответы используются только для демонстрации интерфейса.</p></div><ArrowRight aria-hidden="true" /></div>
    </DashboardPage>
  );
}
