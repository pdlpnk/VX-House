"use client";

import { BriefcaseBusiness, ChartNoAxesCombined, FolderOpen, Gift, Handshake, History, MessageCircle, UserRound } from "lucide-react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { PARTNER_PREFERENCES_KEY, defaultPartnerPreferences } from "@/lib/partner-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";

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
    { label: "Менеджер", href: "/partner/support", icon: MessageCircle },
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
    "/partner/support": "Messenger",
    "/partner/support/new": "Messenger",
    "/partner/materials": "Материалы",
    "/partner/forecasts": "Прогнозы",
    "/partner/history": "История",
    "/partner/profile": "Профиль",
  },
  pageTitlePrefixes: {
    "/partner/opportunities/": "Карточка возможности",
    "/partner/tasks/": "Задание",
    "/partner/rewards/": "Карточка VX Reward",
    "/partner/support/": "Messenger",
  },
  notificationText: "Новых событий партнёрского пространства пока нет.",
};

export function PartnerShell({ children, profile, notifications, personalConversation }: { children: React.ReactNode; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView }) {
  return <WorkspaceShell config={partnerConfig} profile={profile} notifications={notifications} personalConversation={personalConversation}>{children}</WorkspaceShell>;
}
