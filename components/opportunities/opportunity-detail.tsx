"use client";

import { ArrowLeft, BadgeCheck, BookOpenCheck, CalendarClock, ShieldCheck, Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OpportunityView } from "@/lib/opportunities/types";

const typeLabels = { TASK: "Задание", INSTRUCTION: "Инструкция", PROMOCODE: "Промокод", FORECAST: "Прогноз", PERSONAL_CONDITION: "Персональное условие" } as const;

export function OpportunityDetail({ opportunity, basePath, taskBasePath }: { opportunity: OpportunityView | null; basePath: string; taskBasePath: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!opportunity) return <DashboardPage><DashboardHeading eyebrow="Задания" title="Задание недоступно" description="Возможно, срок задания закончился или оно больше не подходит вашему профилю." action={<OpportunityStatusBadge status="NO_DATA" />} /><Card className={styles.noDataPanel}><ShieldCheck aria-hidden="true" /><h2>Карточка больше не доступна</h2><p>Вернитесь к списку и выберите другое задание.</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> К заданиям</Link></DashboardPage>;

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
    <DashboardHeading eyebrow="Задание" title={opportunity.title} description={opportunity.description} action={<OpportunityStatusBadge status={opportunity.availability} />} />
    <section className={styles.opportunityDetailHero}><div><span>Следующий шаг</span><h2>{opportunity.nextStep}</h2><p>{opportunity.availability === "AVAILABLE" ? "Задание доступно вашему профилю." : opportunity.availabilityReason}</p></div><Button onClick={accept} disabled={pending || opportunity.availability !== "AVAILABLE" || !opportunity.task}>{pending ? "Открываем…" : "Начать задание"}</Button></section>
    {error ? <p className={styles.systemDisclosure} role="alert">{error}</p> : null}
    <DashboardGrid className={styles.opportunityDetailGrid}>
      <DashboardGridItem className={styles.opportunityFactsItem}><DashboardCard label="Коротко" title="О задании" icon={Tag}><dl className={styles.opportunityFacts}><div><dt><Tag aria-hidden="true" /> Формат</dt><dd>{typeLabels[opportunity.type]}</dd></div><div><dt><BadgeCheck aria-hidden="true" /> Статус</dt><dd><OpportunityStatusBadge status={opportunity.availability} /></dd></div></dl></DashboardCard></DashboardGridItem>
      <DashboardGridItem className={styles.opportunityNextItem}><DashboardCard label="Срок выполнения" title="Когда можно участвовать" icon={CalendarClock}><p className={styles.detailLead}>{opportunity.task?.availableUntil ? `До ${new Date(opportunity.task.availableUntil).toLocaleDateString("ru-RU")}` : "Без ограничения по сроку"}</p><p className={styles.detailHint}>Все важные условия указаны ниже.</p></DashboardCard></DashboardGridItem>
    </DashboardGrid>
    {opportunity.task ? <DashboardGrid className={styles.futureSlotsGrid}><DashboardGridItem><RequirementCard title="Требования" items={opportunity.task.requirements} /></DashboardGridItem><DashboardGridItem><RequirementCard title="Ограничения" items={opportunity.task.limitations} /></DashboardGridItem>{opportunity.task.possibleRewardDescription ? <DashboardGridItem><RequirementCard title="Награда" items={[opportunity.task.possibleRewardDescription]} /></DashboardGridItem> : null}</DashboardGrid> : null}
    <Card className={styles.futureSlot}><div><span><BookOpenCheck aria-hidden="true" /></span><StatusPill tone={instruction ? "success" : "neutral"}>{instruction ? "Готова" : "Нет данных"}</StatusPill></div><h2>{instruction?.title ?? "Инструкция"}</h2><p>{instruction?.summary ?? "Инструкция для этого задания пока не предусмотрена."}</p>{instruction?.sections.map((section) => <section key={section.id} className={styles.opportunityNextStep}><span>{section.title}</span><p>{section.body}</p></section>)}{instruction?.steps.map((step) => <div key={step.id} className={styles.opportunityNextStep}><span>{step.position}. {step.title}</span><p>{step.body}</p></div>)}</Card>
    <div className={styles.detailActions}><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> К заданиям</Link></div>
  </DashboardPage>;
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  return <Card className={styles.futureSlot}><h2>{title}</h2>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Дополнительные условия не указаны.</p>}</Card>;
}
