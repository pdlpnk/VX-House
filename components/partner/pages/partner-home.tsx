"use client";

import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  Coins,
  History,
  Inbox,
  Route,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";

const partnerAreas = [
  { title: "Партнёрские задания", description: "Задачи появятся только после назначения и подключения сервиса.", icon: ClipboardList, href: "/partner/opportunities" },
  { title: "Инструкции и материалы", description: "Рабочий контент будет выдаваться согласно роли и рынку.", icon: BookOpenCheck, href: "/partner/materials" },
  { title: "Промокоды", description: "Коды, сроки и правила применения будут показываться отдельно.", icon: TicketPercent, href: "/partner/materials" },
  { title: "Ежедневные прогнозы", description: "Доступ будет зависеть от роли, страны и подтверждённых условий.", icon: ChartNoAxesCombined, href: "/partner/forecasts" },
  { title: "История сотрудничества", description: "Подтверждённые изменения получат дату, причину и статус.", icon: History, href: "/partner/history" },
] as const;

export function PartnerHome() {
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Кабинет партнёра"
        title="Рабочее пространство партнёра"
        description="Будущий центр сотрудничества: следующий шаг, статус, материалы и доступные инструменты без рекламного шума."
        action={<StatusPill tone="neutral">Демо-режим</StatusPill>}
      />

      <DashboardGrid className={styles.homeGrid}>
        <DashboardGridItem className={styles.heroGridItem}>
          <section className={styles.playerHero}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}><Route aria-hidden="true" /> Рекомендуемый следующий шаг</span>
              <h2>Подготовить запрос на партнёрский доступ</h2>
              <p>После подключения авторизации роль и условия сотрудничества смогут пройти проверку. Сейчас профиль не создан, запрос не отправлен и одобрение не подразумевается.</p>
              <Button asChild size="lg"><Link href="/access">Открыть получение доступа <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <div className={styles.heroStatus} aria-label="Состояние демонстрационного партнёрского пространства">
              <div><span>Партнёрский профиль</span><strong>Не создан</strong></div>
              <div><span>Проверка роли</span><strong>Не начата</strong></div>
              <div><span>Статус сотрудничества</span><strong>Не определён</strong></div>
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem className={styles.rankGridItem}>
          <DashboardCard icon={BriefcaseBusiness} label="Статус данных" title="Текущий ранг" action={<StatusPill tone="neutral">Не подключено</StatusPill>}>
            <strong className={styles.metricValue}>Нет данных</strong>
            <p className={styles.metricCaption}>Ранг появится только из подтверждённого источника прогресса.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.trustGridItem}>
          <DashboardCard icon={ShieldCheck} label="Статус данных" title="Trust Score" action={<StatusPill tone="neutral">Не рассчитан</StatusPill>}>
            <strong className={styles.metricValue}>Нет данных</strong>
            <p className={styles.metricCaption}>Показатель доверия не рассчитывается в демонстрационном кабинете.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.pointsGridItem}>
          <DashboardCard icon={Coins} label="Статус данных" title="VX Points" action={<StatusPill tone="neutral">Не начислены</StatusPill>}>
            <strong className={styles.metricValue}>Нет данных</strong>
            <p className={styles.metricCaption}>VX Points не являются деньгами и не имитируются без подтверждённых действий.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.progressGridItem}>
          <DashboardCard icon={BriefcaseBusiness} label="Сотрудничество" title="Статус пока не установлен" action={<StatusPill tone="attention">Ожидает сервиса</StatusPill>}>
            <p className={styles.cardLead}>Когда профиль и правила роли будут подключены, здесь появятся текущий этап, основание статуса и конкретное следующее действие.</p>
            <dl className={styles.profileFacts}>
              <div><dt>Условия сотрудничества</dt><dd>Не назначены</dd></div>
              <div><dt>Требующее внимания действие</dt><dd>Нет данных</dd></div>
              <div><dt>Последнее подтверждённое изменение</dt><dd>Нет данных</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.statsGridItem}>
          <DashboardCard icon={Inbox} label="Краткая статистика" title="Реальных данных пока нет">
            <dl className={styles.emptyStats}>
              <div><dt>Длительность сотрудничества</dt><dd>Не рассчитывается</dd></div>
              <div><dt>Активные задачи</dt><dd>Нет данных</dd></div>
              <div><dt>Завершённые задачи</dt><dd>Нет данных</dd></div>
              <div><dt>Подтверждённые VX Rewards</dt><dd>Нет данных</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.preparedGridItem}>
          <DashboardCard icon={Award} label="Подготовленная структура" title="Разделы партнёрского пространства">
            <div className={styles.preparedSections}>
              {partnerAreas.map(({ title, description, icon: Icon, href }) => (
                <Link key={title} href={href}><span><Icon aria-hidden="true" /></span><div><strong>{title}</strong><p>{description}</p></div><ArrowRight aria-hidden="true" /></Link>
              ))}
            </div>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
    </DashboardPage>
  );
}
