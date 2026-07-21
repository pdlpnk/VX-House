import { AdminEntityDetail } from "@/components/admin/admin-entity-detail";

export default async function AdminEntityRoute({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  return <AdminEntityDetail sectionId={section} entityId={id} />;
}
