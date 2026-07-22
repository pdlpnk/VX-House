import { AdminEntityDetail } from "@/components/admin/admin-entity-detail";
import { adminSectionIds, type AdminSectionId } from "@/lib/admin";
import { getAdminService, requireAdminWorkspace } from "@/lib/server";
import { notFound } from "next/navigation";

export default async function AdminEntityRoute({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  if (!adminSectionIds.includes(section as AdminSectionId)) notFound();
  if (id === "new") return <AdminEntityDetail sectionId={section} entityId={id} create />;
  const principal = await requireAdminWorkspace();
  const record = await getAdminService().get(principal, section as AdminSectionId, id);
  return <AdminEntityDetail sectionId={section} entityId={id} record={record} />;
}
