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
  label: "Административная панель",
  ariaContext: "административной панели",
  rootHref: "/admin",
  profileHref: "/admin/profile",
  profileRole: "Администратор",
  storageKey: "vx-house-admin-preview-preferences",
  defaultPreferences: adminPreferences,
  navigation: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Участники", href: "/admin/users", icon: UsersRound },
    { label: "Messenger", href: "/admin/messenger", icon: MessageCircle },
    { label: "CMS", href: "/admin/content", icon: BookOpenText },
    { label: "Профиль", href: "/admin/profile", icon: UserRound },
  ],
  pageTitles: {
    "/admin": "Dashboard",
    "/admin/users": "Участники",
    "/admin/services": "Партнёрские сервисы",
    "/admin/opportunities": "Возможности",
    "/admin/tasks": "Задания",
    "/admin/reviews": "Проверки",
    "/admin/rewards": "VX Rewards",
    "/admin/economy": "Экономика",
    "/admin/support": "Поддержка",
    "/admin/messenger": "Messenger",
    "/admin/profile": "Профиль",
    "/admin/content": "CMS",
    "/admin/notifications": "Уведомления",
    "/admin/team": "Команда и права",
    "/admin/audit": "Аудит",
    "/admin/settings": "Настройки",
  },
  pageTitlePrefixes: {
    "/admin/users/": "Профиль пользователя",
    "/admin/services/": "Партнёрский сервис",
    "/admin/opportunities/": "Возможность",
    "/admin/tasks/": "Задание",
    "/admin/reviews/": "Проверка",
    "/admin/rewards/": "VX Reward",
    "/admin/economy/": "Версия экономики",
    "/admin/support/": "Обращение",
    "/admin/content/": "Материал",
    "/admin/notifications/": "Шаблон уведомления",
    "/admin/team/": "Роль сотрудника",
    "/admin/audit/": "Запись аудита",
    "/admin/settings/": "Системная настройка",
  },
  notificationText: "Административные события доступны в журнале аудита.",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell config={adminConfig}>{children}</WorkspaceShell>;
}
