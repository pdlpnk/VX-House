import "server-only";

import { createHash } from "node:crypto";

import type { AesGcmDataProtector } from "@/lib/data-protection";
import type { DatabaseClient } from "@/lib/db";

const encoder = new TextEncoder();

function stableUuid(value: string) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest("hex").slice(0, 32), "hex");
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function protectedBody(
  protector: AesGcmDataProtector,
  conversationId: string,
  body: string,
) {
  return protector.encrypt(encoder.encode(body), {
    classification: "confidential",
    purpose: "support-message",
    resourceType: "SupportConversation",
    resourceId: conversationId,
  });
}

export async function ensurePersonalConversationRecord(
  database: DatabaseClient,
  protector: AesGcmDataProtector,
  userId: string,
  occurredAt = new Date(),
) {
  const profile = await database.userProfile.findUnique({
    where: { userId },
    select: {
      productRole: true,
      marketId: true,
      createdAt: true,
      user: { select: { displayName: true } },
    },
  });
  if (!profile) throw new Error("Профиль пользователя не найден");

  let conversation = await database.supportConversation.findFirst({
    where: {
      userId,
      context: { path: ["personalConversation"], equals: true },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!conversation) {
    const legacyConversation = await database.supportConversation.findFirst({
      where: { userId, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
    });

    if (legacyConversation) {
      conversation = await database.supportConversation.update({
        where: { id: legacyConversation.id },
        data: {
          subject: "Менеджер VX House",
          priority: "NORMAL",
          context: {
            ...asObject(legacyConversation.context),
            personalConversation: true,
          },
        },
      });
    } else {
      const categories = await database.supportCategory.findMany({
        where: {
          isActive: true,
          OR: [{ marketId: null }, { marketId: profile.marketId }],
        },
        orderBy: { createdAt: "asc" },
      });
      let category = categories.find((item) =>
        Array.isArray(item.roles) && item.roles.includes(profile.productRole)
      );
      if (!category) {
        category = await database.supportCategory.upsert({
          where: { key: "personal-manager" },
          create: {
            key: "personal-manager",
            title: "Персональный менеджер",
            description: "Постоянный личный канал связи с VX House.",
            roles: ["PLAYER", "PARTNER"],
            marketId: null,
            isActive: true,
          },
          update: {
            title: "Персональный менеджер",
            description: "Постоянный личный канал связи с VX House.",
            roles: ["PLAYER", "PARTNER"],
            marketId: null,
            isActive: true,
          },
        });
      }

      const conversationId = stableUuid(`vx-house:personal-conversation:${userId}`);
      conversation = await database.supportConversation.upsert({
        where: { id: conversationId },
        create: {
          id: conversationId,
          userId,
          category: category.key,
          priority: "NORMAL",
          status: "CREATED",
          subject: "Менеджер VX House",
          context: {
            personalConversation: true,
            role: profile.productRole,
            marketId: profile.marketId,
          },
          createdAt: occurredAt,
          updatedAt: occurredAt,
        },
        update: {
          subject: "Менеджер VX House",
          category: category.key,
          priority: "NORMAL",
          context: {
            personalConversation: true,
            role: profile.productRole,
            marketId: profile.marketId,
          },
        },
      });
      const historyId = stableUuid(`vx-house:personal-conversation-created:${userId}`);
      await database.supportStatusHistory.upsert({
        where: { id: historyId },
        create: {
          id: historyId,
          conversationId: conversation.id,
          fromStatus: null,
          toStatus: "CREATED",
          actorId: null,
          reason: "Создан постоянный персональный канал",
          occurredAt,
        },
        update: {},
      });
    }
  }

  const notifications = await database.notification.findMany({
    where: {
      userId,
      channel: "IN_APP",
      status: { in: ["SENT", "READ"] },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const hasMessages = await database.supportMessage.findFirst({
    where: { conversationId: conversation.id },
    select: { id: true },
  });
  if (!hasMessages) {
    const name = profile.user.displayName?.trim() || "участник";
    const greeting = [
      `Здравствуйте, ${name}!`,
      "Добро пожаловать в VX House.",
      "Я ваш персональный менеджер. Если возникнут вопросы — просто напишите мне.",
    ].join("\n\n");
    await database.supportMessage.create({
      data: {
        conversationId: conversation.id,
        authorType: "SYSTEM",
        authorId: null,
        bodyProtected: await protectedBody(protector, conversation.id, greeting) as never,
        createdAt: new Date(
          Math.min(
            profile.createdAt.getTime(),
            notifications.at(0)?.createdAt.getTime() ?? occurredAt.getTime(),
          ) - 1_000,
        ),
      },
    });
  }

  for (const notification of notifications) {
    const mirrored = await database.supportMessage.findUnique({
      where: { id: notification.id },
      select: { id: true },
    });
    if (!mirrored) {
      await database.supportMessage.create({
        data: {
          id: notification.id,
          conversationId: conversation.id,
          authorType: "SYSTEM",
          authorId: null,
          bodyProtected: await protectedBody(
            protector,
            conversation.id,
            `${notification.title}\n\n${notification.body}`,
          ) as never,
          createdAt: notification.createdAt,
        },
      });
    }
  }

  return conversation;
}

export async function appendPersonalConversationMessage(
  database: DatabaseClient,
  protector: AesGcmDataProtector,
  input: {
    userId: string;
    messageId: string;
    body: string;
    occurredAt: Date;
  },
) {
  const existing = await database.supportMessage.findUnique({
    where: { id: input.messageId },
    select: { id: true },
  });
  if (existing) return existing;

  const conversation = await ensurePersonalConversationRecord(
    database,
    protector,
    input.userId,
    input.occurredAt,
  );
  const message = await database.supportMessage.create({
    data: {
      id: input.messageId,
      conversationId: conversation.id,
      authorType: "SYSTEM",
      authorId: null,
      bodyProtected: await protectedBody(
        protector,
        conversation.id,
        input.body,
      ) as never,
      createdAt: input.occurredAt,
    },
    select: { id: true },
  });
  await database.supportConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: input.occurredAt },
  });
  return message;
}
