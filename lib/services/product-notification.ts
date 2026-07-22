import type { DatabaseClient } from "@/lib/db";

export async function createProductNotification(database: DatabaseClient, input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedType: string;
  relatedId: string;
  idempotencyKey: string;
  actorId?: string | null;
  occurredAt: Date;
}) {
  const existing = await database.notification.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } });
  if (existing) return existing;
  const notification = await database.notification.create({ data: {
    userId: input.userId,
    type: input.type,
    channel: "IN_APP",
    status: "SENT",
    title: input.title,
    body: input.body,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    idempotencyKey: input.idempotencyKey,
    sentAt: input.occurredAt,
    createdAt: input.occurredAt,
  }, select: { id: true } });
  await database.notificationStatusHistory.create({ data: {
    notificationId: notification.id,
    fromStatus: null,
    toStatus: "SENT",
    actorId: input.actorId ?? null,
    reason: "Серверное продуктовое событие",
    occurredAt: input.occurredAt,
  } });
  return notification;
}
