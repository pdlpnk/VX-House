import { TaskDetail } from "@/components/opportunities/task-detail";

export default async function PlayerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetail id={id} role="player" opportunityBasePath="/dashboard/opportunities" supportHref="/dashboard/support" />;
}
