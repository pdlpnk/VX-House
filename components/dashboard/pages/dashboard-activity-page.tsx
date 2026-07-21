"use client";

import { Activity, BadgeCheck, CircleHelp, Filter, History, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";

type ActivityFilter = "all" | "profile" | "opportunity" | "support";

const playerEvents = [
  { type: "profile", date: "21 июля 2026", time: "10:24", title: "Профиль пространства подготовлен", description: "Основные данные сохранены, сценарий игрока подключён.", status: "Завершено", icon: UserRound },
  { type: "opportunity", date: "20 июля 2026", time: "18:40", title: "Уровень «Прайм» подтверждён", description: "Статус участника и связанные возможности доступны в кабинете.", status: "Обновлено", icon: BadgeCheck },
  { type: "opportunity", date: "18 июля 2026", time: "12:15", title: "Персональные условия обновлены", description: "В каталоге появилась актуальная версия условий демонстрационного профиля.", status: "Новое", icon: Sparkles },
  { type: "support", date: "17 июля 2026", time: "16:05", title: "Поддержка подключена", description: "Канал сопровождения и демонстрационная история обращений готовы.", status: "Доступно", icon: CircleHelp },
  { type: "profile", date: "15 июля 2026", time: "09:30", title: "Пространство VX House создано", description: "Начальная конфигурация личного кабинета завершена.", status: "Завершено", icon: ShieldCheck },
] as const;

const partnerEvents = [
  { type: "profile", date: "21 июля 2026", time: "10:24", title: "Партнёрский профиль подготовлен", description: "Основные данные сохранены, сценарий партнёра подключён.", status: "Завершено", icon: UserRound },
  { type: "opportunity", date: "20 июля 2026", time: "16:10", title: "Условия сотрудничества обновлены", description: "Добавлен актуальный формат взаимодействия для ознакомления.", status: "Обновлено", icon: Sparkles },
  { type: "opportunity", date: "18 июля 2026", time: "11:35", title: "Этап взаимодействия подтверждён", description: "Текущий этап изменён на «Согласование условий».", status: "Активно", icon: Activity },
  { type: "support", date: "17 июля 2026", time: "15:20", title: "Партнёрская поддержка подключена", description: "Раздел сопровождения готов для демонстрационных обращений.", status: "Доступно", icon: CircleHelp },
  { type: "profile", date: "15 июля 2026", time: "09:30", title: "Партнёрское пространство создано", description: "Начальная конфигурация кабинета завершена.", status: "Завершено", icon: ShieldCheck },
] as const;

const filters: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "Все события" },
  { value: "profile", label: "Профиль" },
  { value: "opportunity", label: "Возможности" },
  { value: "support", label: "Поддержка" },
];

export function DashboardActivityPage() {
  const { profile } = useDashboard();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const events = profile.role === "partner" ? partnerEvents : playerEvents;
  const visibleEvents = filter === "all" ? events : events.filter((event) => event.type === filter);

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Хронология пространства"
        title="Активность"
        description="Все важные изменения профиля, возможностей и поддержки в одном последовательном списке."
        action={<StatusPill tone="neutral">{events.length} событий</StatusPill>}
      />

      <div className={styles.activityToolbar}>
        <span><Filter aria-hidden="true" /> Показать</span>
        <div role="group" aria-label="Фильтр активности">
          {filters.map(({ value, label }) => <button key={value} type="button" data-active={filter === value || undefined} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
      </div>

      <section className={styles.activityTimeline} aria-label="История активности">
        {visibleEvents.map(({ date, time, title, description, status, icon: Icon }, index) => (
          <article key={title} className={styles.activityEvent}>
            <div className={styles.activityDate}><strong>{date}</strong><small>{time}</small></div>
            <div className={styles.activityMarker}><span><Icon aria-hidden="true" /></span>{index < visibleEvents.length - 1 && <i />}</div>
            <div className={styles.activityEventCard}>
              <div><h2>{title}</h2><StatusPill tone={status === "Новое" ? "brand" : "success"}>{status}</StatusPill></div>
              <p>{description}</p>
            </div>
          </article>
        ))}
        {visibleEvents.length === 0 && <div className={styles.emptyState}><History aria-hidden="true" /><h2>Событий пока нет</h2><p>Здесь появятся изменения выбранного типа.</p></div>}
      </section>
    </DashboardPage>
  );
}
