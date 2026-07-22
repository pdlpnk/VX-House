import { RewardHistory } from "@/components/rewards/reward-history";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function RewardsHistoryPage() {
  const { principal } = await requireProductWorkspaceContext("PLAYER", "/dashboard/rewards/history");
  return <RewardHistory rewards={await getEconomyRewardService().listRewards(principal)} catalogHref="/dashboard/rewards" />;
}
