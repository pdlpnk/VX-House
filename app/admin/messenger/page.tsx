import { AdminMessengerWorkspace } from "@/components/admin/admin-messenger-workspace";
import { getAdminMessengerService, requireAdminWorkspace } from "@/lib/server";

export default async function AdminMessengerPage() {
  const principal = await requireAdminWorkspace();
  const service = getAdminMessengerService();
  const list = await service.list(principal);
  const detail = list.items[0] ? await service.detail(principal, list.items[0].conversationId) : null;
  return <AdminMessengerWorkspace initialList={list} initialDetail={detail} />;
}
