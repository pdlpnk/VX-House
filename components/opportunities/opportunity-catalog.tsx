"use client";

import { ArrowRight, Compass, Info, MapPin, Search, UserRound } from "lucide-react";
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
const roleLabels = { PLAYER: "Игрок", PARTNER: "Партнёр" } as const;
const copy = { PLAYER: { eyebrow: "Кабинет игрока", description: "Опубликованные возможности для вашей роли и рынка.", backHref: "/dashboard" }, PARTNER: { eyebrow: "Партнёрское пространство", description: "Рабочие возможности, доступные подтверждённому партнёрскому профилю.", backHref: "/partner" } } as const;

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
        if (!response.ok) throw new Error(body.message ?? "Не удалось обновить каталог");
        setItems(body.items ?? []);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Не удалось обновить каталог"); }
      finally { if (!controller.signal.aborted) setPending(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, type]);

  const texts = copy[role];
  return <DashboardPage>
    <DashboardHeading eyebrow={texts.eyebrow} title="Возможности" description={texts.description} action={<StatusPill tone="brand">Серверный каталог</StatusPill>} />
    <section className={styles.opportunityCatalogIntro}><span><Compass aria-hidden="true" /></span><div><small>Персональная выборка</small><h2>Понятно, что доступно и что делать дальше</h2><p>Роль, рынок, публикация и индивидуальная доступность проверяются сервером.</p></div></section>
    <div className={styles.opportunityFilters} role="search" aria-label="Поиск и фильтрация возможностей">
      <label><span>Поиск</span><div className={styles.inputWrap}><Search aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или описание" /></div></label>
      <label><span>Тип</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="">Все типы</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <StatusPill tone={pending ? "attention" : "neutral"}>{pending ? "Обновляем…" : `${items.length} найдено`}</StatusPill>
    </div>
    {error ? <p className={styles.systemDisclosure} role="alert"><Info aria-hidden="true" />{error}</p> : null}
    {items.length ? <DashboardGrid className={styles.opportunityList}>{items.map((item) => <DashboardGridItem key={item.id}><Card className={styles.opportunityCard}>
      <div className={styles.opportunityCardTopline}><span>{typeLabels[item.type]}</span><OpportunityStatusBadge status={item.availability} /></div>
      <div className={styles.opportunityCardCopy}><small>{item.market.name}</small><h2>{item.title}</h2><p>{item.description}</p></div>
      <dl className={styles.opportunityMeta}><div><dt><UserRound aria-hidden="true" /> Роль</dt><dd>{roleLabels[item.role]}</dd></div><div><dt><MapPin aria-hidden="true" /> Рынок</dt><dd>{item.market.name}</dd></div></dl>
      <div className={styles.opportunityNextStep}><span>Следующий шаг</span><p>{item.nextStep}</p></div>
      <Link className={cn(buttonVariants({ variant: "outline" }), styles.opportunityDetailsLink)} href={`${basePath}/${item.id}`}>Открыть карточку <ArrowRight aria-hidden="true" /></Link>
    </Card></DashboardGridItem>)}</DashboardGrid> : <Card className={styles.noDataPanel}><Compass aria-hidden="true" /><h2>Доступных возможностей пока нет</h2><p>Измените фильтр или вернитесь позже. Черновики и архивные публикации не показываются.</p></Card>}
    <p className={styles.systemDisclosure}><Info aria-hidden="true" /> Доступность формируется сервером; экономические последствия в этом модуле не подключены.</p>
    <Link className={styles.pageBackLink} href={texts.backHref}>Вернуться к обзору</Link>
  </DashboardPage>;
}
