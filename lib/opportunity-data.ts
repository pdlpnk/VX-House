export type OpportunityRole = "player" | "partner";

export type OpportunityMarket = "Турция" | "Азербайджан";

export type OpportunityType =
  | "Задание"
  | "Инструкция"
  | "Промокод"
  | "Персональное условие";

export type OpportunityStatus =
  | "unavailable"
  | "soon"
  | "awaiting-service"
  | "no-data";

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  role: OpportunityRole;
  markets: readonly OpportunityMarket[];
  type: OpportunityType;
  status: OpportunityStatus;
  nextStep: string;
  taskId?: string;
  demo: true;
};

export type TaskStep = {
  id: string;
  title: string;
  description: string;
  state: "awaiting-service" | "locked";
};

export type TaskDefinition = {
  id: string;
  opportunityId: string;
  title: string;
  description: string;
  role: OpportunityRole;
  markets: readonly OpportunityMarket[];
  status: OpportunityStatus;
  nextStep: string;
  steps: readonly TaskStep[];
  partnerService: string;
  conditionsVersion: string;
  deadline: string;
  resultFormats: readonly string[];
  reviewEstimate: string;
  resubmissionRule: string;
  requirements: readonly string[];
  demo: true;
};

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  unavailable: "Недоступно",
  soon: "Скоро будет доступно",
  "awaiting-service": "Ожидает подключения",
  "no-data": "Нет данных",
};

export const opportunityRoleLabels: Record<OpportunityRole, string> = {
  player: "Игрок",
  partner: "Партнёр",
};

export const opportunities: readonly Opportunity[] = [
  {
    id: "player-personal-route",
    title: "Персональный маршрут игрока",
    description: "Структура будущего задания с понятными условиями, этапами и местом для проверки результата.",
    role: "player",
    markets: ["Турция", "Азербайджан"],
    type: "Задание",
    status: "soon",
    nextStep: "Дождаться подключения каталога заданий.",
    taskId: "player-personal-route",
    demo: true,
  },
  {
    id: "player-profile-guide",
    title: "Инструкция по возможностям профиля",
    description: "Будущий материал о статусах, доступе и следующем действии внутри кабинета игрока.",
    role: "player",
    markets: ["Турция", "Азербайджан"],
    type: "Инструкция",
    status: "awaiting-service",
    nextStep: "Подключить сервис управляемых инструкций.",
    demo: true,
  },
  {
    id: "player-personal-condition",
    title: "Персональное условие",
    description: "Здесь появится подтверждённое условие только после получения данных от подключённого сервиса.",
    role: "player",
    markets: ["Турция"],
    type: "Персональное условие",
    status: "no-data",
    nextStep: "Данные пока не получены.",
    demo: true,
  },
  {
    id: "player-promo-access",
    title: "Промокод для игрока",
    description: "Место для будущего промокода, срока действия и проверенной инструкции по применению.",
    role: "player",
    markets: ["Азербайджан"],
    type: "Промокод",
    status: "unavailable",
    nextStep: "Доступ не подтверждён.",
    demo: true,
  },
  {
    id: "partner-first-collaboration",
    title: "Первый шаг сотрудничества",
    description: "Структура будущего партнёрского задания без вымышленных сроков, результатов и вознаграждений.",
    role: "partner",
    markets: ["Турция", "Азербайджан"],
    type: "Задание",
    status: "soon",
    nextStep: "Дождаться подключения партнёрских заданий.",
    taskId: "partner-first-collaboration",
    demo: true,
  },
  {
    id: "partner-working-materials",
    title: "Рабочая инструкция партнёра",
    description: "Будущее место для актуальной версии инструкции и понятного контекста её применения.",
    role: "partner",
    markets: ["Турция", "Азербайджан"],
    type: "Инструкция",
    status: "awaiting-service",
    nextStep: "Подключить сервис управляемых материалов.",
    demo: true,
  },
  {
    id: "partner-collaboration-condition",
    title: "Условие сотрудничества",
    description: "Подтверждённые условия и применимый рынок появятся после подключения бизнес-логики.",
    role: "partner",
    markets: ["Турция"],
    type: "Персональное условие",
    status: "no-data",
    nextStep: "Условия пока не назначены.",
    demo: true,
  },
  {
    id: "partner-promo-material",
    title: "Партнёрский промокод",
    description: "Место для будущего кода, владельца, рынка, срока и инструкции по использованию.",
    role: "partner",
    markets: ["Азербайджан"],
    type: "Промокод",
    status: "unavailable",
    nextStep: "Доступ к промокодам не подтверждён.",
    demo: true,
  },
] as const;

const sharedTaskSteps: readonly TaskStep[] = [
  {
    id: "conditions",
    title: "Ознакомиться с условиями",
    description: "Условия появятся после подключения источника данных.",
    state: "awaiting-service",
  },
  {
    id: "instruction",
    title: "Открыть инструкцию",
    description: "Актуальная версия инструкции пока недоступна.",
    state: "locked",
  },
  {
    id: "action",
    title: "Выполнить действие",
    description: "Действие будет доступно только после серверного подтверждения доступа.",
    state: "locked",
  },
  {
    id: "verification",
    title: "Передать результат на проверку",
    description: "Форма и правила проверки будут подключены на следующем этапе.",
    state: "locked",
  },
] as const;

export const tasks: readonly TaskDefinition[] = [
  {
    id: "player-personal-route",
    opportunityId: "player-personal-route",
    title: "Персональный маршрут игрока",
    description: "Демонстрация будущего пошагового задания для игрока.",
    role: "player",
    markets: ["Турция", "Азербайджан"],
    status: "soon",
    nextStep: "Дождаться подключения условий и проверки результата.",
    steps: sharedTaskSteps,
    partnerService: "Партнёрский сервис не подключён",
    conditionsVersion: "Демонстрационная версия",
    deadline: "Срок не задан",
    resultFormats: ["Текст", "Идентификатор", "Разрешённое вложение"],
    reviewEstimate: "Будет указан после подключения сервиса",
    resubmissionRule: "Правила повторной отправки не опубликованы",
    requirements: ["Условия будут показаны до принятия задания", "Обязательные материалы будут отмечены отдельно"],
    demo: true,
  },
  {
    id: "partner-first-collaboration",
    opportunityId: "partner-first-collaboration",
    title: "Первый шаг сотрудничества",
    description: "Демонстрация будущего пошагового задания для партнёра.",
    role: "partner",
    markets: ["Турция", "Азербайджан"],
    status: "soon",
    nextStep: "Дождаться подключения партнёрского сервиса и правил проверки.",
    steps: sharedTaskSteps,
    partnerService: "Партнёрский сервис не подключён",
    conditionsVersion: "Демонстрационная версия",
    deadline: "Срок не задан",
    resultFormats: ["Текст", "Идентификатор", "Разрешённое вложение"],
    reviewEstimate: "Будет указан после подключения сервиса",
    resubmissionRule: "Правила повторной отправки не опубликованы",
    requirements: ["Условия сотрудничества будут показаны до принятия", "Обязательные материалы будут отмечены отдельно"],
    demo: true,
  },
] as const;

export function getOpportunitiesByRole(role: OpportunityRole) {
  return opportunities.filter((opportunity) => opportunity.role === role);
}

export function getOpportunity(id: string, role: OpportunityRole) {
  return opportunities.find((opportunity) => opportunity.id === id && opportunity.role === role);
}

export function getTask(id: string, role: OpportunityRole) {
  return tasks.find((task) => task.id === id && task.role === role);
}
