import { PartnerMaterialsPage } from "@/components/partner/pages/partner-materials-page";
import { getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

export default async function MaterialsPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/materials");
  return <PartnerMaterialsPage promocodes={await getPlatformOperationsService().listPromocodes(principal)} />;
}
