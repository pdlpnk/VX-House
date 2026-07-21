import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { getSupportStatus, type SupportStatus } from "@/lib/support-data";

export function SupportStatusPill({ status }: { status: SupportStatus }) {
  const definition = getSupportStatus(status);
  return <StatusPill tone={definition.tone}>{definition.label}</StatusPill>;
}
