import { TaskDetail } from "@/components/opportunities/task-detail";
import { getOpportunityTaskService, requireProductWorkspaceContext } from "@/lib/server";

export default async function PartnerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { principal } = await requireProductWorkspaceContext("PARTNER", `/partner/tasks/${id}`);
  const task = await getOpportunityTaskService().getTask(principal, id).catch(() => null);
  return <TaskDetail task={task} opportunityBasePath="/partner/opportunities" supportHref="/partner/support" />;
}
