"use client";

import {
  BookOpenText,
  Building2,
  CircleGauge,
  ClipboardList,
  Gift,
  Headphones,
  History,
  LayoutDashboard,
  MailCheck,
  ScanSearch,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import type { DashboardPreferences } from "@/lib/dashboard-data";

const adminPreferences: DashboardPreferences = {
  displayName: "Демо-администратор",
  reducedMotion: false,
};

const adminConfig = {
  kind: "admin" as const,
  label: "Административная панель",
  ariaContext: "административной панели",
  rootHref: "/admin",
  profileHref: "/admin/settings",
  profileRole: "Администратор",
  storageKey: "vx-house-admin-preview-preferences",
  defaultPreferences: adminPreferences,
  navigation: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Пользователи", href: "/admin/users", icon: UsersRound },
    { label: "Партнёрские сервисы", href: "/admin/services", icon: Building2 },
    { label: "Возможности", href: "/admin/opportunities", icon: Sparkles },
    { label: "Задания", href: "/admin/tasks", icon: ClipboardList },
    { label: "Проверки", href: "/admin/reviews", icon: ScanSearch },
    { label: "VX Rewards", href: "/admin/rewards", icon: Gift },
    { label: "Экономика", href: "/admin/economy", icon: CircleGauge },
    { label: "Поддержка", href: "/admin/support", icon: Headphones },
    { label: "Контент", href: "/admin/content", icon: BookOpenText },
    { label: "Уведомления", href: "/admin/notifications", icon: MailCheck },
    { label: "Команда и права", href: "/admin/team", icon: UsersRound },
    { label: "Аудит", href: "/admin/audit", icon: History },
    { label: "Настройки", href: "/admin/settings", icon: Settings2 },
  ],
  pageTitles: {
    "/admin": "Dashboard",
    "/admin/users": "Пользователи",
    "/admin/services": "Партнёрские сервисы",
    "/admin/opportunities": "Возможности",
    "/admin/tasks": "Задания",
    "/admin/reviews": "Проверки",
    "/admin/rewards": "VX Rewards",
    "/admin/economy": "Экономика",
    "/admin/support": "Поддержка",
    "/admin/content": "Контент",
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
  demoText: "Панель показывает только frontend-структуру. Реальных пользователей, статистики, финансовых данных и действующей конфигурации нет.",
  notificationText: "Системные уведомления появятся только после подключения backend, прав сотрудников и журнала действий.",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell config={adminConfig}>{children}</WorkspaceShell>;
}
