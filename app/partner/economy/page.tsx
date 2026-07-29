import { EconomyOverview } from "@/components/economy/economy-overview";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function EconomyPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/economy");
  const service = getEconomyRewardService();
  const [snapshot, history] = await Promise.all([service.getSnapshot(principal), service.getHistory(principal)]);
  return <EconomyOverview snapshot={snapshot} history={history} historyHref="/partner/economy/history" rewardsHref="/partner/rewards" />;
}
