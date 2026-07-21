import { AdminEntityEditor } from "@/components/admin/admin-entity-editor";

export default async function AdminEntityEditRoute({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <AdminEntityEditor sectionId={section} entityId={id} />;
}
