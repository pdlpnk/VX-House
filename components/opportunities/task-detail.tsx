"use client";

import { ArrowLeft, BookOpenCheck, CircleDotDashed, Headphones } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { TaskLifecycle } from "@/components/opportunities/task-lifecycle";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { UserTaskView } from "@/lib/opportunities/types";

export function TaskDetail({ task, opportunityBasePath, supportHref }: { task: UserTaskView | null; opportunityBasePath: string; supportHref: string }) {
  const { locale, t } = useI18n();
  if (!task) return <DashboardPage><DashboardHeading eyebrow={t("opportunity.playerEyebrow")} title={t("task.notFound")} description={t("task.notFoundText")} action={<OpportunityStatusBadge status="NO_DATA" />} /><Card className={styles.noDataPanel}><CircleDotDashed aria-hidden="true" /><h2>{t("task.unavailable")}</h2><p>{t("task.chooseAvailable")}</p></Card><Link className={styles.pageBackLink} href={opportunityBasePath}><ArrowLeft aria-hidden="true" /> {t("task.back")}</Link></DashboardPage>;

  return <DashboardPage>
    <DashboardHeading eyebrow={t("task.lifecycle")} title={task.task.title} description={task.task.summary} action={<StatusPill tone="brand">{t("task.attempt", { count: task.attemptNumber })}</StatusPill>} />
    <section className={styles.taskOverview}><div><span>{t("task.terms")}</span><h2>{t("task.savedTitle")}</h2><p>{t("task.savedText")}</p></div><dl><div><dt>{t("task.reward")}</dt><dd>{task.task.possibleRewardDescription ?? t("task.rewardInCard")}</dd></div><div><dt>{t("task.deadlineShort")}</dt><dd>{task.task.completionDeadline ? new Date(task.task.completionDeadline).toLocaleDateString(locale) : t("task.noDeadline")}</dd></div><div><dt>{t("task.resubmission")}</dt><dd>{task.task.resubmissionPolicy}</dd></div></dl></section>
    <TaskLifecycle initialTask={task} />
    <DashboardGrid className={styles.taskFutureGrid}><DashboardGridItem><Card className={styles.taskFutureArea}><span><BookOpenCheck aria-hidden="true" /></span><div><h2>{task.task.instruction?.title ?? t("task.instruction")}</h2><p>{task.task.instruction?.summary ?? t("task.instructionNotAssigned")}</p></div></Card></DashboardGridItem></DashboardGrid>
    <div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={supportHref}><Headphones aria-hidden="true" />{task.status === "REJECTED" ? t("task.discuss") : t("task.messageManager")}</Link><Link className={styles.pageBackLink} href={`${opportunityBasePath}/${task.opportunityId}`}><ArrowLeft aria-hidden="true" /> {t("task.backOne")}</Link></div>
  </DashboardPage>;
}
