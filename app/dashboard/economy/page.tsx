import { EconomyOverview } from "@/components/economy/economy-overview";

export default function EconomyPage() {
  return <EconomyOverview role="player" historyHref="/dashboard/economy/history" rewardsHref="/dashboard/rewards" />;
}
