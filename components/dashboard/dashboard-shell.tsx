"use client";

import { ChartNoAxesCombined, Compass, Gift, House, LogOut, MessageCircle, Settings } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { DASHBOARD_PREFERENCES_KEY, defaultDashboardPreferences } from "@/lib/dashboard-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";
import type { EconomySnapshotView } from "@/lib/economy";

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
    { label: "Задания", href: "/dashboard/opportunities", icon: Compass },
    { label: "Мой прогресс", href: "/dashboard/economy", icon: ChartNoAxesCombined },
    { label: "VX Rewards", href: "/dashboard/rewards", icon: Gift },
    { label: "Менеджер", href: "/dashboard/support", icon: MessageCircle },
    { label: "Настройки", href: "/dashboard/settings", icon: Settings },
    { label: "Выйти", href: "/access?mode=login", icon: LogOut, action: "logout" as const },
  ],
  pageTitles: {
    "/dashboard": "Главная",
    "/dashboard/profile": "Профиль",
    "/dashboard/opportunities": "Доступные задания",
    "/dashboard/economy": "Мой прогресс",
    "/dashboard/economy/history": "История начислений",
    "/dashboard/rewards": "VX Rewards",
    "/dashboard/rewards/history": "История Rewards",
    "/dashboard/activity": "Активность",
    "/dashboard/support": "Messenger",
    "/dashboard/support/new": "Messenger",
    "/dashboard/settings": "Настройки",
  },
  pageTitlePrefixes: {
    "/dashboard/opportunities/": "Карточка возможности",
    "/dashboard/tasks/": "Задание",
    "/dashboard/rewards/": "Карточка VX Reward",
    "/dashboard/support/": "Messenger",
  },
  notificationText: "Новых событий пока нет.",
};

export function DashboardShell({ children, profile, notifications, personalConversation, economy, canAdmin }: { children: React.ReactNode; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView; economy?: EconomySnapshotView; canAdmin?: boolean }) {
  return <WorkspaceShell config={playerConfig} profile={profile} notifications={notifications} personalConversation={personalConversation} economy={economy} canAdmin={canAdmin}>{children}</WorkspaceShell>;
}
