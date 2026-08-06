import { AdminOverview } from "@/components/admin/admin-overview";
import { getAdminService, getAnalyticsSystem, requireAdminWorkspace } from "@/lib/server";

export default async function AdminPage() {
  const principal = await requireAdminWorkspace();
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86_400_000);
  return <AdminOverview stats={await getAdminService().dashboard(principal)} funnel={await getAnalyticsSystem().service.funnel(from, to)} />;
}
