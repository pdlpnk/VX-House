import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { getSupportStatus } from "@/lib/support-data";
import type { SupportStatus } from "@/lib/support";
export function SupportStatusPill({ status }: { status: SupportStatus }) { const definition = getSupportStatus(status); return <StatusPill tone={definition.tone}>{definition.label}</StatusPill>; }
