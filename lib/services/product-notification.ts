import type { DatabaseClient } from "@/lib/db";
import { getServerConfig } from "@/lib/config";
import { AesGcmDataProtector } from "@/lib/data-protection";
import { databaseLocale, systemNotificationParts, type SystemMessageKey, type TranslationValues } from "@/lib/i18n";
import { appendPersonalConversationMessage, ensurePersonalConversationRecord } from "./personal-conversation";

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
  systemMessage?: { key: SystemMessageKey; params?: TranslationValues };
}) {
  const profile = input.systemMessage ? await database.userProfile.findUnique({ where: { userId: input.userId }, select: { preferredLanguage: true } }) : null;
  const locale = profile ? databaseLocale(profile.preferredLanguage) : null;
  const localized = input.systemMessage && locale ? systemNotificationParts(locale, input.systemMessage.key, input.systemMessage.params) : null;
  let protector: AesGcmDataProtector | null = null;
  try {
    const config = getServerConfig().security.dataProtection;
    protector = new AesGcmDataProtector(config.keyId, config.key.reveal());
    await ensurePersonalConversationRecord(database, protector, input.userId, input.occurredAt);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") throw error;
  }
  const existing = await database.notification.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } });
  const notification = existing ?? await database.notification.create({ data: {
      userId: input.userId,
      type: input.type,
      channel: "IN_APP",
      status: "SENT",
      title: localized?.title ?? input.title,
      body: localized?.body ?? input.body,
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

  if (protector) try {
    await appendPersonalConversationMessage(
      database,
      protector,
      {
        userId: input.userId,
        messageId: notification.id,
        body: `${input.title}\n\n${input.body}`,
        systemMessage: input.systemMessage && locale ? { ...input.systemMessage, locale } : undefined,
        occurredAt: input.occurredAt,
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "test") throw error;
  }
  return notification;
}
