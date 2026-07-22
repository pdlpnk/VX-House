import { StatusPill } from "@/components/dashboard/dashboard-ui";
import type { RewardStatus } from "@/lib/economy";

const labels: Record<RewardStatus, string> = { EXPECTED: "Ожидается", AWAITING_CONFIRMATION: "Ожидает подтверждения", CONFIRMED: "Подтверждён", PREPARING: "Готовится", AVAILABLE: "Доступен", PROVIDED: "Предоставлен", REJECTED: "Отклонён", CANCELLED: "Отменён", EXPIRED: "Истёк" };
export function RewardStatusPill({ status }: { status: RewardStatus }) { return <StatusPill tone={status === "AVAILABLE" || status === "PROVIDED" ? "success" : status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED" ? "attention" : "neutral"}>{labels[status]}</StatusPill>; }
export function rewardStatusLabel(status: RewardStatus) { return labels[status]; }
