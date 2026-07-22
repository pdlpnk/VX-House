import { SupportCenter } from "@/components/support/support-center";
import { getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export default async function SupportPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/support"); const service = getSupportNotificationService();
  return <SupportCenter categories={await service.listCategories(principal)} tickets={await service.listConversations(principal)} basePath="/partner/support" />;
}
