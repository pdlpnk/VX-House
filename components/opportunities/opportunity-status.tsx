import { CircleDashed, CircleOff, Clock3, DatabaseZap } from "lucide-react";

import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { opportunityStatusLabels, type OpportunityStatus } from "@/lib/opportunity-data";

const statusConfig = {
  unavailable: { icon: CircleOff, tone: "neutral" },
  soon: { icon: Clock3, tone: "attention" },
  "awaiting-service": { icon: DatabaseZap, tone: "brand" },
  "no-data": { icon: CircleDashed, tone: "neutral" },
} as const;

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  const { icon: Icon, tone } = statusConfig[status];

  return (
    <StatusPill tone={tone}>
      <Icon aria-hidden="true" />
      {opportunityStatusLabels[status]}
    </StatusPill>
  );
}
