import { RewardCatalog } from "@/components/rewards/reward-catalog";

export default function RewardsPage() {
  return <RewardCatalog role="player" basePath="/dashboard/rewards" historyHref="/dashboard/rewards/history" />;
}
