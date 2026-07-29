import type { DatabaseClient } from "@/lib/db";
import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { appendPersonalConversationMessage } from "./personal-conversation";

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
  const notification = existing ?? await database.notification.create({ data: {
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
  if (!existing) {
    await database.notificationStatusHistory.create({ data: {
      notificationId: notification.id,
      fromStatus: null,
      toStatus: "SENT",
      actorId: input.actorId ?? null,
      reason: "Серверное продуктовое событие",
      occurredAt: input.occurredAt,
    } });
  }

  try {
    const config = getServerConfig().security.dataProtection;
    await appendPersonalConversationMessage(
      database,
      new AesGcmDataProtector(config.keyId, config.key.reveal()),
      {
        userId: input.userId,
        messageId: notification.id,
        body: `${input.title}\n\n${input.body}`,
        occurredAt: input.occurredAt,
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "test") throw error;
  }
  return notification;
}
