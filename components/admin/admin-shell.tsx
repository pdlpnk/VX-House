"use client";

import {
  BookOpenText,
  LayoutDashboard,
  MessageCircle,
  UserRound,
  UsersRound,
} from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import type { DashboardPreferences } from "@/lib/dashboard-data";

const adminPreferences: DashboardPreferences = {
  reducedMotion: false,
};

const adminConfig = {
  kind: "admin" as const,
  labelKey: "workspace.adminArea" as const,
  rootHref: "/admin",
  profileHref: "/admin/profile",
  profileRoleKey: "workspace.admin" as const,
  storageKey: "vx-house-admin-preview-preferences",
  defaultPreferences: adminPreferences,
  navigation: [
    { labelKey: "page.home" as const, href: "/admin", icon: LayoutDashboard },
    { labelKey: "page.users" as const, href: "/admin/users", icon: UsersRound },
    { labelKey: "progress.manager" as const, href: "/admin/messenger", icon: MessageCircle },
    { labelKey: "page.cms" as const, href: "/admin/content", icon: BookOpenText },
    { labelKey: "page.profile" as const, href: "/admin/profile", icon: UserRound },
  ],
  pageTitles: {
    "/admin": "page.home" as const,
    "/admin/users": "page.users" as const,
    "/admin/services": "nav.opportunities" as const,
    "/admin/opportunities": "nav.opportunities" as const,
    "/admin/tasks": "nav.tasks" as const,
    "/admin/reviews": "page.activity" as const,
    "/admin/rewards": "page.rewards" as const,
    "/admin/economy": "page.progress" as const,
    "/admin/support": "progress.manager" as const,
    "/admin/messenger": "progress.manager" as const,
    "/admin/profile": "page.profile" as const,
    "/admin/content": "page.cms" as const,
    "/admin/notifications": "workspace.notifications" as const,
    "/admin/team": "workspace.admin" as const,
    "/admin/audit": "page.activity" as const,
    "/admin/settings": "page.settings" as const,
  },
  pageTitlePrefixes: {
    "/admin/users/": "page.userProfile" as const,
    "/admin/services/": "nav.opportunities" as const,
    "/admin/opportunities/": "page.opportunity" as const,
    "/admin/tasks/": "page.task" as const,
    "/admin/reviews/": "page.activity" as const,
    "/admin/rewards/": "page.reward" as const,
    "/admin/economy/": "page.progress" as const,
    "/admin/support/": "progress.manager" as const,
    "/admin/content/": "page.cms" as const,
    "/admin/notifications/": "workspace.notifications" as const,
    "/admin/team/": "workspace.admin" as const,
    "/admin/audit/": "page.activity" as const,
    "/admin/settings/": "page.settings" as const,
  },
  notificationTextKey: "workspace.noEvents" as const,
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell config={adminConfig}>{children}</WorkspaceShell>;
}
