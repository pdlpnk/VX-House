import { EconomyOverview } from "@/components/economy/economy-overview";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function EconomyPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/economy");
  return <EconomyOverview snapshot={await getEconomyRewardService().getSnapshot(principal)} historyHref="/partner/economy/history" rewardsHref="/partner/rewards" />;
}
