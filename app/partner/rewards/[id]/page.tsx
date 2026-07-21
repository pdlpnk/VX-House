import { RewardDetail } from "@/components/rewards/reward-detail";

export default async function RewardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RewardDetail id={id} role="partner" basePath="/partner/rewards" supportHref="/partner/support" />;
}
