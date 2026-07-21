"use client";

import { ArrowRight, CircleHelp, FileSearch, FolderKanban, Gavel, Gift, KeyRound, MessageSquareText, Plus, Search, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { SupportStatusGuide } from "@/components/support/support-status-guide";
import { SupportStatusPill } from "@/components/support/support-status";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyRole } from "@/lib/economy-data";
import { getSupportCategory, getSupportTickets, supportCategories, supportPriorityLabels, type SupportCategoryId } from "@/lib/support-data";
import { cn } from "@/lib/utils";

const categoryIcons: Record<SupportCategoryId, LucideIcon> = {
  access: KeyRound,
  task: FolderKanban,
  review: FileSearch,
  reward: Gift,
  account: Settings,
  appeal: Gavel,
  partnership: ShieldCheck,
};

export function SupportCenter({ role, basePath }: { role: EconomyRole; basePath: string }) {
  const tickets = getSupportTickets(role);
  const categories = supportCategories.filter((category) => category.roles.includes(role));
  return <DashboardPage>
    <DashboardHeading eyebrow="Центр поддержки" title="Помощь с сохранением контекста" description="Будущий единый канал самообслуживания и диалога. Все обращения и сообщения на экране — только демонстрация интерфейса." action={<StatusPill tone="neutral">Сервис не подключён</StatusPill>} />
    <section className={styles.supportHero} aria-labelledby="support-hero-title"><div><span><CircleHelp aria-hidden="true" /></span><div><small>Сначала — понятный ответ</small><h2 id="support-hero-title">Не нужно пересказывать известные данные</h2><p>После подключения сервиса обращение сможет получить только разрешённый контекст роли, рынка, задания, результата или Reward.</p></div></div><Link className={cn(buttonVariants(), styles.supportNewLink)} href={`${basePath}/new`}><Plus aria-hidden="true" />Новое обращение</Link></section>

    <section className={styles.supportWorkspace} aria-labelledby="support-list-title">
      <div className={styles.supportListColumn}>
        <header><div><span>Демонстрационный список</span><h2 id="support-list-title">Обращения</h2><p>Это примеры композиции, а не реальные запросы пользователя.</p></div><StatusPill tone="neutral">{tickets.length} сценария интерфейса</StatusPill></header>
        <label className={styles.supportSearch}><Search aria-hidden="true" /><span className="sr-only">Поиск обращений</span><input type="search" disabled placeholder="Поиск будет доступен после подключения сервиса" /></label>
        <div className={styles.supportTicketList}>{tickets.map((ticket) => { const category = getSupportCategory(ticket.category); return <Link key={ticket.id} href={`${basePath}/${ticket.id}`}><div><small>Демонстрационное обращение</small><SupportStatusPill status={ticket.status} /></div><h3>{ticket.title}</h3><p>{ticket.summary}</p><dl><div><dt>Категория</dt><dd>{category.title}</dd></div><div><dt>Приоритет</dt><dd>{supportPriorityLabels[ticket.priority]}</dd></div><div><dt>Последний ответ</dt><dd>Время не задано</dd></div></dl><span>Открыть структуру <ArrowRight aria-hidden="true" /></span></Link>; })}</div>
      </div>
      <aside className={styles.supportAvailability}><MessageSquareText aria-hidden="true" /><small>Доступность команды</small><h2>График не подключён</h2><p>Интерфейс не обещает круглосуточную поддержку или конкретное время ответа без операционного подтверждения.</p><dl><div><dt>Канал</dt><dd>Внутренний диалог</dd></div><div><dt>Ориентир ответа</dt><dd>Нет данных</dd></div><div><dt>Оператор</dt><dd>Не назначен</dd></div></dl></aside>
    </section>

    <section className={styles.supportCategorySection} aria-labelledby="support-category-title"><header><span>Категории</span><h2 id="support-category-title">Контекст определяется до сообщения</h2><p>Категория помогает приложить только релевантные данные и не передавать лишнюю информацию.</p></header><div>{categories.map((category) => { const Icon = categoryIcons[category.id]; return <Card key={category.id} className={styles.supportCategoryCard}><Icon aria-hidden="true" /><h3>{category.title}</h3><p>{category.description}</p><small>Выбор будет доступен в реальном обращении</small></Card>; })}</div></section>
    <SupportStatusGuide />
  </DashboardPage>;
}
