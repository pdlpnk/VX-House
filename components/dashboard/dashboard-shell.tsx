"use client";

import { House, MessageCircle, Settings, UserRound } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { DASHBOARD_PREFERENCES_KEY, defaultDashboardPreferences } from "@/lib/dashboard-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";

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
    { labelKey: "dashboard.manager" as const, href: "/dashboard/support", icon: MessageCircle },
    { labelKey: "page.profile" as const, href: "/dashboard/profile", icon: UserRound },
    { labelKey: "nav.settings" as const, href: "/dashboard/settings", icon: Settings },
  ],
  pageTitles: {
    "/dashboard": "page.home" as const,
    "/dashboard/profile": "page.profile" as const,
    "/dashboard/support": "progress.manager" as const,
    "/dashboard/support/new": "progress.manager" as const,
    "/dashboard/settings": "page.settings" as const,
  },
  pageTitlePrefixes: {
    "/dashboard/support/": "progress.manager" as const,
  },
  notificationTextKey: "workspace.noEvents" as const,
};

export function DashboardShell({ children, profile, notifications, personalConversation, canAdmin }: { children: React.ReactNode; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView; canAdmin?: boolean }) {
  return <WorkspaceShell config={playerConfig} profile={profile} notifications={notifications} personalConversation={personalConversation} canAdmin={canAdmin}>{children}</WorkspaceShell>;
}
