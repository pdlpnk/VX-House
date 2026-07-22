"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Clock3, FileText, History, ListChecks, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserTaskView } from "@/lib/opportunities/types";

const statusCopy: Record<UserTaskView["status"], { label: string; next: string; tone: "neutral" | "brand" | "attention" | "success" }> = {
  AVAILABLE: { label: "Доступно", next: "Примите задание из карточки возможности.", tone: "brand" }, ACCEPTED: { label: "Принято", next: "Откройте инструкцию и начните выполнение.", tone: "brand" }, IN_PROGRESS: { label: "Выполняется", next: "Подготовьте результат и сохраните черновик.", tone: "attention" }, AWAITING_SUBMISSION: { label: "Ожидает отправки", next: "Проверьте данные и отправьте новую версию результата.", tone: "attention" }, SUBMITTED: { label: "Отправлено", next: "Система ставит результат в очередь проверки.", tone: "brand" }, UNDER_REVIEW: { label: "Ожидает проверки", next: "Дождитесь серверного решения.", tone: "attention" }, CLARIFICATION_REQUIRED: { label: "Требуется уточнение", next: "Изучите комментарий проверяющего.", tone: "attention" }, RESUBMISSION_REQUIRED: { label: "Нужна повторная отправка", next: "Подготовьте исправленную версию результата.", tone: "attention" }, CONFIRMED: { label: "Подтверждено", next: "Проверка завершена.", tone: "success" }, REJECTED: { label: "Отклонено", next: "Изучите основание решения.", tone: "neutral" }, EXPIRED: { label: "Срок истёк", next: "Действия по заданию недоступны.", tone: "neutral" }, CANCELLED: { label: "Отменено", next: "Действия по заданию недоступны.", tone: "neutral" },
};

export function TaskLifecycle({ initialTask }: { initialTask: UserTaskView }) {
  const [task, setTask] = useState(initialTask);
  const [comment, setComment] = useState(task.submissions.at(-1)?.payload.comment ?? "");
  const [reference, setReference] = useState(task.submissions.at(-1)?.payload.reference ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { shouldReduceMotion } = useDashboard();
  const state = statusCopy[task.status];

  async function command(action: "start" | "draft" | "submit") {
    setPending(true); setMessage(null);
    try {
      const body = action === "start" ? undefined : JSON.stringify({ payload: { comment, reference }, idempotencyKey: crypto.randomUUID() });
      const response = await fetch(`/api/tasks/${task.id}/${action}`, { method: "POST", credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : undefined, body });
      const result = await response.json() as UserTaskView & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Действие недоступно");
      setTask(result); setMessage(action === "draft" ? "Черновик сохранён новой версией." : action === "submit" ? "Результат отправлен и ожидает проверки." : "Выполнение начато.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Не удалось выполнить действие"); }
    finally { setPending(false); }
  }

  const canDraft = ["IN_PROGRESS", "AWAITING_SUBMISSION", "RESUBMISSION_REQUIRED"].includes(task.status);
  return <>
    <section className={styles.lifecycleExplorer} aria-labelledby="lifecycle-title"><div className={styles.lifecycleExplorerHeader}><div><span>Серверное состояние</span><h2 id="lifecycle-title">Жизненный цикл задания</h2><p>Статус меняется только после разрешённой серверной команды. Клиент не выбирает этап самостоятельно.</p></div><StatusPill tone={state.tone}>{state.label}</StatusPill></div></section>
    <motion.section className={styles.lifecycleStatePanel} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.28 }} aria-live="polite">
      <header className={styles.lifecycleStateHeader}><span className={styles.lifecycleStateIcon}><BadgeCheck aria-hidden="true" /></span><div><small>Текущий статус</small><h2>{state.label}</h2><p>{state.next}</p></div><StatusPill tone={state.tone}>{state.label}</StatusPill></header>
      <div className={styles.lifecycleStateGrid}><Card className={styles.lifecyclePrimaryCard}><div className={styles.stateCardHeading}><ListChecks aria-hidden="true" /><div><small>Зафиксированная инструкция</small><h3>{task.task.instruction?.title ?? "Инструкция не назначена"}</h3></div></div>{task.task.instruction?.sections.map((section) => <section key={section.id} className={styles.opportunityNextStep}><span>{section.title}</span><p>{section.body}</p></section>)}<ol className={styles.lifecycleStepList}>{task.task.instruction?.steps.map((step) => <li key={step.id}><span>{step.position}</span><div><strong>{step.title}</strong><p>{step.body}</p></div><StatusPill tone={step.required ? "brand" : "neutral"}>{step.required ? "Обязательно" : "Дополнительно"}</StatusPill></li>)}</ol></Card><div className={styles.lifecycleAsideCards}><Card className={styles.nextStepCard}><span><ShieldCheck aria-hidden="true" /></span><div><small>Что дальше</small><h3>Следующий шаг</h3><p>{state.next}</p></div></Card>{task.status === "ACCEPTED" ? <Button onClick={() => command("start")} disabled={pending}>Начать выполнение</Button> : null}</div></div>
      {canDraft ? <Card className={styles.resultFormCard}><div className={styles.stateCardHeading}><FileText aria-hidden="true" /><div><small>Версия результата</small><h3>Подготовка отправки</h3></div></div><div className={styles.resultForm}><label>Комментарий<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Опишите выполненное действие" /></label><label>Идентификатор или ссылка<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Укажите подтверждение результата" /></label></div><div className={styles.detailActions}><Button variant="outline" onClick={() => command("draft")} disabled={pending}>Сохранить черновик</Button>{task.status === "AWAITING_SUBMISSION" ? <Button onClick={() => command("submit")} disabled={pending}>Отправить результат <Send aria-hidden="true" /></Button> : null}</div></Card> : null}
      {message ? <p className={styles.systemDisclosure} role="status">{message}</p> : null}
      {task.review ? <Card className={styles.reviewDecisionCard}><div className={styles.stateCardHeading}><MessageSquareText aria-hidden="true" /><div><small>Решение проверки</small><h3>{task.review.decision}</h3></div></div><p className={styles.stateCardLead}>{task.review.reason}</p>{task.review.comment ? <p>{task.review.comment}</p> : null}</Card> : null}
    </motion.section>
    <section className={styles.taskHistoryPreview} aria-labelledby="task-history-title"><div className={styles.taskHistoryHeading}><span><History aria-hidden="true" /></span><div><small>Неизменяемая история</small><h2 id="task-history-title">История изменений</h2><p>Каждый серверный переход фиксируется отдельно.</p></div></div>{task.history.map((event) => <div className={styles.taskHistoryEmpty} key={event.id}><Clock3 aria-hidden="true" /><div><strong>{statusCopy[event.toStatus].label}</strong><p>{event.reason} · {new Date(event.occurredAt).toLocaleString("ru-RU")}</p></div></div>)}</section>
  </>;
}
