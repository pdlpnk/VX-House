import { SupportNewTicket } from "@/components/support/support-new-ticket";
import { getSupportNotificationService, requireProductWorkspaceContext } from "@/lib/server";

export default async function NewSupportTicketPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { principal, profile } = await requireProductWorkspaceContext("PARTNER", "/partner/support/new");
  const query = await searchParams; const relatedType = query.relatedType === "USER_TASK" || query.relatedType === "REWARD" ? query.relatedType : undefined; const relatedId = typeof query.relatedId === "string" ? query.relatedId : undefined;
  return <SupportNewTicket categories={await getSupportNotificationService().listCategories(principal)} role="PARTNER" market={profile.market.name} basePath="/partner/support" initialCategory={query.category === "appeal" ? "appeal" : undefined} relatedType={relatedType} relatedId={relatedId} />;
}
