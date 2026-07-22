import { BadgeCheck, CircleDashed, CircleOff, Clock3 } from "lucide-react";

import { StatusPill } from "@/components/dashboard/dashboard-ui";

export type OpportunityDisplayStatus = "AVAILABLE" | "UNAVAILABLE" | "PENDING" | "NO_DATA";
const config = {
  AVAILABLE: { label: "Доступно", icon: BadgeCheck, tone: "success" },
  UNAVAILABLE: { label: "Недоступно", icon: CircleOff, tone: "neutral" },
  PENDING: { label: "Ожидает проверки", icon: Clock3, tone: "attention" },
  NO_DATA: { label: "Нет данных", icon: CircleDashed, tone: "neutral" },
} as const;

export function OpportunityStatusBadge({ status }: { status: OpportunityDisplayStatus }) {
  const item = config[status];
  return <StatusPill tone={item.tone}><item.icon aria-hidden="true" />{item.label}</StatusPill>;
}
