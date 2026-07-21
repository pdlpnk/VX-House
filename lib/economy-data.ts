export type EconomyRole = "player" | "partner";

export type EconomyEntityId = "points" | "trust" | "rank" | "rewards";

export type EconomyEntity = {
  id: EconomyEntityId;
  title: string;
  shortDescription: string;
  explanation: string;
  boundary: string;
};

export type RankName = "Explorer" | "Navigator" | "Atlas" | "Prime" | "Signature";

export type EconomySnapshot = {
  role: EconomyRole;
  points: null;
  trustScore: null;
  trustZone: null;
  currentRank: null;
  nextRank: null;
  rankProgress: null;
};

export type RewardPreview = {
  id: string;
  title: string;
  type: string;
  description: string;
};

export const economyEntities: EconomyEntity[] = [
  {
    id: "points",
    title: "VX Points",
    shortDescription: "Внутренний прогресс за подтверждённые действия.",
    explanation: "Points появятся только после подтверждённого события с заранее известным основанием. Каждое изменение получит отдельную запись в истории.",
    boundary: "Не являются деньгами, кешбэком или доступным для вывода балансом.",
  },
  {
    id: "trust",
    title: "Trust Score",
    shortDescription: "Объяснимый показатель качества подтверждённой истории.",
    explanation: "Показатель формируется из подтверждённых событий. Пользователь увидит причину каждого изменения, текущую зону и возможный следующий шаг.",
    boundary: "Не является публичным рейтингом, деньгами или гарантией результата.",
  },
  {
    id: "rank",
    title: "Ранг",
    shortDescription: "Уровень участия, основанный на нескольких критериях.",
    explanation: "Переход учитывает настроенное сочетание Points, зоны Trust и обязательных условий. Один индикатор не скрывает невыполненные критерии.",
    boundary: "Ранг не покупается и не определяется одной операцией.",
  },
  {
    id: "rewards",
    title: "VX Rewards",
    shortDescription: "Конкретные подтверждённые преимущества.",
    explanation: "Reward имеет тип, основание, условия и отдельный статус. Он появится только после реального подтверждения и не смешивается с Points.",
    boundary: "Возможный Reward не считается полученным и не обещает выплату.",
  },
];

export const rankOrder: RankName[] = ["Explorer", "Navigator", "Atlas", "Prime", "Signature"];

export const rewardPreviews: RewardPreview[] = [
  { id: "personal", title: "Персональные условия", type: "Условие", description: "Индивидуальное правило с понятным основанием, сроком и ограничениями." },
  { id: "promo", title: "Промокод", type: "Промокод", description: "Код с указанием партнёра, рынка, срока и правил применения." },
  { id: "forecast", title: "Доступ к материалу", type: "Доступ", description: "Право открыть определённый материал без обещания результата." },
  { id: "cashback", title: "Кешбэк", type: "Денежный Reward", description: "Отдельный результат, который появится только после подтверждения основания и значения." },
];

export const economyEventTypes = [
  "Операция VX Points",
  "Событие Trust Score",
  "Изменение ранга",
  "Статус VX Reward",
] as const;

export function getEconomySnapshot(role: EconomyRole): EconomySnapshot {
  return {
    role,
    points: null,
    trustScore: null,
    trustZone: null,
    currentRank: null,
    nextRank: null,
    rankProgress: null,
  };
}
