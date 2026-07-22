import { RewardCatalog } from "@/components/rewards/reward-catalog";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function RewardsPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/rewards");
  return <RewardCatalog items={await getEconomyRewardService().listRewards(principal)} basePath="/partner/rewards" historyHref="/partner/rewards/history" />;
}
