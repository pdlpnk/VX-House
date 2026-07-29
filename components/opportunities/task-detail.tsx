"use client";

import { ArrowLeft, BookOpenCheck, CircleDotDashed, Headphones } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { TaskLifecycle } from "@/components/opportunities/task-lifecycle";
import { Card } from "@/components/ui/card";
import type { UserTaskView } from "@/lib/opportunities/types";

export function TaskDetail({ task, opportunityBasePath, supportHref }: { task: UserTaskView | null; opportunityBasePath: string; supportHref: string }) {
  if (!task) return <DashboardPage><DashboardHeading eyebrow="Задания" title="Задание не найдено" description="Возможно, оно завершено или больше не доступно." action={<OpportunityStatusBadge status="NO_DATA" />} /><Card className={styles.noDataPanel}><CircleDotDashed aria-hidden="true" /><h2>Задание недоступно</h2><p>Выберите другое задание из доступного списка.</p></Card><Link className={styles.pageBackLink} href={opportunityBasePath}><ArrowLeft aria-hidden="true" /> К заданиям</Link></DashboardPage>;

  return <DashboardPage>
    <DashboardHeading eyebrow="Жизненный цикл задания" title={task.task.title} description={task.task.summary} action={<StatusPill tone="brand">Попытка {task.attemptNumber}</StatusPill>} />
    <section className={styles.taskOverview}><div><span>Условия задания</span><h2>Всё важное сохранено</h2><p>Условия и инструкция останутся без изменений до завершения задания.</p></div><dl><div><dt>Награда</dt><dd>{task.task.possibleRewardDescription ?? "Указана в карточке задания"}</dd></div><div><dt>Срок</dt><dd>{task.task.completionDeadline ? new Date(task.task.completionDeadline).toLocaleDateString("ru-RU") : "Без ограничения"}</dd></div><div><dt>Повторная отправка</dt><dd>{task.task.resubmissionPolicy}</dd></div></dl></section>
    <TaskLifecycle initialTask={task} />
    <DashboardGrid className={styles.taskFutureGrid}><DashboardGridItem><Card className={styles.taskFutureArea}><span><BookOpenCheck aria-hidden="true" /></span><div><h2>{task.task.instruction?.title ?? "Инструкция"}</h2><p>{task.task.instruction?.summary ?? "Опубликованная инструкция не назначена."}</p></div></Card></DashboardGridItem></DashboardGrid>
    <div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={supportHref}><Headphones aria-hidden="true" />{task.status === "REJECTED" ? "Обсудить решение с менеджером" : "Написать менеджеру"}</Link><Link className={styles.pageBackLink} href={`${opportunityBasePath}/${task.opportunityId}`}><ArrowLeft aria-hidden="true" /> К заданию</Link></div>
  </DashboardPage>;
}
