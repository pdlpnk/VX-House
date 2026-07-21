"use client";

import { ArrowLeft, CircleDot, History, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

export function DashboardActivityPage() {
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Прозрачная хронология"
        title="Активность"
        description="Здесь будут объясняться все изменения ранга, VX Points, Trust Score и статусов пользователя."
        action={<StatusPill tone="neutral">0 событий</StatusPill>}
      />

      <section className={styles.activityEmpty} aria-labelledby="activity-empty-title">
        <div className={styles.emptyStateIcon}><History aria-hidden="true" /></div>
        <small>Пустое состояние</small>
        <h2 id="activity-empty-title">История пока не началась</h2>
        <p>В кабинете нет подтверждённых пользовательских событий. После подключения серверных данных каждое изменение будет иметь дату, причину и статус.</p>
        <ul>
          <li><CircleDot aria-hidden="true" /> Изменения VX Points</li>
          <li><CircleDot aria-hidden="true" /> Изменения Trust Score</li>
          <li><CircleDot aria-hidden="true" /> Переходы между рангами</li>
          <li><CircleDot aria-hidden="true" /> Статусы заданий и VX Rewards</li>
        </ul>
        <div className={styles.emptyDisclosure}><ShieldCheck aria-hidden="true" /><span>Демонстрационные события не создаются, чтобы не имитировать реальную активность.</span></div>
        <Link className={styles.pageBackLink} href="/dashboard"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link>
      </section>
    </DashboardPage>
  );
}
