import { PartnerForecastsPage } from "@/components/partner/pages/partner-forecasts-page";
import { getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

export default async function ForecastsPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/forecasts");
  return <PartnerForecastsPage forecasts={await getPlatformOperationsService().listForecasts(principal)} />;
}
