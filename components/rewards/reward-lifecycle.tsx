"use client";

import { CircleDashed, FileCheck2, Gift, History, Info, Link2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { RewardStatusPill, rewardStatusLabel } from "@/components/rewards/reward-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";

export function RewardLifecycle({ reward }: { reward: RewardView }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function claim() {
    setPending(true); setMessage("");
    try {
      const response = await fetch(`/api/rewards/${reward.id}/claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: `claim-${reward.id}-${crypto.randomUUID()}` }) });
      const payload = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Не удалось получить Reward");
      setMessage("Reward предоставлен. История обновлена."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось выполнить действие"); }
    finally { setPending(false); }
  }

  return <>
    <section className={styles.rewardLifecycle} aria-labelledby="reward-lifecycle-title"><header><div><span>Текущий статус</span><h2 id="reward-lifecycle-title">Жизненный цикл Reward</h2><p>{reward.availabilityReason}</p></div><RewardStatusPill status={reward.status} /></header></section>
    <section className={styles.rewardStatePanel} aria-live="polite">
      <header className={styles.rewardStateHeader}><span><Gift aria-hidden="true" /></span><div><small>Текущий статус</small><h2>{rewardStatusLabel(reward.status)}</h2><p>Статус обновится после подтверждения действия.</p></div><RewardStatusPill status={reward.status} /></header>
      <div className={styles.rewardStateGrid}>
        <Card className={styles.rewardStateCard}>
          <div className={styles.stateCardHeading}><FileCheck2 aria-hidden="true" /><div><small>Прозрачность решения</small><h3>Основание и история</h3></div></div>
          <dl><div><dt>Тип Reward</dt><dd>{reward.typeName}</dd></div><div><dt>Связанное задание</dt><dd>{reward.userTaskId ? "Связано" : "Не связано"}</dd></div><div><dt>Событий в истории</dt><dd>{reward.history.length}</dd></div><div><dt>Срок действия</dt><dd>{reward.validUntil ? new Intl.DateTimeFormat("ru", { dateStyle: "medium" }).format(new Date(reward.validUntil)) : "Без опубликованного срока"}</dd></div></dl>
          <div className={styles.sourceDecisionNotice}><Info aria-hidden="true" /><p><strong>VX Reward и VX Points учитываются отдельно.</strong> Получение преимущества не изменяет ваш баланс Points.</p></div>
        </Card>
        <div className={styles.rewardStateAside}><Card><Link2 aria-hidden="true" /><div><small>Что дальше</small><h3>Следующий шаг</h3><p>{reward.availabilityReason}</p></div></Card><div className={styles.unavailableAction}><Button disabled={pending || reward.availability !== "CLAIMABLE"} onClick={claim}><LockKeyhole aria-hidden="true" />{pending ? "Обрабатываем…" : "Получить Reward"}</Button>{message && <p role="status">{message}</p>}</div></div>
      </div>
    </section>
    <section className={styles.rewardHistoryPreview} aria-labelledby="reward-history-preview-title"><div><span><History aria-hidden="true" /></span><div><small>История изменений Reward</small><h2 id="reward-history-preview-title">{reward.history.length ? `${reward.history.length} событий` : "Записей пока нет"}</h2><p>Здесь сохраняются статусы, причины и время изменений.</p></div></div>{reward.history.map((event) => <div key={event.id}><CircleDashed aria-hidden="true" /><p><strong>{rewardStatusLabel(event.toStatus)}</strong> · {event.reason} · {new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}</p></div>)}</section>
  </>;
}
