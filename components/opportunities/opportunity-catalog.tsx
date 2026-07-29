"use client";

import { ArrowRight, Award, Compass, Info, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import type { OpportunityView } from "@/lib/opportunities/types";
import { cn } from "@/lib/utils";

const typeLabels = { TASK: "Задание", INSTRUCTION: "Инструкция", PROMOCODE: "Промокод", FORECAST: "Прогноз", PERSONAL_CONDITION: "Персональное условие" } as const;
const copy = { PLAYER: { eyebrow: "Задания", title: "Доступные задания", description: "Выберите подходящее задание и заранее ознакомьтесь с условиями и наградами." }, PARTNER: { eyebrow: "Партнёрское пространство", title: "Возможности", description: "Доступные рабочие сценарии и материалы." } } as const;

export function OpportunityCatalog({ role, basePath, initialItems }: { role: "PLAYER" | "PARTNER"; basePath: string; initialItems: OpportunityView[] }) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPending(true); setError(null);
      try {
        const params = new URLSearchParams(); if (search.trim()) params.set("search", search.trim()); if (type) params.set("type", type);
        const response = await fetch(`/api/opportunities?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const body = await response.json() as { items?: OpportunityView[]; message?: string };
        if (!response.ok) throw new Error(body.message ?? "Не удалось обновить список заданий");
        setItems(body.items ?? []);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Не удалось обновить список заданий"); }
      finally { if (!controller.signal.aborted) setPending(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, type]);

  const texts = copy[role];
  return <DashboardPage>
    <DashboardHeading eyebrow={texts.eyebrow} title={texts.title} description={texts.description} action={<StatusPill tone="brand">{items.length} доступно</StatusPill>} />
    <section className={styles.opportunityCatalogIntro}><span><Sparkles aria-hidden="true" /></span><div><small>Подобрано для вас</small><h2>Все условия видны до начала</h2><p>Откройте карточку, чтобы узнать порядок действий, сроки и возможную награду.</p></div></section>
    <div className={styles.opportunityFilters} role="search" aria-label="Поиск и фильтрация возможностей">
      <label><span>Поиск</span><div className={styles.inputWrap}><Search aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или описание" /></div></label>
      <label><span>Тип</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="">Все типы</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <StatusPill tone={pending ? "attention" : "neutral"}>{pending ? "Обновляем…" : `${items.length} найдено`}</StatusPill>
    </div>
    {error ? <p className={styles.systemDisclosure} role="alert"><Info aria-hidden="true" />{error}</p> : null}
    {items.length ? <DashboardGrid className={styles.opportunityList}>{items.map((item) => <DashboardGridItem key={item.id}><Card className={styles.opportunityCard}>
      <div className={styles.opportunityCardTopline}><span>{typeLabels[item.type]}</span><OpportunityStatusBadge status={item.availability} /></div>
      <div className={styles.opportunityCardCopy}><small>{item.type === "TASK" ? "Задание VX House" : typeLabels[item.type]}</small><h2>{item.title}</h2><p>{item.description}</p></div>
      {item.task?.possibleRewardDescription ? <div className={styles.opportunityReward}><Award aria-hidden="true" /><div><span>Награда</span><strong>{item.task.possibleRewardDescription}</strong></div></div> : null}
      <div className={styles.opportunityNextStep}><span>Что дальше</span><p>{item.nextStep}</p></div>
      <Link className={cn(buttonVariants({ variant: "outline" }), styles.opportunityDetailsLink)} href={`${basePath}/${item.id}`}>Подробнее <ArrowRight aria-hidden="true" /></Link>
    </Card></DashboardGridItem>)}</DashboardGrid> : <Card className={styles.noDataPanel}><Compass aria-hidden="true" /><h2>Новых заданий пока нет</h2><p>Мы сообщим, когда появится подходящее задание.</p></Card>}
    {error ? null : <p className={styles.catalogHint}><Info aria-hidden="true" />Новые задания появляются автоматически.</p>}
  </DashboardPage>;
}
