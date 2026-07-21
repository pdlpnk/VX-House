import type { EconomyRole } from "@/lib/economy-data";

export type RewardTypeId =
  | "cashback"
  | "money"
  | "forecast"
  | "personal"
  | "promo"
  | "custom";

export type RewardStatus =
  | "expected"
  | "awaiting-confirmation"
  | "preparing"
  | "available"
  | "provided"
  | "rejected"
  | "expired";

export type RewardTypeDefinition = {
  id: RewardTypeId;
  title: string;
  category: string;
  description: string;
  valueRule: string;
  provisionRule: string;
  roles: readonly EconomyRole[];
};

export type RewardStatusDefinition = {
  status: RewardStatus;
  label: string;
  phase: string;
  description: string;
  nextStep: string;
  reasonRequirement: string;
  tone: "neutral" | "success" | "attention" | "brand";
};

export const rewardTypes: RewardTypeDefinition[] = [
  {
    id: "cashback",
    title: "Кешбэк",
    category: "Денежный Reward",
    description: "Возврат по заранее опубликованному правилу партнёрского условия.",
    valueRule: "Значение и валюта появятся только после подтверждения основания.",
    provisionRule: "Показывается отдельно от Points и других типов Rewards.",
    roles: ["player", "partner"],
  },
  {
    id: "money",
    title: "Денежное вознаграждение",
    category: "Денежный Reward",
    description: "Отдельное вознаграждение за подтверждённое действие по опубликованным условиям.",
    valueRule: "Без подтверждения сумма и валюта не отображаются.",
    provisionRule: "Не является ставкой, депозитом или балансом VX House.",
    roles: ["player", "partner"],
  },
  {
    id: "forecast",
    title: "Доступ к прогнозу",
    category: "Неденежный Reward",
    description: "Право открыть определённый аналитический материал или категорию материалов.",
    valueRule: "Состав и период доступа задаются условиями.",
    provisionRule: "Не является деньгами и не гарантирует результат.",
    roles: ["player", "partner"],
  },
  {
    id: "personal",
    title: "Персональные условия",
    category: "Неденежный Reward",
    description: "Индивидуальное правило сотрудничества или предложение с явными ограничениями.",
    valueRule: "Условия, основание и срок показываются до использования.",
    provisionRule: "Доступность не подразумевается до подтверждения.",
    roles: ["player", "partner"],
  },
  {
    id: "promo",
    title: "Промокод",
    category: "Неденежный Reward",
    description: "Управляемый код для указанного партнёра, рынка и срока.",
    valueRule: "Сам код в демонстрации не создаётся и не показывается.",
    provisionRule: "Промокод не отображается как денежная сумма.",
    roles: ["player", "partner"],
  },
  {
    id: "custom",
    title: "Настраиваемый тип",
    category: "Тип по конфигурации",
    description: "Будущее преимущество с заранее определённой ценностью и способом предоставления.",
    valueRule: "Тип доступен только после утверждения правил и правовой модели.",
    provisionRule: "Не может быть неопределённым обещанием «награда позже».",
    roles: ["player", "partner"],
  },
];

export const rewardStatuses: RewardStatusDefinition[] = [
  {
    status: "expected",
    label: "Ожидается",
    phase: "До подтверждения",
    description: "Reward предусмотрен условиями, но право на него ещё не установлено.",
    nextStep: "Выполнить применимые условия и дождаться проверки результата.",
    reasonRequirement: "Основанием станет опубликованное условие или связанное задание.",
    tone: "neutral",
  },
  {
    status: "awaiting-confirmation",
    label: "Ожидает подтверждения",
    phase: "Проверка основания",
    description: "Результат может быть отправлен, но решение о Reward ещё не принято.",
    nextStep: "Дождаться объяснимого решения проверки; Reward пока не считается полученным.",
    reasonRequirement: "Решение должно ссылаться на проверенный результат и версию условий.",
    tone: "attention",
  },
  {
    status: "preparing",
    label: "Готовится",
    phase: "Предоставление",
    description: "Право на Reward подтверждено, но операционные действия ещё не завершены.",
    nextStep: "Дождаться подготовки; реальный ориентир появится из серверных данных.",
    reasonRequirement: "Статус требует подтверждённого основания и ответственного процесса.",
    tone: "brand",
  },
  {
    status: "available",
    label: "Доступен",
    phase: "Готов к использованию",
    description: "Reward подготовлен и может быть использован по применимым условиям.",
    nextStep: "Изучить срок и способ использования после подключения сервиса.",
    reasonRequirement: "Должны быть указаны способ предоставления, ограничения и срок.",
    tone: "success",
  },
  {
    status: "provided",
    label: "Предоставлен",
    phase: "Завершено",
    description: "Предусмотренное преимущество передано пользователю и зафиксировано в истории.",
    nextStep: "Открыть подтверждающую запись после подключения сервиса.",
    reasonRequirement: "Требуется подтверждение способа и момента предоставления.",
    tone: "success",
  },
  {
    status: "rejected",
    label: "Отклонён",
    phase: "Решение",
    description: "Основание для Reward не подтверждено. Статус невозможен без понятной причины.",
    nextStep: "Изучить причину и доступный способ продолжения или апелляции.",
    reasonRequirement: "Причина обязательна и должна ссылаться на условия или решение проверки.",
    tone: "attention",
  },
  {
    status: "expired",
    label: "Истёк",
    phase: "Срок завершён",
    description: "Опубликованный срок использования закончился; скрытое истечение недопустимо.",
    nextStep: "Открыть исходные условия и запись о сроке после подключения сервиса.",
    reasonRequirement: "Дата и правило истечения должны быть известны заранее.",
    tone: "neutral",
  },
];

export const rewardHistoryEventTypes = [
  "Создание основания",
  "Решение проверки",
  "Изменение статуса",
  "Предоставление",
  "Отклонение или истечение",
] as const;

export function getRewardType(id: string, role: EconomyRole) {
  return rewardTypes.find((reward) => reward.id === id && reward.roles.includes(role));
}

export function getRewardStatus(status: RewardStatus) {
  return rewardStatuses.find((item) => item.status === status) ?? rewardStatuses[0];
}
