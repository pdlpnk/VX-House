"use client";

import { ArrowLeft, ChartNoAxesCombined, CircleDot, ShieldAlert } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

export function PartnerForecastsPage() {
  return (
    <DashboardPage>
      <DashboardHeading eyebrow="Аналитические материалы" title="Прогнозы" description="Область ежедневных аналитических материалов с объяснимыми правилами доступа и обязательными ограничениями." action={<StatusPill tone="attention">Доступ не определён</StatusPill>} />
      <section className={styles.activityEmpty} aria-labelledby="forecasts-empty-title">
        <div className={styles.emptyStateIcon}><ChartNoAxesCombined aria-hidden="true" /></div>
        <small>Ограниченное состояние</small>
        <h2 id="forecasts-empty-title">Прогнозы пока недоступны</h2>
        <p>Будет доступно после подключения сервиса и проверки применимых условий. Отсутствие доступа не означает ошибку профиля.</p>
        <ul>
          <li><CircleDot aria-hidden="true" /> Подтверждённая роль партнёра</li>
          <li><CircleDot aria-hidden="true" /> Применимый рынок</li>
          <li><CircleDot aria-hidden="true" /> Настроенный уровень доступа</li>
          <li><CircleDot aria-hidden="true" /> Актуальный опубликованный материал</li>
        </ul>
        <div className={styles.emptyDisclosure}><ShieldAlert aria-hidden="true" /><span>Будущие прогнозы не будут гарантировать результат или доход и получат автора, срок актуальности и историю версий.</span></div>
        <Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link>
      </section>
    </DashboardPage>
  );
}
