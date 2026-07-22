import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { adminSectionIds, type AdminListQuery, type AdminSectionId } from "@/lib/admin";
import { notFound } from "next/navigation";
import { getAdminService, requireAdminWorkspace } from "@/lib/server";

export default async function AdminSectionRoute({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section } = await params;
  if (!adminSectionIds.includes(section as AdminSectionId)) notFound();
  const queryRaw = await searchParams; const value = (key: string) => typeof queryRaw[key] === "string" ? queryRaw[key] as string : undefined;
  const query: AdminListQuery = { search: value("search"), status: value("status"), role: value("role") as AdminListQuery["role"], market: value("market") as AdminListQuery["market"], cursor: value("cursor") };
  const principal = await requireAdminWorkspace();
  const data = await getAdminService().list(principal, section as AdminSectionId, query);
  return <AdminSectionPage sectionId={section} data={data} query={query} />;
}
