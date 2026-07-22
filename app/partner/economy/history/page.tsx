import { EconomyHistory } from "@/components/economy/economy-history";
import { getEconomyRewardService, requireProductWorkspaceContext } from "@/lib/server";

export default async function EconomyHistoryPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/economy/history");
  return <EconomyHistory history={await getEconomyRewardService().getHistory(principal)} overviewHref="/partner/economy" />;
}
