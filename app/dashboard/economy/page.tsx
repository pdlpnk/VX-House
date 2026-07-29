import { EconomyOverview } from "@/components/economy/economy-overview";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function EconomyPage() {
  const { principal } = await requireProductWorkspaceContext("PLAYER", "/dashboard/economy");
  const service = getEconomyRewardService();
  const [snapshot, history] = await Promise.all([service.getSnapshot(principal), service.getHistory(principal)]);
  return <EconomyOverview snapshot={snapshot} history={history} historyHref="/dashboard/economy/history" rewardsHref="/dashboard/rewards" />;
}
