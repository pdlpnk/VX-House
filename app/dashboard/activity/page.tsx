import { DashboardActivityPage } from "@/components/dashboard/pages/dashboard-activity-page";
import { getPlatformOperationsService, requireProductWorkspaceContext } from "@/lib/server";

export default async function ActivityPage() {
  const { principal } = await requireProductWorkspaceContext("PLAYER", "/dashboard/activity");
  return <DashboardActivityPage events={await getPlatformOperationsService().activity(principal)} />;
}
