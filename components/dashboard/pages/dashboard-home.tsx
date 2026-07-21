"use client";

import {
  ArrowRight,
  Award,
  Bell,
  CircleGauge,
  ClipboardList,
  Coins,
  History,
  Inbox,
  LockKeyhole,
  Route,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import {
  DashboardCard,
  DashboardGrid,
  DashboardGridItem,
  DashboardHeading,
  DashboardPage,
  StatusPill,
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";

const preparedSections = [
  {
    title: "Задания",
    description: "Здесь появятся доступные действия после подключения продуктовых данных.",
    icon: ClipboardList,
    href: "/dashboard/opportunities",
  },
  {
    title: "VX Rewards",
    description: "Здесь будут отображаться только подтверждённые награды и их статусы.",
    icon: Award,
    href: "/dashboard/opportunities",
  },
  {
    title: "История",
    description: "Изменения Points, Trust и ранга будут собраны в прозрачной хронологии.",
    icon: History,
    href: "/dashboard/economy/history",
  },
  {
    title: "Уведомления",
    description: "Важные обновления появятся после подключения серверных событий.",
    icon: Bell,
    href: "/dashboard",
  },
] as const;

export function DashboardHome() {
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Кабинет игрока"
        title="Обзор прогресса"
        description="Спокойная точка входа в ваш будущий путь внутри VX House. Сейчас интерфейс работает только с демонстрационной конфигурацией."
        action={<StatusPill tone="neutral">Демо-режим</StatusPill>}
      />

      <DashboardGrid className={styles.homeGrid}>
        <DashboardGridItem className={styles.heroGridItem}>
          <section className={styles.playerHero}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}><Route aria-hidden="true" /> Рекомендуемый следующий шаг</span>
              <h2>Завершить получение доступа</h2>
              <p>Когда безопасный вход будет подключён, этот шаг свяжет подтверждённый профиль с кабинетом игрока. Сейчас данные не отправляются на сервер.</p>
              <Button asChild size="lg"><Link href="/access">Открыть получение доступа <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <div className={styles.heroStatus} aria-label="Состояние демонстрационного кабинета">
              <div><span>Профиль</span><strong>Не создан</strong></div>
              <div><span>Источник данных</span><strong>Демо-конфигурация</strong></div>
              <div><span>Синхронизация</span><strong>Не подключена</strong></div>
            </div>
          </section>
        </DashboardGridItem>

        <DashboardGridItem className={styles.rankGridItem}>
          <DashboardCard icon={ShieldCheck} label="Статус данных" title="Текущий ранг" action={<StatusPill tone="neutral">Не определён</StatusPill>}>
            <strong className={styles.metricValue}>Нет данных</strong>
            <p className={styles.metricCaption}>Ранг появится только после подключения подтверждённых критериев.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.trustGridItem}>
          <DashboardCard icon={CircleGauge} label="Статус данных" title="Trust Score" action={<StatusPill tone="neutral">Не рассчитан</StatusPill>}>
            <strong className={styles.metricValue}>Нет данных</strong>
            <p className={styles.metricCaption}>Показатель не рассчитывается без подтверждённой истории событий.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.pointsGridItem}>
          <DashboardCard icon={Coins} label="Статус данных" title="VX Points" action={<StatusPill tone="neutral">Не начислены</StatusPill>}>
            <strong className={styles.metricValue}>Нет данных</strong>
            <p className={styles.metricCaption}>VX Points не являются деньгами и не имитируются без подтверждённых действий.</p>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.progressGridItem}>
          <DashboardCard icon={Route} label="Путь участника" title="Прогресс до следующего ранга" action={<StatusPill tone="neutral">Нет данных</StatusPill>}>
            <div className={styles.rankProgress}>
              <div><span>Подтверждённые критерии</span><strong>Не подключены</strong></div>
              <div className={styles.progressTrack} aria-label="Прогресс не рассчитан"><i style={{ width: 0 }} /></div>
              <p>После подключения данных здесь отдельно появятся выполненные и оставшиеся условия, без скрытого пересчёта в один процент.</p>
            </div>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.statsGridItem}>
          <DashboardCard icon={Inbox} label="Краткая статистика" title="Реальных данных пока нет">
            <dl className={styles.emptyStats}>
              <div><dt>Завершённые задания</dt><dd>Нет данных</dd></div>
              <div><dt>Подтверждённые Rewards</dt><dd>Нет данных</dd></div>
              <div><dt>Дни активности</dt><dd>Не рассчитываются</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.preparedGridItem}>
          <DashboardCard icon={LockKeyhole} label="Подготовленная структура" title="Следующие разделы продукта">
            <div className={styles.preparedSections}>
              {preparedSections.map(({ title, description, icon: Icon, href }) => (
                <Link key={title} href={href}>
                  <span><Icon aria-hidden="true" /></span>
                  <div><strong>{title}</strong><p>{description}</p></div>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
    </DashboardPage>
  );
}
