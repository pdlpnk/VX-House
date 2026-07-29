import { PartnerHome } from "@/components/partner/pages/partner-home";
import { createLogger } from "@/lib/logger";
import { getEconomyRewardService, getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

const logger = createLogger({ level: "info", context: { component: "partner-dashboard" } });

export default async function PartnerPage() {
  const { principal, correlationId, database } = await requireProductWorkspaceContext("PARTNER", "/partner");
  const economy = await getEconomyRewardService(database).getSnapshot(principal);
  const summary = await getPlatformOperationsService(database).workspaceSummary(principal);
  logger.info("dashboard_data_loaded", {
    correlationId,
    userId: principal.userId,
    role: "PARTNER",
  });
  return <PartnerHome economy={economy} summary={summary} />;
}
