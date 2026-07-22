import { AdminEntityEditor } from "@/components/admin/admin-entity-editor";
import { adminSectionIds, type AdminSectionId } from "@/lib/admin";
import { getAdminService, requireAdminWorkspace } from "@/lib/server";
import { notFound } from "next/navigation";

export default async function AdminEntityEditRoute({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  if (!adminSectionIds.includes(section as AdminSectionId)) notFound();
  const principal = await requireAdminWorkspace();
  const record = await getAdminService().get(principal, section as AdminSectionId, id);
  return <AdminEntityEditor sectionId={section} entityId={id} record={record} />;
}
