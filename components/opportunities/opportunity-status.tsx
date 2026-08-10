"use client";

import { BadgeCheck, CircleDashed, CircleOff, Clock3 } from "lucide-react";

import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { useI18n } from "@/components/i18n/i18n-provider";

export type OpportunityDisplayStatus = "AVAILABLE" | "UNAVAILABLE" | "PENDING" | "NO_DATA";
const config = {
  AVAILABLE: { key: "status.available" as const, icon: BadgeCheck, tone: "success" },
  UNAVAILABLE: { key: "status.unavailable" as const, icon: CircleOff, tone: "neutral" },
  PENDING: { key: "status.pendingReview" as const, icon: Clock3, tone: "attention" },
  NO_DATA: { key: "status.noData" as const, icon: CircleDashed, tone: "neutral" },
} as const;

export function OpportunityStatusBadge({ status }: { status: OpportunityDisplayStatus }) {
  const { t } = useI18n();
  const item = config[status];
  return <StatusPill tone={item.tone}><item.icon aria-hidden="true" />{t(item.key)}</StatusPill>;
}
