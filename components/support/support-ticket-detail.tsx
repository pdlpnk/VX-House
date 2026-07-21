"use client";

import { ArrowLeft, CircleDashed, FileText, History, Info, LockKeyhole, MessageSquareText, Paperclip, Send, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { SupportStatusGuide } from "@/components/support/support-status-guide";
import { SupportStatusPill } from "@/components/support/support-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyRole } from "@/lib/economy-data";
import { getSupportCategory, getSupportTicket, supportHistoryTypes, supportPriorityLabels } from "@/lib/support-data";

export function SupportTicketDetail({ id, role, basePath }: { id: string; role: EconomyRole; basePath: string }) {
  const ticket = getSupportTicket(id, role);
  if (!ticket) return <DashboardPage><DashboardHeading eyebrow="Центр поддержки" title="Нет данных" description="Обращение не найдено или недоступно для выбранной роли." action={<StatusPill tone="neutral">Не найдено</StatusPill>} /><Card className={styles.noDataPanel}><CircleDashed aria-hidden="true" /><h2>Обращение отсутствует</h2><p>Вернитесь в Центр поддержки и выберите демонстрационный сценарий.</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться в Центр поддержки</Link></DashboardPage>;
  const category = getSupportCategory(ticket.category);
  return <DashboardPage>
    <DashboardHeading eyebrow="Демонстрационное обращение" title={ticket.title} description={ticket.summary} action={<SupportStatusPill status={ticket.status} />} />
    <div className={styles.supportDemoNotice} role="note"><Info aria-hidden="true" /><p><strong>Диалог не является настоящим обращением.</strong> Сообщения ниже показывают будущую структуру и не были отправлены пользователем или оператором.</p></div>
    <section className={styles.supportTicketLayout}>
      <div className={styles.supportConversation} aria-labelledby="support-conversation-title">
        <header><span><MessageSquareText aria-hidden="true" /></span><div><small>Переписка</small><h2 id="support-conversation-title">Диалог с поддержкой</h2></div></header>
        <div className={styles.supportMessages}>{ticket.messages.length ? ticket.messages.map((message) => <article key={message.id} data-author={message.author}><header>{message.author === "operator" ? <ShieldCheck aria-hidden="true" /> : <UserRound aria-hidden="true" />}<strong>{message.authorLabel}</strong><StatusPill tone="neutral">{message.demoLabel}</StatusPill></header><p>{message.body}</p><small>Время не задано</small></article>) : <div className={styles.supportMessagesEmpty}><CircleDashed aria-hidden="true" /><div><strong>Сообщений пока нет</strong><p>Демонстрационное обращение не заполняется вымышленной перепиской.</p></div></div>}</div>
        <div className={styles.supportComposer} aria-describedby="support-composer-disabled"><label><span>Сообщение</span><textarea disabled placeholder="Напишите сообщение после подключения сервиса" /></label><div className={styles.supportAttachment}><Paperclip aria-hidden="true" /><div><strong>Вложения</strong><p>Разрешённые типы и размер появятся из политики хранения.</p></div><Button disabled variant="outline">Выбрать файл</Button></div><Button disabled><Send aria-hidden="true" />Отправить сообщение</Button><p id="support-composer-disabled"><LockKeyhole aria-hidden="true" />Отправка и вложения будут доступны после подключения backend.</p></div>
      </div>
      <aside className={styles.supportTicketAside}>
        <Card><small>Контекст обращения</small><h2>Передаётся только разрешённое</h2><dl><div><dt>Категория</dt><dd>{category.title}</dd></div><div><dt>Приоритет</dt><dd>{supportPriorityLabels[ticket.priority]}</dd></div><div><dt>Оператор</dt><dd>Не назначен</dd></div>{ticket.context.map((item) => { const [label, ...value] = item.split(": "); return <div key={item}><dt>{label}</dt><dd>{value.join(": ")}</dd></div>; })}</dl></Card>
        <Card><small>Следующее действие</small><h2>Сервис не подключён</h2><p>Статус показывает будущий маршрут, но не создаёт ожидание ответа и не запускает таймер.</p></Card>
      </aside>
    </section>
    <section className={styles.supportHistoryPreview} aria-labelledby="support-history-title"><header><span><History aria-hidden="true" /></span><div><small>История статусов</small><h2 id="support-history-title">Серверных событий пока нет</h2><p>Демонстрационный статус не записывается в историю и не имитирует работу оператора.</p></div></header><div>{supportHistoryTypes.map((type) => <StatusPill key={type} tone="neutral">{type}</StatusPill>)}</div><footer><FileText aria-hidden="true" /><p>В будущем запись будет содержать дату, автора, причину, предыдущий и новый статус.</p></footer></section>
    <SupportStatusGuide />
    <Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться к обращениям</Link>
  </DashboardPage>;
}
