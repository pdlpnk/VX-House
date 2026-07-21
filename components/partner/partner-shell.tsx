"use client";

import { BriefcaseBusiness, ChartNoAxesCombined, FolderOpen, Gift, Handshake, Headphones, History, UserRound } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { PARTNER_PREFERENCES_KEY, defaultPartnerPreferences } from "@/lib/partner-data";

const partnerConfig = {
  kind: "partner" as const,
  label: "Кабинет партнёра",
  ariaContext: "кабинета партнёра",
  rootHref: "/partner",
  profileHref: "/partner/profile",
  profileRole: "Партнёр",
  storageKey: PARTNER_PREFERENCES_KEY,
  defaultPreferences: defaultPartnerPreferences,
  navigation: [
    { label: "Главная", href: "/partner", icon: BriefcaseBusiness },
    { label: "Возможности", href: "/partner/opportunities", icon: Handshake },
    { label: "Экономика", href: "/partner/economy", icon: ChartNoAxesCombined },
    { label: "VX Rewards", href: "/partner/rewards", icon: Gift },
    { label: "Поддержка", href: "/partner/support", icon: Headphones },
    { label: "Материалы", href: "/partner/materials", icon: FolderOpen },
    { label: "Прогнозы", href: "/partner/forecasts", icon: ChartNoAxesCombined },
    { label: "История", href: "/partner/history", icon: History },
    { label: "Профиль", href: "/partner/profile", icon: UserRound },
  ],
  pageTitles: {
    "/partner": "Главная",
    "/partner/opportunities": "Возможности",
    "/partner/economy": "Экономика",
    "/partner/economy/history": "История экономики",
    "/partner/rewards": "VX Rewards",
    "/partner/rewards/history": "История Rewards",
    "/partner/support": "Поддержка",
    "/partner/support/new": "Новое обращение",
    "/partner/materials": "Материалы",
    "/partner/forecasts": "Прогнозы",
    "/partner/history": "История",
    "/partner/profile": "Профиль",
  },
  pageTitlePrefixes: {
    "/partner/opportunities/": "Карточка возможности",
    "/partner/tasks/": "Задание",
    "/partner/rewards/": "Карточка VX Reward",
    "/partner/support/": "Обращение",
  },
  demoText: "Здесь нет реальных задач, результатов, начислений или подтверждённого статуса сотрудничества.",
  notificationText: "Здесь появятся только реальные изменения партнёрских задач, материалов и доступа после подключения сервиса.",
};

export function PartnerShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell config={partnerConfig}>{children}</WorkspaceShell>;
}
