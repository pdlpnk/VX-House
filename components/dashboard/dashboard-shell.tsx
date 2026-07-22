"use client";

import { Activity, ChartNoAxesCombined, Compass, Gift, Headphones, House, Settings, UserRound } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { DASHBOARD_PREFERENCES_KEY, defaultDashboardPreferences } from "@/lib/dashboard-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView } from "@/lib/support";

const playerConfig = {
  kind: "player" as const,
  label: "Кабинет игрока",
  ariaContext: "кабинета игрока",
  rootHref: "/dashboard",
  profileHref: "/dashboard/profile",
  profileRole: "Игрок",
  storageKey: DASHBOARD_PREFERENCES_KEY,
  defaultPreferences: defaultDashboardPreferences,
  navigation: [
    { label: "Главная", href: "/dashboard", icon: House },
    { label: "Возможности", href: "/dashboard/opportunities", icon: Compass },
    { label: "Экономика", href: "/dashboard/economy", icon: ChartNoAxesCombined },
    { label: "VX Rewards", href: "/dashboard/rewards", icon: Gift },
    { label: "Поддержка", href: "/dashboard/support", icon: Headphones },
    { label: "Активность", href: "/dashboard/activity", icon: Activity },
    { label: "Профиль", href: "/dashboard/profile", icon: UserRound },
    { label: "Настройки", href: "/dashboard/settings", icon: Settings },
  ],
  pageTitles: {
    "/dashboard": "Главная",
    "/dashboard/profile": "Профиль",
    "/dashboard/opportunities": "Возможности",
    "/dashboard/economy": "Экономика",
    "/dashboard/economy/history": "История экономики",
    "/dashboard/rewards": "VX Rewards",
    "/dashboard/rewards/history": "История Rewards",
    "/dashboard/activity": "Активность",
    "/dashboard/support": "Поддержка",
    "/dashboard/support/new": "Новое обращение",
    "/dashboard/settings": "Настройки",
  },
  pageTitlePrefixes: {
    "/dashboard/opportunities/": "Карточка возможности",
    "/dashboard/tasks/": "Задание",
    "/dashboard/rewards/": "Карточка VX Reward",
    "/dashboard/support/": "Обращение",
  },
  notificationText: "Новых событий пока нет.",
};

export function DashboardShell({ children, profile, notifications }: { children: React.ReactNode; profile?: SafeProfileDTO; notifications?: NotificationView[] }) {
  return <WorkspaceShell config={playerConfig} profile={profile} notifications={notifications}>{children}</WorkspaceShell>;
}
