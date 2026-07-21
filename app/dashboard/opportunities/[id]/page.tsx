import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";

export default async function PlayerOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OpportunityDetail id={id} role="player" basePath="/dashboard/opportunities" taskBasePath="/dashboard/tasks" />;
}
