"use client";

import { ArrowLeft, BadgeCheck, BookOpenCheck, CalendarClock, MapPin, ShieldCheck, Tag, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OpportunityView } from "@/lib/opportunities/types";

const roleLabels = { PLAYER: "Игрок", PARTNER: "Партнёр" } as const;
const typeLabels = { TASK: "Задание", INSTRUCTION: "Инструкция", PROMOCODE: "Промокод", FORECAST: "Прогноз", PERSONAL_CONDITION: "Персональное условие" } as const;

export function OpportunityDetail({ opportunity, basePath, taskBasePath }: { opportunity: OpportunityView | null; basePath: string; taskBasePath: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!opportunity) return <DashboardPage><DashboardHeading eyebrow="Возможности" title="Нет данных" description="Карточка не найдена или недоступна для вашего профиля." action={<OpportunityStatusBadge status="NO_DATA" />} /><Card className={styles.noDataPanel}><ShieldCheck aria-hidden="true" /><h2>Возможность недоступна</h2><p>Сервер учитывает роль, рынок, публикацию и архивный статус.</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> Вернуться к возможностям</Link></DashboardPage>;

  async function accept() {
    setPending(true); setError(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunity!.id}/accept`, { method: "POST", credentials: "same-origin", headers: { "Idempotency-Key": crypto.randomUUID() } });
      const body = await response.json() as { id?: string; message?: string };
      if (!response.ok || !body.id) throw new Error(body.message ?? "Не удалось начать задание");
      window.location.assign(`${taskBasePath}/${body.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось начать задание"); setPending(false); }
  }

  const instruction = opportunity.task?.instruction ?? opportunity.instruction;
  return <DashboardPage>
    <DashboardHeading eyebrow="Карточка возможности" title={opportunity.title} description={opportunity.description} action={<OpportunityStatusBadge status={opportunity.availability} />} />
    <section className={styles.opportunityDetailHero}><div><span>Серверная доступность</span><h2>{opportunity.nextStep}</h2><p>{opportunity.availabilityReason}</p></div><Button onClick={accept} disabled={pending || opportunity.availability !== "AVAILABLE" || !opportunity.task}>{pending ? "Подготавливаем…" : "Принять участие"}</Button></section>
    {error ? <p className={styles.systemDisclosure} role="alert">{error}</p> : null}
    <DashboardGrid className={styles.opportunityDetailGrid}>
      <DashboardGridItem className={styles.opportunityFactsItem}><DashboardCard label="Параметры" title="Область применения" icon={Tag}><dl className={styles.opportunityFacts}><div><dt><UserRound aria-hidden="true" /> Роль</dt><dd>{roleLabels[opportunity.role]}</dd></div><div><dt><MapPin aria-hidden="true" /> Рынок</dt><dd>{opportunity.market.name}</dd></div><div><dt><Tag aria-hidden="true" /> Тип</dt><dd>{typeLabels[opportunity.type]}</dd></div><div><dt><BadgeCheck aria-hidden="true" /> Статус</dt><dd><OpportunityStatusBadge status={opportunity.availability} /></dd></div></dl></DashboardCard></DashboardGridItem>
      <DashboardGridItem className={styles.opportunityNextItem}><DashboardCard label="Условия" title="Актуальная версия" icon={CalendarClock}><p className={styles.detailLead}>{opportunity.task ? `Задание, версия ${opportunity.task.version}` : "Отдельное задание не предусмотрено"}</p><p className={styles.detailHint}>{opportunity.task?.availableUntil ? `Доступно до ${new Date(opportunity.task.availableUntil).toLocaleDateString("ru-RU")}` : "Срок доступности не ограничен опубликованной версией."}</p></DashboardCard></DashboardGridItem>
    </DashboardGrid>
    {opportunity.task ? <DashboardGrid className={styles.futureSlotsGrid}><DashboardGridItem><RequirementCard title="Требования" items={opportunity.task.requirements} /></DashboardGridItem><DashboardGridItem><RequirementCard title="Ограничения" items={opportunity.task.limitations} /></DashboardGridItem></DashboardGrid> : null}
    <Card className={styles.futureSlot}><div><span><BookOpenCheck aria-hidden="true" /></span><StatusPill tone={instruction ? "success" : "neutral"}>{instruction ? `Версия ${instruction.version}` : "Нет данных"}</StatusPill></div><h2>{instruction?.title ?? "Инструкция"}</h2><p>{instruction?.summary ?? "Для этой возможности опубликованная инструкция пока не предусмотрена."}</p>{instruction?.sections.map((section) => <section key={section.id} className={styles.opportunityNextStep}><span>{section.title}</span><p>{section.body}</p></section>)}{instruction?.steps.map((step) => <div key={step.id} className={styles.opportunityNextStep}><span>{step.position}. {step.title}</span><p>{step.body}</p></div>)}</Card>
    <div className={styles.detailActions}><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> Вернуться к возможностям</Link></div>
  </DashboardPage>;
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  return <Card className={styles.futureSlot}><h2>{title}</h2>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Дополнительные условия не указаны.</p>}</Card>;
}
