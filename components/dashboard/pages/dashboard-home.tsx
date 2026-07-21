"use client";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CircleHelp,
  Crown,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import {
  DashboardCard,
  DashboardGrid,
  DashboardGridItem,
  DashboardHeading,
  DashboardPage,
  StatusPill,
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { roleShortLabel } from "@/lib/dashboard-data";

const playerActivity = [
  ["Профиль пространства подготовлен", "сегодня, 10:24"],
  ["Уровень «Прайм» подтверждён", "вчера, 18:40"],
  ["Персональные условия обновлены", "18 июля, 12:15"],
] as const;

const partnerActivity = [
  ["Партнёрский профиль подготовлен", "сегодня, 10:24"],
  ["Условия сотрудничества обновлены", "вчера, 16:10"],
  ["Этап взаимодействия подтверждён", "18 июля, 11:35"],
] as const;

export function DashboardHome() {
  const { profile } = useDashboard();
  const isPartner = profile.role === "partner";
  const activity = isPartner ? partnerActivity : playerActivity;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Обзор пространства"
        title={`Добро пожаловать, ${profile.name}`}
        description={isPartner
          ? "Партнёрское пространство: актуальный статус, условия и следующие действия."
          : "Ваше пространство готово к работе. Здесь собраны статус, условия и поддержка."}
        action={<StatusPill tone="brand">{roleShortLabel(profile.role)}</StatusPill>}
      />

      <DashboardGrid className={styles.homeGrid}>
        <DashboardGridItem className={styles.welcomeGridItem}>
          <section className={styles.welcomeCard}>
            <div className={styles.welcomeGlow} aria-hidden="true" />
            <div className={styles.welcomeCopy}>
              <span><ShieldCheck aria-hidden="true" /> Приватное пространство активно</span>
              <h2>{isPartner ? "Сотрудничество под контролем" : "Главное — в одном кабинете"}</h2>
              <p>{isPartner
                ? "Следите за этапом взаимодействия, условиями и запросами команды VX House."
                : "Проверяйте персональные условия, уровень и важные изменения без лишнего шума."}</p>
            </div>
            <div className={styles.welcomeMetric}>
              <small>{isPartner ? "Текущий этап" : "Статус участника"}</small>
              <strong>{isPartner ? "Согласование условий" : "Прайм"}</strong>
              <span><i /> Обновлено сегодня</span>
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem className={styles.statusGridItem}>
          <DashboardCard
            icon={BadgeCheck}
            label="Текущий статус"
            title={isPartner ? "Сотрудничество активно" : "Профиль активен"}
            action={<StatusPill tone="success">Подтверждено</StatusPill>}
          >
            <p className={styles.cardLead}>{isPartner
              ? "Основные данные приняты. Текущий этап — ознакомление с условиями сотрудничества."
              : "Профиль подготовлен. Базовые возможности и персональное сопровождение доступны."}</p>
            <div className={styles.statusMeta}>
              <span><CalendarClock aria-hidden="true" /> Изменено сегодня, 10:24</span>
              <Link href="/dashboard/profile">Подробнее <ArrowRight aria-hidden="true" /></Link>
            </div>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.recommendationGridItem}>
          <DashboardCard
            icon={ArrowRight}
            label="Рекомендуемое действие"
            title={isPartner ? "Ознакомьтесь с условиями" : "Проверьте новые возможности"}
            className={styles.recommendationCard}
          >
            <p className={styles.cardLead}>{isPartner
              ? "Условия обновлены и готовы к просмотру. После ознакомления статус изменится автоматически."
              : "Для вашего профиля доступны обновлённые условия и преимущества уровня «Прайм»."}</p>
            <Button asChild size="lg" className={styles.cardPrimaryAction}>
              <Link href="/dashboard/opportunities">
                {isPartner ? "Посмотреть условия" : "Посмотреть возможности"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.opportunitiesGridItem}>
          <DashboardCard
            icon={Sparkles}
            label="Возможности"
            title={isPartner ? "Условия сотрудничества" : "Персональные условия"}
            action={<Link className={styles.cardTextAction} href="/dashboard/opportunities">Все возможности</Link>}
          >
            <div className={styles.opportunityPreview}>
              <div><span><Check aria-hidden="true" /></span><div><strong>{isPartner ? "Партнёрский кабинет" : "Персональное пространство"}</strong><small>Доступно сейчас</small></div></div>
              <div><span><Check aria-hidden="true" /></span><div><strong>{isPartner ? "Прямая связь с командой" : "Приоритетное сопровождение"}</strong><small>Канал подключён</small></div></div>
              <div><span><Check aria-hidden="true" /></span><div><strong>{isPartner ? "История взаимодействия" : "История изменений"}</strong><small>Данные обновлены</small></div></div>
            </div>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.levelGridItem}>
          <DashboardCard icon={Crown} label={isPartner ? "Статус партнёра" : "Уровень участника"} title={isPartner ? "Активный партнёр" : "Прайм"}>
            <div className={styles.levelVisual}>
              <div><span>{isPartner ? "VX" : "P"}</span></div>
              <p>{isPartner
                ? "Партнёрский сценарий подключён. Условия и поддержка доступны в полном объёме."
                : "Уровень подтверждён. Персональные условия и приоритетная поддержка активны."}</p>
            </div>
            <Link className={styles.inlineLink} href="/dashboard/opportunities">Что означает статус <ArrowRight aria-hidden="true" /></Link>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.activityGridItem}>
          <DashboardCard icon={Activity} label="История активности" title="Последние события" action={<Link className={styles.cardTextAction} href="/dashboard/activity">Вся активность</Link>}>
            <ul className={styles.compactTimeline}>
              {activity.map(([title, date]) => <li key={title}><i /><div><strong>{title}</strong><small>{date}</small></div></li>)}
            </ul>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.supportGridItem}>
          <DashboardCard icon={CircleHelp} label="Поддержка" title={isPartner ? "Партнёрская команда на связи" : "Сопровождение доступно"} action={<StatusPill tone="success">Доступна</StatusPill>}>
            <p className={styles.cardLead}>{isPartner
              ? "Вопросы сотрудничества и статусов собраны в одном разделе."
              : "Получите помощь по профилю, условиям и возможностям пространства."}</p>
            <Button asChild variant="outline" className={styles.cardSecondaryAction}><Link href="/dashboard/support">Открыть поддержку</Link></Button>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.updateGridItem}>
          <DashboardCard icon={UserRound} label="Последнее изменение" title={isPartner ? "Обновлены условия" : "Профиль синхронизирован"}>
            <div className={styles.lastUpdate}>
              <span>21</span>
              <div><strong>Июля 2026</strong><p>{isPartner ? "Добавлен новый формат взаимодействия и уточнён текущий этап." : "Подтверждён уровень участника и обновлены персональные условия."}</p></div>
            </div>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
    </DashboardPage>
  );
}
