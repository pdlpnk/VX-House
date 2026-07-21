import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";

export default async function PartnerOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OpportunityDetail id={id} role="partner" basePath="/partner/opportunities" taskBasePath="/partner/tasks" />;
}
