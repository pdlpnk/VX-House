export type ProductRole = "PLAYER" | "PARTNER";
export type SupportPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type SupportStatus = "CREATED" | "ASSIGNED" | "WAITING_OPERATOR" | "WAITING_USER" | "RESOLVED" | "CLOSED";
export type AppealStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "UPHELD" | "PARTIALLY_UPHELD" | "DENIED" | "CANCELLED";
export type NotificationStatus = "PENDING" | "SENT" | "READ" | "FAILED" | "CANCELLED";

export type SupportCategoryView = { key: string; title: string; description: string };
export type SupportMessageView = { id: string; authorType: "USER" | "OPERATOR" | "SYSTEM"; authorLabel: string; body: string; createdAt: string; attachments: { id: string; fileName: string; mediaType: string; sizeBytes: number }[] };
export type StatusHistoryView<T extends string> = { id: string; fromStatus: T | null; toStatus: T; reason: string; occurredAt: string };
export type AppealView = { id: string; status: AppealStatus; reason: string; decisionReason: string | null; userTaskId: string | null; rewardId: string | null; createdAt: string; submittedAt: string | null; decidedAt: string | null; history: StatusHistoryView<AppealStatus>[] };
export type SupportConversationView = { id: string; category: SupportCategoryView; priority: SupportPriority; status: SupportStatus; subject: string; context: Record<string, unknown>; unreadCount: number; createdAt: string; updatedAt: string; messages: SupportMessageView[]; history: StatusHistoryView<SupportStatus>[]; appeals: AppealView[] };
export type NotificationView = { id: string; category: string; status: NotificationStatus; title: string; body: string; relatedType: string | null; relatedId: string | null; createdAt: string; sentAt: string | null; readAt: string | null; history: StatusHistoryView<NotificationStatus>[] };

export type CreateConversationInput = { category: string; priority: SupportPriority; subject: string; body: string; relatedType?: "USER_TASK" | "REWARD"; relatedId?: string };
export type CreateAppealInput = { reason: string; userTaskId?: string; rewardId?: string; conversationId?: string };
