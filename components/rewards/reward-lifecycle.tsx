"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CalendarX2, CircleDashed, CircleX, Clock3, FileCheck2, Gift, History, Info, Link2, LockKeyhole, PackageCheck, type LucideIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { RewardStatusPill } from "@/components/rewards/reward-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRewardStatus, rewardStatuses, type RewardStatus, type RewardTypeDefinition } from "@/lib/reward-data";

const statusIcons: Record<RewardStatus, LucideIcon> = {
  expected: CircleDashed,
  "awaiting-confirmation": Clock3,
  preparing: Gift,
  available: BadgeCheck,
  provided: PackageCheck,
  rejected: CircleX,
  expired: CalendarX2,
};

export function RewardLifecycle({ reward }: { reward: RewardTypeDefinition }) {
  const [activeStatus, setActiveStatus] = useState<RewardStatus>("expected");
  const { shouldReduceMotion } = useDashboard();
  const state = getRewardStatus(activeStatus);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % rewardStatuses.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + rewardStatuses.length) % rewardStatuses.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = rewardStatuses.length - 1;
    else return;
    event.preventDefault();
    const nextStatus = rewardStatuses[nextIndex].status;
    setActiveStatus(nextStatus);
    window.requestAnimationFrame(() => document.getElementById(`reward-state-${nextStatus}`)?.focus());
  }

  const Icon = statusIcons[state.status];
  return <>
    <section className={styles.rewardLifecycle} aria-labelledby="reward-lifecycle-title">
      <header><div><span>Frontend-предпросмотр</span><h2 id="reward-lifecycle-title">Жизненный цикл Reward</h2><p>Переключение показывает смысл будущего статуса, но не изменяет Reward и не записывает события.</p></div><StatusPill tone="neutral">7 демонстрационных состояний</StatusPill></header>
      <div className={styles.rewardLifecycleTabs} role="tablist" aria-label="Демонстрационные состояния VX Reward">
        {rewardStatuses.map((item, index) => { const TabIcon = statusIcons[item.status]; const selected = item.status === activeStatus; return <button key={item.status} type="button" role="tab" id={`reward-state-${item.status}`} aria-controls="reward-state-panel" aria-selected={selected} tabIndex={selected ? 0 : -1} data-active={selected || undefined} onClick={() => setActiveStatus(item.status)} onKeyDown={(event) => handleKeyDown(event, index)}><span>{index + 1}</span><TabIcon aria-hidden="true" /><strong>{item.label}</strong><small>{item.phase}</small></button>; })}
      </div>
    </section>
    <AnimatePresence mode="wait" initial={false}>
      <motion.section key={activeStatus} id="reward-state-panel" role="tabpanel" aria-labelledby={`reward-state-${activeStatus}`} aria-live="polite" className={styles.rewardStatePanel} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
        <header className={styles.rewardStateHeader}><span><Icon aria-hidden="true" /></span><div><small>{state.phase} · демонстрационное состояние</small><h2>{state.label}</h2><p>{state.description}</p></div><RewardStatusPill status={state.status} /></header>
        <div className={styles.rewardStateGrid}>
          <Card className={styles.rewardStateCard}><div className={styles.stateCardHeading}><FileCheck2 aria-hidden="true" /><div><small>Прозрачность решения</small><h3>Основание и причина статуса</h3></div></div><p className={styles.stateCardLead}>{state.reasonRequirement}</p><dl><div><dt>Тип Reward</dt><dd>{reward.title}</dd></div><div><dt>Причина изменения</dt><dd>Нет данных</dd></div><div><dt>Связанное задание</dt><dd>Не назначено</dd></div><div><dt>Версия условий</dt><dd>Не подключена</dd></div><div><dt>Дата и автор решения</dt><dd>Нет данных</dd></div></dl><div className={styles.demoDecisionNotice}><Info aria-hidden="true" /><p><strong>Статус не применён.</strong> Это демонстрация будущего интерфейса, а не событие пользователя.</p></div></Card>
          <div className={styles.rewardStateAside}><Card><Link2 aria-hidden="true" /><div><small>Что произойдёт дальше</small><h3>Следующий шаг</h3><p>{state.nextStep}</p></div></Card><div className={styles.unavailableAction}><Button disabled><LockKeyhole aria-hidden="true" />Продолжить со статусом</Button><p>Будет доступно после подключения сервиса</p></div></div>
        </div>
      </motion.section>
    </AnimatePresence>
    <section className={styles.rewardHistoryPreview} aria-labelledby="reward-history-preview-title"><div><span><History aria-hidden="true" /></span><div><small>История изменений Reward</small><h2 id="reward-history-preview-title">Записей пока нет</h2><p>После подключения сервиса здесь появятся основание, переход статуса, причина, связанное задание и подтверждающая запись.</p></div></div><div><CircleDashed aria-hidden="true" /><p><strong>Демонстрационные переключения не сохраняются.</strong> История останется пустой до появления серверного события.</p></div></section>
  </>;
}
