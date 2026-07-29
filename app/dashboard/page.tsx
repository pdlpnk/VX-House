import { DashboardHome } from "@/components/dashboard/pages/dashboard-home";
import { createLogger } from "@/lib/logger";
import { getEconomyRewardService, getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

const logger = createLogger({ level: "info", context: { component: "player-dashboard" } });

export default async function DashboardPage() {
  const { principal, correlationId, database } = await requireProductWorkspaceContext("PLAYER", "/dashboard");
  const platform = getPlatformOperationsService(database);
  const economy = await getEconomyRewardService(database).getSnapshot(principal);
  const summary = await platform.workspaceSummary(principal);
  const forecasts = await platform.listForecasts(principal);
  const promocodes = await platform.listPromocodes(principal);
  const activity = await platform.activity(principal);
  logger.info("dashboard_data_loaded", {
    correlationId,
    userId: principal.userId,
    forecastCount: forecasts.length,
    promocodeCount: promocodes.length,
  });
  return <DashboardHome economy={economy} summary={summary} activity={activity} forecasts={forecasts} promocodes={promocodes} />;
}
