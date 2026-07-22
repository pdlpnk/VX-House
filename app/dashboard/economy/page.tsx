import { EconomyOverview } from "@/components/economy/economy-overview";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function EconomyPage() {
  const { principal } = await requireProductWorkspaceContext("PLAYER", "/dashboard/economy");
  return <EconomyOverview snapshot={await getEconomyRewardService().getSnapshot(principal)} historyHref="/dashboard/economy/history" rewardsHref="/dashboard/rewards" />;
}
