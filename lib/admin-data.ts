import type { LucideIcon } from "lucide-react";
import { BookOpenText, Building2, CircleGauge, ClipboardList, Gift, Headphones, History, MailCheck, ScanSearch, Settings2, Sparkles, UsersRound } from "lucide-react";

import type { AdminSectionId } from "@/lib/admin";

export type AdminSection = Readonly<{ id: AdminSectionId; label: string; singular: string; description: string; purpose: string; icon: LucideIcon }>;

export const adminSections: readonly AdminSection[] = [
  { id: "users", label: "Пользователи", singular: "Профиль пользователя", description: "Профили, роли, рынки и статусы доступа.", purpose: "Поиск пользователей, разрешённые изменения статуса, блокировка и решение по партнёрскому доступу.", icon: UsersRound },
  { id: "services", label: "Партнёрские сервисы", singular: "Партнёрский сервис", description: "Доступность партнёрских сервисов по рынкам.", purpose: "Просмотр реестра сервисов и действующих рыночных ограничений.", icon: Building2 },
  { id: "opportunities", label: "Возможности", singular: "Возможность", description: "Каталог возможностей, сегментов и публикационных статусов.", purpose: "Создание версий, публикация и архивация возможностей без изменения активных условий задним числом.", icon: Sparkles },
  { id: "tasks", label: "Задания", singular: "Задание", description: "Версии условий задания и связанные инструкции.", purpose: "Управление черновиками и опубликованными версиями заданий.", icon: ClipboardList },
  { id: "reviews", label: "Проверки", singular: "Результат на проверке", description: "Очередь отправленных результатов и история решений.", purpose: "Подтверждение, отклонение или запрос изменений с обязательной причиной.", icon: ScanSearch },
  { id: "rewards", label: "VX Rewards", singular: "VX Reward", description: "Каталог типов и операционные статусы VX Rewards.", purpose: "Управление версионированной конфигурацией Reward и просмотр процесса предоставления.", icon: Gift },
  { id: "economy", label: "Экономика", singular: "Экономическое событие", description: "Append-only история VX Points и Trust Score.", purpose: "Просмотр истории и создание компенсирующих ручных корректировок без перезаписи событий.", icon: CircleGauge },
  { id: "support", label: "Поддержка", singular: "Обращение", description: "Очередь обращений, сообщений и апелляций.", purpose: "Назначение оператора, ответы, внутренние заметки, статусы и решения апелляций.", icon: Headphones },
  { id: "content", label: "Контент", singular: "Инструкция", description: "Версионированные инструкции и редакционный процесс.", purpose: "Создание, редактирование, публикация и архивация инструкций.", icon: BookOpenText },
  { id: "notifications", label: "Уведомления", singular: "Уведомление", description: "Серверные уведомления и история доставки.", purpose: "Одиночная и массовая отправка с фильтрацией по роли и рынку.", icon: MailCheck },
  { id: "team", label: "Команда и права", singular: "Роль сотрудника", description: "Инфраструктурные роли и разрешения сотрудников.", purpose: "Просмотр действующей RBAC-матрицы и назначений.", icon: UsersRound },
  { id: "audit", label: "Аудит", singular: "Запись аудита", description: "Неизменяемый журнал административных действий.", purpose: "Просмотр автора, времени, цели, основания и метаданных критического действия.", icon: History },
  { id: "settings", label: "Настройки", singular: "Рынок", description: "Серверная конфигурация рынков и локализации.", purpose: "Просмотр активной конфигурации Турции и Азербайджана.", icon: Settings2 },
] as const;

export function getAdminSection(id: string) { return adminSections.find((section) => section.id === id); }
