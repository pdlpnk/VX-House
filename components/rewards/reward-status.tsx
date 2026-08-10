"use client";

import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { RewardStatus } from "@/lib/economy";

export const rewardStatusKeys = { EXPECTED: "reward.statusExpected", AWAITING_CONFIRMATION: "reward.statusAwaiting", CONFIRMED: "reward.statusConfirmed", PREPARING: "reward.statusPreparing", AVAILABLE: "reward.statusAvailable", PROVIDED: "reward.statusProvided", REJECTED: "reward.statusRejected", CANCELLED: "reward.statusCancelled", EXPIRED: "reward.statusExpired" } as const satisfies Record<RewardStatus, string>;
export function RewardStatusPill({ status }: { status: RewardStatus }) { const { t } = useI18n(); return <StatusPill tone={status === "AVAILABLE" || status === "PROVIDED" ? "success" : status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED" ? "attention" : "neutral"}>{t(rewardStatusKeys[status])}</StatusPill>; }
