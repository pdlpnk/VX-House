import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";
import { getOpportunityTaskService, requireProductWorkspaceContext } from "@/lib/server";

export default async function PartnerOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { principal } = await requireProductWorkspaceContext("PARTNER", `/partner/opportunities/${id}`);
  const opportunity = await getOpportunityTaskService().getOpportunity(principal, id).catch(() => null);
  return <OpportunityDetail opportunity={opportunity} basePath="/partner/opportunities" taskBasePath="/partner/tasks" />;
}
