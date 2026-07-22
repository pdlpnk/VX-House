import { OpportunityCatalog } from "@/components/opportunities/opportunity-catalog";
import { getOpportunityTaskService, requireProductWorkspaceContext } from "@/lib/server";

export default async function OpportunitiesPage() {
  const { principal } = await requireProductWorkspaceContext("PARTNER", "/partner/opportunities");
  const items = await getOpportunityTaskService().list(principal);
  return <OpportunityCatalog role="PARTNER" basePath="/partner/opportunities" initialItems={items} />;
}
