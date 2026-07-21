"use client";

import { ArrowLeft, BookOpenCheck, CircleDotDashed, Gift, Headphones, KeyRound, MapPin } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { TaskLifecycle } from "@/components/opportunities/task-lifecycle";
import { Card } from "@/components/ui/card";
import { getTask, type OpportunityRole } from "@/lib/opportunity-data";

export function TaskDetail({ id, role, opportunityBasePath, supportHref }: { id: string; role: OpportunityRole; opportunityBasePath: string; supportHref: string }) {
  const task = getTask(id, role);

  if (!task) {
    return (
      <DashboardPage>
        <DashboardHeading eyebrow="Задания" title="Нет данных" description="Задание не найдено или недоступно для выбранной роли." action={<OpportunityStatusBadge status="no-data" />} />
        <Card className={styles.noDataPanel}><CircleDotDashed aria-hidden="true" /><h2>Задание не найдено</h2><p>В каталоге доступны только демонстрационные структуры текущей роли.</p></Card>
        <Link className={styles.pageBackLink} href={opportunityBasePath}><ArrowLeft aria-hidden="true" /> Вернуться к возможностям</Link>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardHeading eyebrow="Жизненный цикл задания" title={task.title} description={task.description} action={<StatusPill tone="neutral">Только демонстрация</StatusPill>} />

      <section className={styles.taskOverview}>
        <div><span>Frontend-сценарий</span><h2>Путь от получения до решения</h2><p>Ни одно действие не выполняется и не сохраняется. Интерфейс показывает, как пользователь будет понимать статус и следующий шаг после подключения сервиса.</p></div>
        <dl><div><dt>Рынок</dt><dd><MapPin aria-hidden="true" /> {task.markets.join(" · ")}</dd></div><div><dt>Партнёрский сервис</dt><dd>{task.partnerService}</dd></div><div><dt>Версия условий</dt><dd>{task.conditionsVersion}</dd></div><div><dt>Срок</dt><dd>{task.deadline}</dd></div></dl>
      </section>

      <TaskLifecycle task={task} />

      <DashboardGrid className={styles.taskFutureGrid}>
        <DashboardGridItem><FutureTaskArea icon={BookOpenCheck} title="Инструкция" status="Ожидает подключения" /></DashboardGridItem>
        <DashboardGridItem><FutureTaskArea icon={KeyRound} title="Промокод" status="Нет данных" /></DashboardGridItem>
        <DashboardGridItem><FutureTaskArea icon={Gift} title="VX Rewards" status="Не начисляются на этом этапе" /></DashboardGridItem>
      </DashboardGrid>

      <div className={styles.contextLinks}><Link className={styles.contextSupportLink} href={supportHref}><Headphones aria-hidden="true" />Открыть Центр поддержки</Link><Link className={styles.pageBackLink} href={`${opportunityBasePath}/${task.opportunityId}`}><ArrowLeft aria-hidden="true" /> Вернуться к карточке возможности</Link></div>
    </DashboardPage>
  );
}

function FutureTaskArea({ icon: Icon, title, status }: { icon: typeof Gift; title: string; status: string }) {
  return <Card className={styles.taskFutureArea}><span><Icon aria-hidden="true" /></span><div><h2>{title}</h2><p>{status}. Данные не имитируются.</p></div></Card>;
}
