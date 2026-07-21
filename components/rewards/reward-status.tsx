import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { getRewardStatus, type RewardStatus } from "@/lib/reward-data";

export function RewardStatusPill({ status }: { status: RewardStatus }) {
  const definition = getRewardStatus(status);
  return <StatusPill tone={definition.tone}>{definition.label}</StatusPill>;
}
