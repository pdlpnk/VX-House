"use client";

import { ArrowLeft, BookOpenCheck, CircleDotDashed, Headphones, MapPin } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { TaskLifecycle } from "@/components/opportunities/task-lifecycle";
import { Card } from "@/components/ui/card";
import type { UserTaskView } from "@/lib/opportunities/types";

export function TaskDetail({ task, opportunityBasePath, supportHref }: { task: UserTaskView | null; opportunityBasePath: string; supportHref: string }) {
  if (!task) return <DashboardPage><DashboardHeading eyebrow="Задания" title="Нет данных" description="Задание не найдено или принадлежит другому пользователю." action={<OpportunityStatusBadge status="NO_DATA" />} /><Card className={styles.noDataPanel}><CircleDotDashed aria-hidden="true" /><h2>Задание недоступно</h2><p>Сервер не раскрывает задания других пользователей.</p></Card><Link className={styles.pageBackLink} href={opportunityBasePath}><ArrowLeft aria-hidden="true" /> Вернуться к возможностям</Link></DashboardPage>;

  return <DashboardPage>
    <DashboardHeading eyebrow="Жизненный цикл задания" title={task.task.title} description={task.task.summary} action={<StatusPill tone="brand">Попытка {task.attemptNumber}</StatusPill>} />
    <section className={styles.taskOverview}><div><span>Зафиксированная версия</span><h2>Условия не изменятся во время выполнения</h2><p>Задание и инструкция закреплены в момент принятия. Новая публикация не изменит текущую попытку.</p></div><dl><div><dt>Рынок</dt><dd><MapPin aria-hidden="true" /> Из профиля</dd></div><div><dt>Версия задания</dt><dd>{task.task.version}</dd></div><div><dt>Версия инструкции</dt><dd>{task.task.instruction?.version ?? "Нет"}</dd></div><div><dt>Повторная отправка</dt><dd>{task.task.resubmissionPolicy}</dd></div></dl></section>
    <TaskLifecycle initialTask={task} />
    <DashboardGrid className={styles.taskFutureGrid}><DashboardGridItem><Card className={styles.taskFutureArea}><span><BookOpenCheck aria-hidden="true" /></span><div><h2>{task.task.instruction?.title ?? "Инструкция"}</h2><p>{task.task.instruction?.summary ?? "Опубликованная инструкция не назначена."}</p></div></Card></DashboardGridItem></DashboardGrid>
    <div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={task.status === "REJECTED" ? `${supportHref}/new?category=appeal&relatedType=USER_TASK&relatedId=${task.id}` : supportHref}><Headphones aria-hidden="true" />{task.status === "REJECTED" ? "Подать апелляцию" : "Открыть Центр поддержки"}</Link><Link className={styles.pageBackLink} href={`${opportunityBasePath}/${task.opportunityId}`}><ArrowLeft aria-hidden="true" /> Вернуться к карточке возможности</Link></div>
  </DashboardPage>;
}
