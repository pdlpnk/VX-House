"use client";

import { CircleDashed, FileCheck2, Gift, History, Info, Link2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useI18n } from "@/components/i18n/i18n-provider";
import { RewardStatusPill, rewardStatusKeys } from "@/components/rewards/reward-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RewardView } from "@/lib/economy";

export function RewardLifecycle({ reward }: { reward: RewardView }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function claim() {
    setPending(true); setMessage("");
    try {
      const response = await fetch(`/api/rewards/${reward.id}/claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: `claim-${reward.id}-${crypto.randomUUID()}` }) });
      const payload = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? t("rewardLife.claimError"));
      setMessage(t("rewardLife.claimed")); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : t("rewardLife.actionError")); }
    finally { setPending(false); }
  }

  return <>
    <section className={styles.rewardLifecycle} aria-labelledby="reward-lifecycle-title"><header><div><span>{t("rewardLife.currentStatus")}</span><h2 id="reward-lifecycle-title">{t("rewardLife.lifecycle")}</h2><p>{reward.availabilityReason}</p></div><RewardStatusPill status={reward.status} /></header></section>
    <section className={styles.rewardStatePanel} aria-live="polite">
      <header className={styles.rewardStateHeader}><span><Gift aria-hidden="true" /></span><div><small>{t("rewardLife.currentStatus")}</small><h2>{t(rewardStatusKeys[reward.status])}</h2><p>{t("rewardLife.statusHint")}</p></div><RewardStatusPill status={reward.status} /></header>
      <div className={styles.rewardStateGrid}>
        <Card className={styles.rewardStateCard}>
          <div className={styles.stateCardHeading}><FileCheck2 aria-hidden="true" /><div><small>{t("rewardLife.transparency")}</small><h3>{t("rewardLife.basisHistory")}</h3></div></div>
          <dl><div><dt>{t("rewardLife.type")}</dt><dd>{reward.typeName}</dd></div><div><dt>{t("rewardUi.relatedTask")}</dt><dd>{reward.userTaskId ? t("rewardLife.related") : t("rewardLife.notRelated")}</dd></div><div><dt>{t("rewardLife.eventCount")}</dt><dd>{reward.history.length}</dd></div><div><dt>{t("rewardLife.validUntil")}</dt><dd>{reward.validUntil ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(reward.validUntil)) : t("rewardLife.noDeadline")}</dd></div></dl>
          <div className={styles.sourceDecisionNotice}><Info aria-hidden="true" /><p><strong>{t("rewardLife.separateTitle")}</strong> {t("rewardLife.separateText")}</p></div>
        </Card>
        <div className={styles.rewardStateAside}><Card><Link2 aria-hidden="true" /><div><small>{t("rewardLife.next")}</small><h3>{t("rewardLife.nextStep")}</h3><p>{reward.availabilityReason}</p></div></Card><div className={styles.unavailableAction}><Button disabled={pending || reward.availability !== "CLAIMABLE"} onClick={claim}><LockKeyhole aria-hidden="true" />{pending ? t("rewardLife.processing") : t("rewardLife.claim")}</Button>{message && <p role="status">{message}</p>}</div></div>
      </div>
    </section>
    <section className={styles.rewardHistoryPreview} aria-labelledby="reward-history-preview-title"><div><span><History aria-hidden="true" /></span><div><small>{t("rewardLife.changeHistory")}</small><h2 id="reward-history-preview-title">{reward.history.length ? t("rewardLife.events", { count: reward.history.length }) : t("rewardLife.noRecords")}</h2><p>{t("rewardLife.historyText")}</p></div></div>{reward.history.map((event) => <div key={event.id}><CircleDashed aria-hidden="true" /><p><strong>{t(rewardStatusKeys[event.toStatus])}</strong> · {event.reason} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}</p></div>)}</section>
  </>;
}
