import { redirect } from "next/navigation";

export default async function NewSupportTicketPage() {
  redirect("/dashboard/support");
}
