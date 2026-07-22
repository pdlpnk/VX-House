import { OpportunityCatalog } from "@/components/opportunities/opportunity-catalog";
import { getOpportunityTaskService, requireProductWorkspaceContext } from "@/lib/server";

export default async function OpportunitiesPage() {
  const { principal } = await requireProductWorkspaceContext("PLAYER", "/dashboard/opportunities");
  const items = await getOpportunityTaskService().list(principal);
  return <OpportunityCatalog role="PLAYER" basePath="/dashboard/opportunities" initialItems={items} />;
}
