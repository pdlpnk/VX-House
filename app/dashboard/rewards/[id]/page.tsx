import { RewardDetail } from "@/components/rewards/reward-detail";
import { ApplicationError } from "@/lib/application";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function RewardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { principal } = await requireProductWorkspaceContext("PLAYER", `/dashboard/rewards/${id}`);
  let reward = null;
  try { reward = await getEconomyRewardService().getReward(principal, id); } catch (error) { if (!(error instanceof ApplicationError) || error.code !== "NOT_FOUND") throw error; }
  return <RewardDetail reward={reward} role="player" basePath="/dashboard/rewards" supportHref="/dashboard/support" />;
}
