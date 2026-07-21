import { AdminSectionPage } from "@/components/admin/admin-section-page";

export default async function AdminSectionRoute({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <AdminSectionPage sectionId={section} />;
}
