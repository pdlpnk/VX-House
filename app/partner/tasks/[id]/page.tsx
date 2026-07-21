import { TaskDetail } from "@/components/opportunities/task-detail";

export default async function PartnerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetail id={id} role="partner" opportunityBasePath="/partner/opportunities" supportHref="/partner/support" />;
}
