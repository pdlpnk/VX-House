import { PartnerHistoryPage } from "@/components/partner/pages/partner-history-page";
import { getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

export default async function HistoryPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/history");
  return <PartnerHistoryPage events={await getPlatformOperationsService().activity(principal)} />;
}
