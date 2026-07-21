import type { EconomyRole } from "@/lib/economy-data";

export type SupportCategoryId =
  | "access"
  | "task"
  | "review"
  | "reward"
  | "account"
  | "appeal"
  | "partnership";

export type SupportPriority = "low" | "normal" | "high" | "critical";

export type SupportStatus =
  | "new"
  | "open"
  | "waiting-user"
  | "waiting-operator"
  | "resolved"
  | "closed";

export type SupportCategory = {
  id: SupportCategoryId;
  title: string;
  description: string;
  roles: readonly EconomyRole[];
};

export type SupportStatusDefinition = {
  status: SupportStatus;
  label: string;
  description: string;
  nextStep: string;
  tone: "neutral" | "success" | "attention" | "brand";
};

export type SupportMessage = {
  id: string;
  author: "user" | "operator" | "system";
  authorLabel: string;
  body: string;
  demoLabel: string;
};

export type SupportTicket = {
  id: string;
  role: EconomyRole;
  title: string;
  category: SupportCategoryId;
  priority: SupportPriority;
  status: SupportStatus;
  summary: string;
  context: readonly string[];
  messages: readonly SupportMessage[];
};

export const supportCategories: SupportCategory[] = [
  { id: "access", title: "Доступ к платформе", description: "Вопросы о сценарии доступа, роли, стране и статусе подключения.", roles: ["player", "partner"] },
  { id: "task", title: "Задание", description: "Условия, инструкция, срок и подготовка результата.", roles: ["player", "partner"] },
  { id: "review", title: "Проверка результата", description: "Статус проверки, уточнение и объяснение решения.", roles: ["player", "partner"] },
  { id: "reward", title: "VX Rewards", description: "Тип Reward, основание, статус и способ предоставления.", roles: ["player", "partner"] },
  { id: "account", title: "Профиль и настройки", description: "Контактные данные, страна и локальные настройки интерфейса.", roles: ["player", "partner"] },
  { id: "appeal", title: "Апелляция", description: "Запрос пересмотра решения с сохранением связанного контекста.", roles: ["player", "partner"] },
  { id: "partnership", title: "Сотрудничество", description: "Условия и рабочие вопросы партнёрского взаимодействия.", roles: ["partner"] },
];

export const supportStatuses: SupportStatusDefinition[] = [
  { status: "new", label: "Новое", description: "Обращение подготовлено, но ещё не принято системой.", nextStep: "Отправить обращение после подключения сервиса.", tone: "neutral" },
  { status: "open", label: "Открыто", description: "Обращение принято и доступно для дальнейшей работы.", nextStep: "Дождаться назначения или следующего сообщения.", tone: "brand" },
  { status: "waiting-user", label: "Ожидает пользователя", description: "Для продолжения нужен ответ или разрешённый материал пользователя.", nextStep: "Изучить запрос и ответить через подключённый диалог.", tone: "attention" },
  { status: "waiting-operator", label: "Ожидает оператора", description: "Последнее действие выполнено пользователем; требуется ответ команды поддержки.", nextStep: "Дождаться реального ответа без вымышленного таймера.", tone: "brand" },
  { status: "resolved", label: "Решено", description: "Решение предложено, но обращение ещё сохраняет контекст для проверки результата.", nextStep: "Подтвердить решение или запросить продолжение по правилам поддержки.", tone: "success" },
  { status: "closed", label: "Закрыто", description: "Работа с обращением завершена и сохранена в истории.", nextStep: "Создать новое обращение или возобновить по будущим правилам.", tone: "neutral" },
];

export const supportPriorityLabels: Record<SupportPriority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
  critical: "Критический",
};

export const demoSupportTickets: SupportTicket[] = [
  {
    id: "demo-task-context",
    role: "player",
    title: "Демонстрация: вопрос по статусу задания",
    category: "task",
    priority: "normal",
    status: "waiting-operator",
    summary: "Пример того, как обращение сохранит контекст задания без повторного описания известных данных.",
    context: ["Роль: Игрок", "Рынок: не определён", "Задание: демонстрационный контекст", "Версия результата: нет данных"],
    messages: [
      { id: "player-demo-1", author: "user", authorLabel: "Пользователь · пример", body: "Подскажите, какие данные будут видны поддержке вместе с обращением?", demoLabel: "Демонстрационное сообщение" },
      { id: "player-demo-2", author: "operator", authorLabel: "Оператор · пример интерфейса", body: "После подключения сервиса обращение сможет получить только разрешённый контекст: роль, рынок, связанное задание и текущий статус.", demoLabel: "Не является реальным ответом" },
    ],
  },
  {
    id: "demo-reward-context",
    role: "player",
    title: "Демонстрация: объяснение статуса Reward",
    category: "reward",
    priority: "low",
    status: "new",
    summary: "Пример обращения по VX Reward без реального назначения, значения или решения.",
    context: ["Роль: Игрок", "Reward: не назначен", "Связанное задание: нет данных", "Статус: демонстрация"],
    messages: [],
  },
  {
    id: "demo-partner-context",
    role: "partner",
    title: "Демонстрация: вопрос по сотрудничеству",
    category: "partnership",
    priority: "normal",
    status: "waiting-user",
    summary: "Пример диалога партнёра с сохранением разрешённого рабочего контекста.",
    context: ["Роль: Партнёр", "Рынок: не определён", "Этап сотрудничества: нет данных", "Связанная задача: не назначена"],
    messages: [
      { id: "partner-demo-1", author: "operator", authorLabel: "Оператор · пример интерфейса", body: "В реальном обращении здесь будет точный запрос по условиям сотрудничества и список необходимых данных.", demoLabel: "Не является реальным ответом" },
    ],
  },
  {
    id: "demo-appeal-context",
    role: "partner",
    title: "Демонстрация: структура апелляции",
    category: "appeal",
    priority: "high",
    status: "open",
    summary: "Пример того, как апелляция будет связана с решением без имитации поданного запроса.",
    context: ["Роль: Партнёр", "Решение: отсутствует", "Причина апелляции: нет данных", "Версия результата: нет данных"],
    messages: [],
  },
];

export const supportHistoryTypes = ["Создание обращения", "Назначение", "Изменение статуса", "Сообщение", "Закрытие или возобновление"] as const;

export function getSupportTickets(role: EconomyRole) {
  return demoSupportTickets.filter((ticket) => ticket.role === role);
}

export function getSupportTicket(id: string, role: EconomyRole) {
  return demoSupportTickets.find((ticket) => ticket.id === id && ticket.role === role);
}

export function getSupportCategory(id: SupportCategoryId) {
  return supportCategories.find((category) => category.id === id) ?? supportCategories[0];
}

export function getSupportStatus(status: SupportStatus) {
  return supportStatuses.find((item) => item.status === status) ?? supportStatuses[0];
}
