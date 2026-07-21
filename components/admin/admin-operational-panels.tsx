import { Download, Eye, LockKeyhole, ShieldCheck } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { AdminBackendNotice } from "@/components/admin/admin-ui";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminCapabilities, type AdminSectionId } from "@/lib/admin-data";

export function AdminCapabilities({ sectionId }: { sectionId: AdminSectionId }) {
  return (
    <section className={styles.adminCapabilities} aria-labelledby={`${sectionId}-capabilities-title`}>
      <header><div><span>Операционный состав</span><h2 id={`${sectionId}-capabilities-title`}>Подготовленные области управления</h2><p>Карточки описывают будущие рабочие процессы и не подтверждают наличие данных.</p></div><StatusPill tone="neutral">Frontend-структура</StatusPill></header>
      <div>{adminCapabilities[sectionId].map((item) => <Card key={item.label}><StatusPill tone="neutral">{item.state}</StatusPill><h3>{item.label}</h3><p>{item.description}</p></Card>)}</div>
    </section>
  );
}

export function AdminQueuePreview({ sectionId }: { sectionId: AdminSectionId }) {
  if (!["reviews", "rewards", "support"].includes(sectionId)) return null;
  const labels = sectionId === "reviews"
    ? ["Ожидает проверки", "Требуется уточнение", "Апелляция"]
    : sectionId === "rewards"
      ? ["Ожидает подтверждения", "Готовится", "Требует сверки"]
      : ["Новые", "Ожидают оператора", "Апелляции"];

  return (
    <section className={styles.adminQueuePreview} aria-labelledby={`${sectionId}-queue-title`}>
      <header><div><span>Операционная очередь</span><h2 id={`${sectionId}-queue-title`}>Состояния ежедневной работы</h2></div><StatusPill tone="neutral">Нет данных</StatusPill></header>
      <div>{labels.map((label) => <article key={label}><small>{label}</small><strong>Записей нет</strong><p>Очередь появится из защищённого серверного источника.</p></article>)}</div>
    </section>
  );
}

const permissionRows = [
  ["Менеджер", "Просмотр", "Публикация", "—", "—", "—"],
  ["Проверяющий", "Просмотр", "—", "Проверка", "—", "—"],
  ["Финансовый сотрудник", "Ограниченный", "—", "—", "Финансы", "—"],
  ["Поддержка", "Контекстный", "—", "—", "—", "—"],
  ["Аудитор", "Только просмотр", "—", "—", "—", "Аудит"],
] as const;

export function AdminPermissionMatrix({ sectionId }: { sectionId: AdminSectionId }) {
  if (sectionId !== "team") return null;
  return (
    <section className={styles.adminPermissionPanel} aria-labelledby="permission-matrix-title">
      <header><div><span>Разделение полномочий</span><h2 id="permission-matrix-title">Матрица будущих прав</h2><p>Это продуктовая модель, а не назначенные сотрудникам разрешения.</p></div><StatusPill tone="attention">Не настроено</StatusPill></header>
      <div className={styles.adminPermissionTable} role="table" aria-label="Демонстрационная матрица прав">
        <div role="row"><strong role="columnheader">Роль</strong><strong role="columnheader">Доступ</strong><strong role="columnheader">Публикация</strong><strong role="columnheader">Проверка</strong><strong role="columnheader">Финансы</strong><strong role="columnheader">Аудит</strong></div>
        {permissionRows.map((row) => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={`${row[0]}-${index}`} data-empty={cell === "—" || undefined}>{cell}</span>)}</div>)}
      </div>
      <AdminBackendNotice />
    </section>
  );
}

export function AdminAuditPanel({ sectionId }: { sectionId: AdminSectionId }) {
  if (sectionId !== "audit") return null;
  return (
    <section className={styles.adminAuditPanel} aria-labelledby="audit-panel-title">
      <header><div><span>Неизменяемая история</span><h2 id="audit-panel-title">Журнал критических действий</h2><p>В frontend нет реальных событий. Будущая запись содержит автора, время, основание и значения до и после.</p></div><Button disabled variant="outline"><Download aria-hidden="true" /> Экспортировать</Button></header>
      <div className={styles.adminAuditEmpty}><ShieldCheck aria-hidden="true" /><div><strong>Событий аудита нет</strong><p>Экспорт и просмотр появятся только после подключения серверного журнала и прав аудитора.</p></div></div>
      <AdminBackendNotice />
    </section>
  );
}

export function AdminUserResultPreview({ sectionId }: { sectionId: AdminSectionId }) {
  const previewable = ["services", "opportunities", "tasks", "rewards", "economy", "content", "notifications"].includes(sectionId);
  if (!previewable) return null;
  return (
    <Card className={styles.adminUserPreview}>
      <header><Eye aria-hidden="true" /><div><small>Предпросмотр пользовательского результата</small><h2>Изменения ещё не сформированы</h2></div><StatusPill tone="neutral">Нет данных</StatusPill></header>
      <div><span>Что увидит пользователь</span><strong>Предпросмотр недоступен</strong><p>После подключения backend здесь будет показан результат публикации с учётом роли, страны, ранга и персональных условий.</p></div>
    </Card>
  );
}

export function AdminCriticalActionPreview() {
  return (
    <Card className={styles.adminCriticalPreview}>
      <header><LockKeyhole aria-hidden="true" /><div><small>Подтверждение критического действия</small><h2>Изменение не подготовлено</h2><p>Подтверждение станет доступно только после проверки прав и предварительного просмотра.</p></div></header>
      <dl><div><dt>Автор</dt><dd>Нет данных</dd></div><div><dt>Значение до</dt><dd>Нет данных</dd></div><div><dt>Значение после</dt><dd>Черновик отсутствует</dd></div><div><dt>Основание</dt><dd>Не указано</dd></div></dl>
      <label><input type="checkbox" disabled /><span>Я проверил влияние и подтверждаю критическое действие</span></label>
      <Button disabled>Подтвердить и применить</Button>
      <AdminBackendNotice />
    </Card>
  );
}
