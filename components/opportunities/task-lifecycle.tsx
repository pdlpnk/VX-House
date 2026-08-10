"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Clock3, FileText, History, ListChecks, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n";
import type { UserTaskView } from "@/lib/opportunities/types";

const statusCopy: Record<UserTaskView["status"], { label: MessageKey; next: MessageKey; tone: "neutral" | "brand" | "attention" | "success" }> = {
  AVAILABLE: { label: "lifecycle.available", next: "lifecycle.openInstruction", tone: "brand" }, ACCEPTED: { label: "lifecycle.accepted", next: "lifecycle.followSteps", tone: "brand" }, IN_PROGRESS: { label: "lifecycle.inProgress", next: "lifecycle.sendWhenDone", tone: "attention" }, AWAITING_SUBMISSION: { label: "lifecycle.awaitingSubmission", next: "lifecycle.checkAndSend", tone: "attention" }, SUBMITTED: { label: "lifecycle.submitted", next: "lifecycle.sentManager", tone: "brand" }, UNDER_REVIEW: { label: "lifecycle.underReview", next: "lifecycle.waitReview", tone: "attention" }, CLARIFICATION_REQUIRED: { label: "lifecycle.clarification", next: "lifecycle.readComment", tone: "attention" }, RESUBMISSION_REQUIRED: { label: "lifecycle.resubmission", next: "lifecycle.prepareAgain", tone: "attention" }, CONFIRMED: { label: "lifecycle.confirmed", next: "lifecycle.nextAvailable", tone: "success" }, REJECTED: { label: "lifecycle.rejected", next: "lifecycle.readReason", tone: "neutral" }, EXPIRED: { label: "lifecycle.expired", next: "lifecycle.actionsUnavailable", tone: "neutral" }, CANCELLED: { label: "lifecycle.cancelled", next: "lifecycle.actionsUnavailable", tone: "neutral" },
};

export function TaskLifecycle({ initialTask }: { initialTask: UserTaskView }) {
  const [task, setTask] = useState(initialTask);
  const [comment, setComment] = useState(task.submissions.at(-1)?.payload.comment ?? "");
  const [reference, setReference] = useState(task.submissions.at(-1)?.payload.reference ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { shouldReduceMotion } = useDashboard();
  const { locale, t } = useI18n();
  const state = statusCopy[task.status];

  async function command(action: "start" | "complete" | "draft" | "submit") {
    setPending(true); setMessage(null);
    try {
      const body = action === "start" ? undefined : JSON.stringify(action === "complete" ? { idempotencyKey: crypto.randomUUID() } : { payload: { comment, reference }, idempotencyKey: crypto.randomUUID() });
      const response = await fetch(`/api/tasks/${task.id}/${action}`, { method: "POST", credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : undefined, body });
      const result = await response.json() as UserTaskView & { message?: string };
      if (!response.ok) throw new Error(result.message ?? t("lifecycle.actionError"));
      setTask(result); setMessage(action === "draft" ? t("lifecycle.draftSaved") : action === "submit" || action === "complete" ? t("lifecycle.sent") : t("lifecycle.started"));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("lifecycle.failed")); }
    finally { setPending(false); }
  }

  const canDraft = ["AWAITING_SUBMISSION", "RESUBMISSION_REQUIRED"].includes(task.status);
  return <>
    <section className={styles.lifecycleExplorer} aria-labelledby="lifecycle-title"><div className={styles.lifecycleExplorerHeader}><div><span>{t("lifecycle.execution")}</span><h2 id="lifecycle-title">{t("lifecycle.currentStage")}</h2><p>{t("lifecycle.guidance")}</p></div><StatusPill tone={state.tone}>{t(state.label)}</StatusPill></div></section>
    <motion.section className={styles.lifecycleStatePanel} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.28 }} aria-live="polite">
      <header className={styles.lifecycleStateHeader}><span className={styles.lifecycleStateIcon}><BadgeCheck aria-hidden="true" /></span><div><small>{t("lifecycle.currentStatus")}</small><h2>{t(state.label)}</h2><p>{t(state.next)}</p></div><StatusPill tone={state.tone}>{t(state.label)}</StatusPill></header>
      <div className={styles.lifecycleStateGrid}><Card className={styles.lifecyclePrimaryCard}><div className={styles.stateCardHeading}><ListChecks aria-hidden="true" /><div><small>{t("task.instruction")}</small><h3>{task.task.instruction?.title ?? t("task.instructionNotAssigned")}</h3></div></div>{task.task.instruction?.sections.map((section) => <section key={section.id} className={styles.opportunityNextStep}><span>{section.title}</span><p>{section.body}</p></section>)}<ol className={styles.lifecycleStepList}>{task.task.instruction?.steps.map((step) => <li key={step.id}><span>{step.position}</span><div><strong>{step.title}</strong><p>{step.body}</p></div><StatusPill tone={step.required ? "brand" : "neutral"}>{step.required ? t("lifecycle.required") : t("lifecycle.optional")}</StatusPill></li>)}</ol></Card><div className={styles.lifecycleAsideCards}><Card className={styles.nextStepCard}><span><ShieldCheck aria-hidden="true" /></span><div><small>{t("opportunity.next")}</small><h3>{t("lifecycle.next")}</h3><p>{t(state.next)}</p></div></Card>{["ACCEPTED", "IN_PROGRESS"].includes(task.status) ? <Button onClick={() => command("complete")} disabled={pending}>{t("lifecycle.completed")} <Send aria-hidden="true" /></Button> : null}</div></div>
      {canDraft ? <Card className={styles.resultFormCard}><div className={styles.stateCardHeading}><FileText aria-hidden="true" /><div><small>{t("lifecycle.resultVersion")}</small><h3>{t("lifecycle.preparing")}</h3></div></div><div className={styles.resultForm}><label>{t("lifecycle.comment")}<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("lifecycle.commentPlaceholder")} /></label><label>{t("lifecycle.reference")}<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder={t("lifecycle.referencePlaceholder")} /></label></div><div className={styles.detailActions}><Button variant="outline" onClick={() => command("draft")} disabled={pending}>{t("lifecycle.saveDraft")}</Button>{task.status === "AWAITING_SUBMISSION" ? <Button onClick={() => command("submit")} disabled={pending}>{t("lifecycle.submit")} <Send aria-hidden="true" /></Button> : null}</div></Card> : null}
      {message ? <p className={styles.systemDisclosure} role="status">{message}</p> : null}
      {task.review ? <Card className={styles.reviewDecisionCard}><div className={styles.stateCardHeading}><MessageSquareText aria-hidden="true" /><div><small>{t("lifecycle.reviewDecision")}</small><h3>{task.review.decision}</h3></div></div><p className={styles.stateCardLead}>{task.review.reason}</p>{task.review.comment ? <p>{task.review.comment}</p> : null}</Card> : null}
    </motion.section>
    <section className={styles.taskHistoryPreview} aria-labelledby="task-history-title"><div className={styles.taskHistoryHeading}><span><History aria-hidden="true" /></span><div><small>{t("lifecycle.history")}</small><h2 id="task-history-title">{t("lifecycle.happened")}</h2><p>{t("lifecycle.historyText")}</p></div></div>{task.history.map((event) => <div className={styles.taskHistoryEmpty} key={event.id}><Clock3 aria-hidden="true" /><div><strong>{t(statusCopy[event.toStatus].label)}</strong><p>{event.reason} · {new Date(event.occurredAt).toLocaleString(locale)}</p></div></div>)}</section>
  </>;
}
