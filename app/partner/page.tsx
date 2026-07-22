import { PartnerHome } from "@/components/partner/pages/partner-home";
import { getEconomyRewardService, getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

export default async function PartnerPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner");
  const [economy, summary] = await Promise.all([getEconomyRewardService().getSnapshot(principal), getPlatformOperationsService().workspaceSummary(principal)]);
  return <PartnerHome economy={economy} summary={summary} />;
}
