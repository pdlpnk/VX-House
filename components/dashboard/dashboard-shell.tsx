"use client";

import { ChartNoAxesCombined, Compass, Gift, House, LogOut, MessageCircle, Settings } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { DASHBOARD_PREFERENCES_KEY, defaultDashboardPreferences } from "@/lib/dashboard-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";
import type { EconomySnapshotView } from "@/lib/economy";

const playerConfig = {
  kind: "player" as const,
  labelKey: "workspace.playerArea" as const,
  rootHref: "/dashboard",
  profileHref: "/dashboard/profile",
  profileRoleKey: "workspace.player" as const,
  storageKey: DASHBOARD_PREFERENCES_KEY,
  defaultPreferences: defaultDashboardPreferences,
  navigation: [
    { labelKey: "nav.home" as const, href: "/dashboard", icon: House },
    { labelKey: "nav.tasks" as const, href: "/dashboard/opportunities", icon: Compass },
    { labelKey: "nav.progress" as const, href: "/dashboard/economy", icon: ChartNoAxesCombined },
    { labelKey: "nav.rewards" as const, href: "/dashboard/rewards", icon: Gift },
    { labelKey: "progress.manager" as const, href: "/dashboard/support", icon: MessageCircle },
    { labelKey: "nav.settings" as const, href: "/dashboard/settings", icon: Settings },
    { labelKey: "nav.logout" as const, href: "/access?mode=login", icon: LogOut, action: "logout" as const },
  ],
  pageTitles: {
    "/dashboard": "page.home" as const,
    "/dashboard/profile": "page.profile" as const,
    "/dashboard/opportunities": "page.tasks" as const,
    "/dashboard/economy": "page.progress" as const,
    "/dashboard/economy/history": "page.pointsHistory" as const,
    "/dashboard/rewards": "page.rewards" as const,
    "/dashboard/rewards/history": "page.rewardsHistory" as const,
    "/dashboard/activity": "page.activity" as const,
    "/dashboard/support": "progress.manager" as const,
    "/dashboard/support/new": "progress.manager" as const,
    "/dashboard/settings": "page.settings" as const,
  },
  pageTitlePrefixes: {
    "/dashboard/opportunities/": "page.opportunity" as const,
    "/dashboard/tasks/": "page.task" as const,
    "/dashboard/rewards/": "page.reward" as const,
    "/dashboard/support/": "progress.manager" as const,
  },
  notificationTextKey: "workspace.noEvents" as const,
};

export function DashboardShell({ children, profile, notifications, personalConversation, economy, canAdmin }: { children: React.ReactNode; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView; economy?: EconomySnapshotView; canAdmin?: boolean }) {
  return <WorkspaceShell config={playerConfig} profile={profile} notifications={notifications} personalConversation={personalConversation} economy={economy} canAdmin={canAdmin}>{children}</WorkspaceShell>;
}
