"use client";

import { ArrowLeft, FileText, Info, LockKeyhole, Paperclip, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EconomyRole } from "@/lib/economy-data";
import { supportCategories, supportPriorityLabels } from "@/lib/support-data";

export function SupportNewTicket({ role, basePath }: { role: EconomyRole; basePath: string }) {
  const categories = supportCategories.filter((category) => category.roles.includes(role));
  return <DashboardPage>
    <DashboardHeading eyebrow="Центр поддержки" title="Новое обращение" description="Подготовленная форма будущего диалога. Поля отключены: данные не сохраняются и не отправляются." action={<StatusPill tone="neutral">Сервис не подключён</StatusPill>} />
    <div className={styles.supportDemoNotice} role="note"><Info aria-hidden="true" /><p><strong>Создание обращения недоступно.</strong> Экран показывает состав будущей формы без имитации отправки или назначения оператора.</p></div>
    <section className={styles.supportNewLayout}>
      <Card className={styles.supportNewForm}>
        <header><span><FileText aria-hidden="true" /></span><div><small>Структура обращения</small><h2>Опишите вопрос в одном контексте</h2><p>Категория определит, какие безопасные данные система сможет предложить приложить.</p></div></header>
        <fieldset disabled>
          <div className={styles.supportFormGrid}>
            <label><span>Категория</span><select defaultValue=""><option value="" disabled>Выберите категорию</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select><small>Определяет разрешённый контекст обращения.</small></label>
            <label><span>Приоритет</span><select defaultValue="normal">{Object.entries(supportPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>Приоритет не обещает конкретное время ответа.</small></label>
          </div>
          <label><span>Тема обращения</span><input type="text" placeholder="Кратко опишите вопрос" /></label>
          <label><span>Сообщение</span><textarea placeholder="Добавьте детали, которых ещё нет в контексте" /></label>
          <div className={styles.supportAttachment}><Paperclip aria-hidden="true" /><div><strong>Разрешённые вложения</strong><p>Типы файлов, размер и срок хранения будут определены политикой сервиса.</p></div><Button type="button" variant="outline">Выбрать файл</Button></div>
          <Button type="submit"><Send aria-hidden="true" />Создать обращение</Button>
        </fieldset>
        <p className={styles.supportFormDisabled}><LockKeyhole aria-hidden="true" />Все поля и действия будут доступны после подключения backend.</p>
      </Card>
      <aside className={styles.supportNewAside}>
        <Card><ShieldCheck aria-hidden="true" /><small>Разрешённый контекст</small><h2>Что сможет увидеть поддержка</h2><dl><div><dt>Роль</dt><dd>{role === "player" ? "Игрок" : "Партнёр"}</dd></div><div><dt>Страна</dt><dd>Нет данных</dd></div><div><dt>Связанная сущность</dt><dd>Не выбрана</dd></div><div><dt>Версия результата</dt><dd>Нет данных</dd></div></dl><p>Передача контекста требует явных правил и серверной проверки.</p></Card>
        <Card><Info aria-hidden="true" /><small>До создания</small><h2>Сначала проверьте контекст</h2><p>Инструкция или объяснение статуса смогут решить типовой вопрос до открытия диалога. Самообслуживание будет подключено вместе с управляемым контентом.</p></Card>
      </aside>
    </section>
    <Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" />Вернуться в Центр поддержки</Link>
  </DashboardPage>;
}
