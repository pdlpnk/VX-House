import { DashboardHome } from "@/components/dashboard/pages/dashboard-home";
import { getEconomyRewardService, getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

export default async function DashboardPage() {
  const { principal } = await requireProductWorkspaceContext("PLAYER", "/dashboard");
  const platform = getPlatformOperationsService();
  const [economy, summary, forecasts, promocodes] = await Promise.all([getEconomyRewardService().getSnapshot(principal), platform.workspaceSummary(principal), platform.listForecasts(principal), platform.listPromocodes(principal)]);
  return <DashboardHome economy={economy} summary={summary} forecasts={forecasts} promocodes={promocodes} />;
}
