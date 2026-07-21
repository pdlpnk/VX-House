import { SupportTicketDetail } from "@/components/support/support-ticket-detail";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupportTicketDetail id={id} role="player" basePath="/dashboard/support" />;
}
