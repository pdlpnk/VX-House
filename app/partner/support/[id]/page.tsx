import { SupportTicketDetail } from "@/components/support/support-ticket-detail";
import { ApplicationError } from "@/lib/application";
import { getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { principal } = await requireProductWorkspaceContext("PARTNER", `/partner/support/${id}`); let ticket = null;
  try { ticket = await getSupportNotificationService().getConversation(principal, id); } catch (error) { if (!(error instanceof ApplicationError) || error.code !== "NOT_FOUND") throw error; }
  return <SupportTicketDetail ticket={ticket} basePath="/partner/support" />;
}
