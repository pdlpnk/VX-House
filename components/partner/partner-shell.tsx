"use client";

import { BriefcaseBusiness, ChartNoAxesCombined, FolderOpen, Gift, Handshake, History, MessageCircle, UserRound } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { PARTNER_PREFERENCES_KEY, defaultPartnerPreferences } from "@/lib/partner-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";

const partnerConfig = {
  kind: "partner" as const,
  labelKey: "workspace.partnerArea" as const,
  rootHref: "/partner",
  profileHref: "/partner/profile",
  profileRoleKey: "workspace.partner" as const,
  storageKey: PARTNER_PREFERENCES_KEY,
  defaultPreferences: defaultPartnerPreferences,
  navigation: [
    { labelKey: "nav.home" as const, href: "/partner", icon: BriefcaseBusiness },
    { labelKey: "nav.opportunities" as const, href: "/partner/opportunities", icon: Handshake },
    { labelKey: "nav.economy" as const, href: "/partner/economy", icon: ChartNoAxesCombined },
    { labelKey: "nav.rewards" as const, href: "/partner/rewards", icon: Gift },
    { labelKey: "nav.manager" as const, href: "/partner/support", icon: MessageCircle },
    { labelKey: "nav.materials" as const, href: "/partner/materials", icon: FolderOpen },
    { labelKey: "nav.forecasts" as const, href: "/partner/forecasts", icon: ChartNoAxesCombined },
    { labelKey: "nav.history" as const, href: "/partner/history", icon: History },
    { labelKey: "nav.profile" as const, href: "/partner/profile", icon: UserRound },
  ],
  pageTitles: {
    "/partner": "page.home" as const,
    "/partner/opportunities": "nav.opportunities" as const,
    "/partner/economy": "nav.economy" as const,
    "/partner/economy/history": "nav.history" as const,
    "/partner/rewards": "nav.rewards" as const,
    "/partner/rewards/history": "nav.history" as const,
    "/partner/support": "nav.manager" as const,
    "/partner/support/new": "nav.manager" as const,
    "/partner/materials": "nav.materials" as const,
    "/partner/forecasts": "nav.forecasts" as const,
    "/partner/history": "nav.history" as const,
    "/partner/profile": "nav.profile" as const,
  },
  pageTitlePrefixes: {
    "/partner/opportunities/": "page.opportunity" as const,
    "/partner/tasks/": "page.task" as const,
    "/partner/rewards/": "page.reward" as const,
    "/partner/support/": "nav.manager" as const,
  },
  notificationTextKey: "workspace.noEvents" as const,
};

export function PartnerShell({ children, profile, notifications, personalConversation }: { children: React.ReactNode; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView }) {
  return <WorkspaceShell config={partnerConfig} profile={profile} notifications={notifications} personalConversation={personalConversation}>{children}</WorkspaceShell>;
}
