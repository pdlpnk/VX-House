"use client";

import { ArrowLeft, CircleDot, History, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

export function PartnerHistoryPage() {
  return (
    <DashboardPage>
      <DashboardHeading eyebrow="Прозрачная хронология" title="История сотрудничества" description="Будущая история будет показывать, что произошло, когда, почему и какое действие требуется дальше." action={<StatusPill tone="neutral">0 событий</StatusPill>} />
      <section className={styles.activityEmpty} aria-labelledby="partner-history-empty-title">
        <div className={styles.emptyStateIcon}><History aria-hidden="true" /></div>
        <small>Пустое состояние</small>
        <h2 id="partner-history-empty-title">Подтверждённых событий пока нет</h2>
        <p>История не заполняется демонстрационными успехами. После подключения сервиса здесь появятся только проверяемые изменения партнёрского профиля.</p>
        <ul>
          <li><CircleDot aria-hidden="true" /> Изменения статуса сотрудничества</li>
          <li><CircleDot aria-hidden="true" /> Назначение и проверка задач</li>
          <li><CircleDot aria-hidden="true" /> Получение материалов и промокодов</li>
          <li><CircleDot aria-hidden="true" /> Подтверждённые результаты и VX Rewards</li>
        </ul>
        <div className={styles.emptyDisclosure}><ShieldCheck aria-hidden="true" /><span>Деньги, VX Points, Trust Score и VX Rewards не объединяются и получат отдельные основания изменений.</span></div>
        <Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link>
      </section>
    </DashboardPage>
  );
}
