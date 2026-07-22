import { AdminOverview } from "@/components/admin/admin-overview";
import { getAdminService, requireAdminWorkspace } from "@/lib/server";

export default async function AdminPage() {
  const principal = await requireAdminWorkspace();
  return <AdminOverview stats={await getAdminService().dashboard(principal)} />;
}
