"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BadgeCheck,
  CheckCheck,
  CircleDashed,
  CircleOff,
  ClipboardCheck,
  Clock3,
  FileText,
  History,
  Info,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Paperclip,
  Send,
  ShieldCheck,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EconomyImpactPreview } from "@/components/economy/economy-impact-preview";
import type { TaskDefinition } from "@/lib/opportunity-data";
import {
  getTaskLifecycleState,
  taskLifecycle,
  type TaskLifecycleDefinition,
  type TaskLifecycleStatus,
} from "@/lib/task-lifecycle";

const statusIcons: Record<TaskLifecycleStatus, LucideIcon> = {
  available: ClipboardCheck,
  accepted: BadgeCheck,
  "in-progress": ListChecks,
  "awaiting-submission": UploadCloud,
  submitted: Send,
  "under-review": Clock3,
  clarification: MessageSquareText,
  confirmed: CheckCheck,
  rejected: CircleOff,
};

export function TaskLifecycle({ task }: { task: TaskDefinition }) {
  const [activeStatus, setActiveStatus] = useState<TaskLifecycleStatus>("available");
  const { shouldReduceMotion } = useDashboard();
  const state = getTaskLifecycleState(activeStatus);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % taskLifecycle.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + taskLifecycle.length) % taskLifecycle.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = taskLifecycle.length - 1;
    else return;

    event.preventDefault();
    const nextStatus = taskLifecycle[nextIndex].status;
    setActiveStatus(nextStatus);
    window.requestAnimationFrame(() => document.getElementById(`task-state-${nextStatus}`)?.focus());
  }

  return (
    <>
      <section className={styles.lifecycleExplorer} aria-labelledby="lifecycle-title">
        <div className={styles.lifecycleExplorerHeader}>
          <div>
            <span>Frontend-предпросмотр</span>
            <h2 id="lifecycle-title">Жизненный цикл задания</h2>
            <p>Выберите состояние, чтобы увидеть будущий экран. Переключатель не изменяет задание и не сохраняет данные.</p>
          </div>
          <StatusPill tone="neutral">9 демонстрационных состояний</StatusPill>
        </div>

        <div className={styles.lifecycleTabs} role="tablist" aria-label="Демонстрационные состояния задания">
          {taskLifecycle.map((item, index) => {
            const Icon = statusIcons[item.status];
            const selected = item.status === activeStatus;
            return (
              <button
                key={item.status}
                type="button"
                role="tab"
                id={`task-state-${item.status}`}
                aria-controls="task-state-panel"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={styles.lifecycleTab}
                data-active={selected || undefined}
                onClick={() => setActiveStatus(item.status)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span>{index + 1}</span>
                <Icon aria-hidden="true" />
                <strong>{item.label}</strong>
                <small>{item.phase}</small>
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={activeStatus}
          id="task-state-panel"
          role="tabpanel"
          aria-labelledby={`task-state-${activeStatus}`}
          aria-live="polite"
          className={styles.lifecycleStatePanel}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <LifecycleStateHeader state={state} />
          <LifecycleStateContent state={state} task={task} />
        </motion.section>
      </AnimatePresence>

      <TaskHistoryPreview />
    </>
  );
}

function LifecycleStateHeader({ state }: { state: TaskLifecycleDefinition }) {
  const Icon = statusIcons[state.status];
  return (
    <header className={styles.lifecycleStateHeader}>
      <span className={styles.lifecycleStateIcon}><Icon aria-hidden="true" /></span>
      <div>
        <small>{state.phase} · демонстрационное состояние</small>
        <h2>{state.label}</h2>
        <p>{state.description}</p>
      </div>
      <StatusPill tone={state.tone}>{state.label}</StatusPill>
    </header>
  );
}

function LifecycleStateContent({ state, task }: { state: TaskLifecycleDefinition; task: TaskDefinition }) {
  switch (state.status) {
    case "awaiting-submission":
      return <ResultSubmissionPreview state={state} task={task} />;
    case "submitted":
      return <SubmissionConfirmationPreview state={state} task={task} />;
    case "under-review":
      return <ReviewWaitingPreview state={state} task={task} />;
    case "clarification":
    case "confirmed":
    case "rejected":
      return <ReviewDecisionPreview state={state} task={task} />;
    default:
      return <TaskProgressPreview state={state} task={task} />;
  }
}

function TaskProgressPreview({ state, task }: { state: TaskLifecycleDefinition; task: TaskDefinition }) {
  const actionLabels: Partial<Record<TaskLifecycleStatus, string>> = {
    available: "Принять задание",
    accepted: "Начать выполнение",
    "in-progress": "Завершить обязательные шаги",
  };

  return (
    <div className={styles.lifecycleStateGrid}>
      <Card className={styles.lifecyclePrimaryCard}>
        <div className={styles.stateCardHeading}><ListChecks aria-hidden="true" /><div><small>Структура выполнения</small><h3>Обязательные шаги</h3></div></div>
        <ol className={styles.lifecycleStepList}>
          {task.steps.map((step, index) => (
            <li key={step.id}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.description}</p></div><StatusPill tone="neutral">Не запущено</StatusPill></li>
          ))}
        </ol>
      </Card>
      <div className={styles.lifecycleAsideCards}>
        <NextStepCard state={state} />
        <UnavailableAction label={actionLabels[state.status] ?? "Продолжить"} />
      </div>
    </div>
  );
}

function ResultSubmissionPreview({ state, task }: { state: TaskLifecycleDefinition; task: TaskDefinition }) {
  return (
    <div className={styles.lifecycleStateGrid}>
      <Card className={styles.resultFormCard}>
        <div className={styles.stateCardHeading}><UploadCloud aria-hidden="true" /><div><small>Черновик результата</small><h3>Подготовка материалов</h3></div></div>
        <p className={styles.stateCardLead}>Форма показывает будущий состав отправки. Поля отключены: данные не сохраняются и не передаются.</p>
        <div className={styles.resultForm} aria-describedby="result-form-unavailable">
          <label>Комментарий<textarea disabled placeholder="Опишите выполненное действие" /></label>
          <label>Идентификатор<input disabled type="text" placeholder="Будет указан формат идентификатора" /></label>
          <div className={styles.attachmentDrop} aria-disabled="true"><Paperclip aria-hidden="true" /><strong>Разрешённое вложение</strong><p>Тип и размер файла будут проверяться после подключения сервиса.</p></div>
        </div>
        <div className={styles.resultFormats}><span>Предусмотренные форматы</span><div>{task.resultFormats.map((format) => <StatusPill key={format} tone="neutral">{format}</StatusPill>)}</div></div>
        <UnavailableAction label="Проверить и отправить" id="result-form-unavailable" />
      </Card>
      <div className={styles.lifecycleAsideCards}>
        <NextStepCard state={state} />
        <TaskDataCard task={task} />
      </div>
    </div>
  );
}

function SubmissionConfirmationPreview({ state, task }: { state: TaskLifecycleDefinition; task: TaskDefinition }) {
  return (
    <div className={styles.lifecycleStateGrid}>
      <Card className={styles.submissionConfirmation}>
        <span><Archive aria-hidden="true" /></span>
        <small>Экран подтверждения отправки</small>
        <h3>Результат будет зафиксирован отдельной версией</h3>
        <p>В демонстрации ничего не отправлено. После подключения сервиса здесь появятся номер версии, состав материалов и время приёма системой.</p>
        <dl><div><dt>Версия результата</dt><dd>Нет данных</dd></div><div><dt>Материалы</dt><dd>Нет данных</dd></div><div><dt>Время отправки</dt><dd>Нет данных</dd></div></dl>
      </Card>
      <div className={styles.lifecycleAsideCards}><NextStepCard state={state} /><TaskDataCard task={task} /></div>
    </div>
  );
}

function ReviewWaitingPreview({ state, task }: { state: TaskLifecycleDefinition; task: TaskDefinition }) {
  return (
    <div className={styles.lifecycleStateGrid}>
      <Card className={styles.reviewWaitingCard}>
        <span><Clock3 aria-hidden="true" /></span>
        <small>Экран ожидания проверки</small>
        <h3>Решение ещё не принято</h3>
        <p>Интерфейс не показывает вымышленного проверяющего, позиции в очереди или срока. Реальный ориентир появится из серверных данных.</p>
        <div className={styles.reviewWaitingTrack}><i /><i /><i /></div>
        <dl><div><dt>Очередь проверки</dt><dd>Не подключена</dd></div><div><dt>Ориентир по сроку</dt><dd>{task.reviewEstimate}</dd></div><div><dt>Решение</dt><dd>Нет данных</dd></div></dl>
      </Card>
      <div className={styles.lifecycleAsideCards}><NextStepCard state={state} /><ReviewerCommentPreview /></div>
    </div>
  );
}

function ReviewDecisionPreview({ state, task }: { state: TaskLifecycleDefinition; task: TaskDefinition }) {
  const decisionCopy = {
    clarification: {
      icon: MessageSquareText,
      title: "Как будет выглядеть запрос уточнения",
      body: "Проверяющий должен указать, какой информации не хватает и можно ли отправить новую версию.",
      action: "Подготовить уточнение",
    },
    confirmed: {
      icon: CheckCheck,
      title: "Как будет выглядеть подтверждённое решение",
      body: "Решение будет связано с конкретной версией результата. Points, Trust Score и VX Rewards появятся отдельно и только после реального подтверждения.",
      action: "Открыть сводку результата",
    },
    rejected: {
      icon: CircleOff,
      title: "Как будет выглядеть отклонённое решение",
      body: "Отклонение невозможно без понятной причины. В демонстрации причина не выдумывается и решение не считается вынесенным.",
      action: "Открыть варианты продолжения",
    },
  } as const;
  const copy = decisionCopy[state.status as keyof typeof decisionCopy];
  const Icon = copy.icon;

  return (
    <div className={styles.lifecycleStateGrid}>
      <Card className={styles.reviewDecisionCard} data-decision={state.status}>
        <div className={styles.stateCardHeading}><Icon aria-hidden="true" /><div><small>Экран решения проверки</small><h3>{copy.title}</h3></div></div>
        <div className={styles.demoDecisionNotice}><Info aria-hidden="true" /><p><strong>Решение отсутствует.</strong> Это демонстрация будущего состояния, а не результат пользователя.</p></div>
        <p className={styles.stateCardLead}>{copy.body}</p>
        <dl><div><dt>Версия результата</dt><dd>Нет данных</dd></div><div><dt>Причина решения</dt><dd>Нет данных</dd></div><div><dt>Автор и время</dt><dd>Нет данных</dd></div></dl>
        <UnavailableAction label={copy.action} />
        {state.status === "confirmed" && <EconomyImpactPreview />}
      </Card>
      <div className={styles.lifecycleAsideCards}><NextStepCard state={state} /><ReviewerCommentPreview /><TaskDataCard task={task} /></div>
    </div>
  );
}

function NextStepCard({ state }: { state: TaskLifecycleDefinition }) {
  return <Card className={styles.nextStepCard}><span><ShieldCheck aria-hidden="true" /></span><div><small>Что произойдёт дальше</small><h3>Следующий шаг</h3><p>{state.nextStep}</p></div></Card>;
}

function TaskDataCard({ task }: { task: TaskDefinition }) {
  return (
    <Card className={styles.taskDataCard}>
      <div className={styles.stateCardHeading}><FileText aria-hidden="true" /><div><small>Условия задания</small><h3>Контекст отправки</h3></div></div>
      <dl><div><dt>Версия условий</dt><dd>{task.conditionsVersion}</dd></div><div><dt>Срок</dt><dd>{task.deadline}</dd></div><div><dt>Повторная отправка</dt><dd>{task.resubmissionRule}</dd></div></dl>
    </Card>
  );
}

function ReviewerCommentPreview() {
  return (
    <Card className={styles.reviewerCommentCard}>
      <MessageSquareText aria-hidden="true" />
      <div><small>Комментарий проверяющего</small><h3>Нет данных</h3><p>Комментарий появится только вместе с реальным запросом или решением.</p></div>
    </Card>
  );
}

function UnavailableAction({ label, id }: { label: string; id?: string }) {
  return (
    <div className={styles.unavailableAction} id={id}>
      <Button disabled><LockKeyhole aria-hidden="true" />{label}</Button>
      <p>Будет доступно после подключения сервиса</p>
    </div>
  );
}

function TaskHistoryPreview() {
  return (
    <section className={styles.taskHistoryPreview} aria-labelledby="task-history-title">
      <div className={styles.taskHistoryHeading}><span><History aria-hidden="true" /></span><div><small>История изменений</small><h2 id="task-history-title">Событий пока нет</h2><p>После подключения сервиса здесь появятся неизменяемые записи о принятии, отправках, уточнениях и решениях.</p></div></div>
      <div className={styles.taskHistoryEmpty}><CircleDashed aria-hidden="true" /><div><strong>Нет зафиксированных событий</strong><p>Демонстрационные переключения состояния в историю не записываются.</p></div></div>
      <div className={styles.historyEventTypes}><span>Будущие типы записей</span><div><StatusPill tone="neutral">Принятие</StatusPill><StatusPill tone="neutral">Версия отправки</StatusPill><StatusPill tone="neutral">Комментарий</StatusPill><StatusPill tone="neutral">Решение</StatusPill></div></div>
    </section>
  );
}
