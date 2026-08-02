import "server-only";

import { randomUUID } from "node:crypto";

import type { AdminMessengerDetail, AdminMessengerList, AdminMessengerNote } from "@/lib/admin-messenger";
import type { AuthenticatedPrincipal } from "@/lib/auth";
import { ApplicationError, createTransactionalEventServices, PrismaTransactionRunner } from "@/lib/application";
import type { AesGcmDataProtector, EncryptedPayload } from "@/lib/data-protection";
import { Prisma, type PrismaClient } from "@/lib/db";
import type { SupportConversationView } from "@/lib/support";
import { ensurePersonalConversationRecord } from "./personal-conversation";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function requireAdmin(actor: AuthenticatedPrincipal) {
  if (!actor.roleKeys.includes("admin") || !actor.permissionKeys.includes("support.admin")) {
    throw new ApplicationError("FORBIDDEN", "Недостаточно прав для Messenger");
  }
}

function cleanText(value: unknown, min = 1, max = 5000) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < min || text.length > max) throw new ApplicationError("VALIDATION", "Проверьте текст сообщения");
  return text;
}

function object(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function adminReadAt(context: Prisma.JsonValue, actorId: string) {
  const reads = object(object(context).adminMessengerReads as Prisma.JsonValue);
  const value = reads[actorId];
  return typeof value === "string" && Number.isFinite(new Date(value).getTime()) ? new Date(value) : null;
}

type ConversationRecord = Awaited<ReturnType<AdminMessengerService["conversationRecord"]>>;

export class AdminMessengerService {
  private readonly transactions: PrismaTransactionRunner;

  constructor(private readonly database: PrismaClient, private readonly protector: AesGcmDataProtector) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  async list(actor: AuthenticatedPrincipal, search = ""): Promise<AdminMessengerList> {
    requireAdmin(actor);
    const query = search.trim();
    const searchFilters: Prisma.UserProfileWhereInput[] = query ? [
      { user: { displayName: { contains: query, mode: "insensitive" } } },
      { user: { email: { contains: query, mode: "insensitive" } } },
      ...(/^[0-9a-f-]{8,}$/i.test(query) ? [{ userId: query }] : []),
    ] : [];
    const profiles = await this.database.userProfile.findMany({
      where: {
        productRole: "PLAYER",
        user: { disabledAt: null },
        ...(query ? { OR: searchFilters } : {}),
      },
      include: { user: true, market: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const items = await Promise.all(profiles.map(async (profile) => {
      const ensured = await ensurePersonalConversationRecord(this.database, this.protector, profile.userId);
      const conversation = await this.database.supportConversation.findUniqueOrThrow({
        where: { id: ensured.id },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { internalNotes: true } },
        },
      });
      const readAt = adminReadAt(conversation.context, actor.userId);
      const unreadCount = await this.database.supportMessage.count({
        where: {
          conversationId: conversation.id,
          authorType: "USER",
          ...(readAt ? { createdAt: { gt: readAt } } : {}),
        },
      });
      const last = conversation.messages[0];
      const lastMessage = last
        ? decoder.decode(await this.protector.decrypt(last.bodyProtected as unknown as EncryptedPayload, {
          classification: "confidential",
          purpose: "support-message",
          resourceType: "SupportConversation",
          resourceId: conversation.id,
        }))
        : "Диалог создан";
      return {
        userId: profile.userId,
        conversationId: conversation.id,
        name: profile.user.displayName || "Участник VX House",
        email: profile.user.email,
        initials: (profile.user.displayName || profile.user.email).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("ru"),
        market: profile.market.name,
        role: "PLAYER" as const,
        registeredAt: profile.user.createdAt.toISOString(),
        online: Boolean(profile.user.updatedAt && Date.now() - profile.user.updatedAt.getTime() < 15 * 60_000),
        lastMessage: lastMessage.replace(/\s+/g, " ").trim(),
        lastMessageAt: last?.createdAt.toISOString() ?? null,
        unreadCount,
        hasNotes: conversation._count.internalNotes > 0,
      };
    }));

    items.sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
    return { items, unreadCount: items.reduce((sum, item) => sum + item.unreadCount, 0) };
  }

  async detail(actor: AuthenticatedPrincipal, conversationId: string): Promise<AdminMessengerDetail> {
    requireAdmin(actor);
    const record = await this.conversationRecord(conversationId);
    if (!record || record.user.profile?.productRole !== "PLAYER") throw new ApplicationError("NOT_FOUND", "Диалог игрока не найден");
    const listItem = (await this.list(actor, record.user.email)).items.find((item) => item.conversationId === conversationId);
    if (!listItem) throw new ApplicationError("NOT_FOUND", "Диалог игрока не найден");
    const [rank, points, task, action] = await Promise.all([
      this.database.userRank.findFirst({ where: { userId: record.userId }, include: { rankDefinition: true }, orderBy: { assignedAt: "desc" } }),
      this.database.vXPointsLedgerEntry.aggregate({ where: { userId: record.userId, status: "CONFIRMED" }, _sum: { delta: true } }),
      this.database.userTask.findFirst({ where: { userId: record.userId, status: { notIn: ["CONFIRMED", "REJECTED", "CANCELLED", "EXPIRED"] } }, include: { taskVersion: true }, orderBy: { updatedAt: "desc" } }),
      this.database.auditEvent.findFirst({ where: { actorId: record.userId }, orderBy: { occurredAt: "desc" } }),
    ]);
    return {
      player: {
        ...listItem,
        rank: rank?.rankDefinition.code ?? "Explorer",
        points: points._sum.delta ?? 0,
        currentTask: task?.taskVersion.title ?? "Нет активного задания",
        lastAction: action ? action.action : "Профиль создан",
        profileHref: `/admin/users/${record.userId}`,
      },
      conversation: await this.conversationView(record),
      notes: await this.noteViews(record.internalNotes),
    };
  }

  async markRead(actor: AuthenticatedPrincipal, conversationId: string) {
    requireAdmin(actor);
    const conversation = await this.database.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new ApplicationError("NOT_FOUND", "Диалог не найден");
    const context = object(conversation.context);
    const reads = object(context.adminMessengerReads as Prisma.JsonValue);
    await this.database.supportConversation.update({
      where: { id: conversationId },
      data: {
        context: { ...context, adminMessengerReads: { ...reads, [actor.userId]: new Date().toISOString() } } as Prisma.InputJsonValue,
        updatedAt: conversation.updatedAt,
      },
    });
    return { ok: true };
  }

  async sendMessage(actor: AuthenticatedPrincipal, conversationId: string, body: string) {
    requireAdmin(actor);
    const text = cleanText(body);
    await this.transactions.run(async ({ database, occurredAt }) => {
      const conversation = await database.supportConversation.findUnique({ where: { id: conversationId } });
      if (!conversation) throw new ApplicationError("NOT_FOUND", "Диалог не найден");
      const protectedBody = await this.encrypt(text, "support-message", conversationId);
      const message = await database.supportMessage.create({
        data: { conversationId, authorType: "OPERATOR", authorId: actor.userId, bodyProtected: protectedBody as never, createdAt: occurredAt },
      });
      await database.supportConversation.update({ where: { id: conversationId }, data: { updatedAt: occurredAt } });
      await createTransactionalEventServices(database, occurredAt).audit.record({
        actor: { type: "user", id: actor.userId, sessionId: actor.sessionId },
        action: "admin.messenger.message.sent",
        target: { type: "support-conversation", id: conversationId },
        metadata: { messageId: message.id },
      });
    });
    return this.detail(actor, conversationId);
  }

  async addAttachment(actor: AuthenticatedPrincipal, conversationId: string, messageId: string, file: File) {
    requireAdmin(actor);
    if (!allowedTypes.has(file.type)) throw new ApplicationError("VALIDATION", "Разрешены JPG, PNG, WEBP и PDF");
    if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new ApplicationError("VALIDATION", "Размер файла не должен превышать 10 МБ");
    const message = await this.database.supportMessage.findFirst({ where: { id: messageId, conversationId, authorId: actor.userId, authorType: "OPERATOR" } });
    if (!message) throw new ApplicationError("FORBIDDEN", "Файл можно добавить только к своему сообщению");
    const id = randomUUID();
    const fileName = file.name.trim().replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 240) || "attachment";
    const contentProtected = await this.protector.encrypt(new Uint8Array(await file.arrayBuffer()), {
      classification: "confidential", purpose: "support-attachment", resourceType: "SupportAttachment", resourceId: id,
    });
    return this.database.supportAttachment.create({ data: { id, messageId, fileName, mediaType: file.type, sizeBytes: file.size, contentProtected: contentProtected as never } });
  }

  async getAttachment(actor: AuthenticatedPrincipal, conversationId: string, attachmentId: string) {
    requireAdmin(actor);
    const attachment = await this.database.supportAttachment.findFirst({ where: { id: attachmentId, message: { conversationId } } });
    if (!attachment) throw new ApplicationError("NOT_FOUND", "Файл не найден");
    const bytes = await this.protector.decrypt(attachment.contentProtected as unknown as EncryptedPayload, {
      classification: "confidential", purpose: "support-attachment", resourceType: "SupportAttachment", resourceId: attachment.id,
    });
    return { ...attachment, bytes };
  }

  async note(actor: AuthenticatedPrincipal, conversationId: string, input: { action: "create" | "edit" | "delete"; logicalId?: string; body?: string }) {
    requireAdmin(actor);
    await this.transactions.run(async ({ database, occurredAt }) => {
      const conversation = await database.supportConversation.findUnique({ where: { id: conversationId } });
      if (!conversation) throw new ApplicationError("NOT_FOUND", "Диалог не найден");
      const logicalId = input.action === "create" ? randomUUID() : String(input.logicalId ?? "");
      if (!logicalId) throw new ApplicationError("VALIDATION", "Заметка не найдена");
      const body = input.action === "delete" ? "" : cleanText(input.body, 1, 3000);
      const envelope = JSON.stringify({ messengerNote: 1, logicalId, action: input.action, body });
      await database.supportInternalNote.create({
        data: {
          conversationId,
          authorId: actor.userId,
          bodyProtected: await this.encrypt(envelope, "support-internal-note", conversationId) as never,
          createdAt: occurredAt,
        },
      });
      await createTransactionalEventServices(database, occurredAt).audit.record({
        actor: { type: "user", id: actor.userId, sessionId: actor.sessionId },
        action: `admin.messenger.note.${input.action}`,
        target: { type: "support-conversation", id: conversationId },
        metadata: { logicalId },
      });
    });
    return this.detail(actor, conversationId);
  }

  async conversationRecord(conversationId: string) {
    return this.database.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        categoryDefinition: true,
        user: { include: { profile: { include: { market: true } } } },
        messages: { include: { author: true, attachments: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "asc" } },
        internalNotes: { include: { author: true }, orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { occurredAt: "asc" } },
        appeals: { include: { statusHistory: { orderBy: { occurredAt: "asc" } } } },
      },
    });
  }

  private async conversationView(item: NonNullable<ConversationRecord>): Promise<SupportConversationView> {
    const context = object(item.context);
    const readValue = context.playerMessengerReadAt;
    const readAt = typeof readValue === "string" && Number.isFinite(new Date(readValue).getTime()) ? new Date(readValue) : null;
    return {
      id: item.id,
      category: { key: item.categoryDefinition.key, title: item.categoryDefinition.title, description: item.categoryDefinition.description },
      priority: item.priority,
      status: item.status,
      subject: item.subject,
      context,
      unreadCount: item.messages.filter((message) => message.authorType !== "USER" && (!readAt || message.createdAt > readAt)).length,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      messages: await Promise.all(item.messages.map(async (message) => ({
        id: message.id,
        authorType: message.authorType,
        authorLabel: message.authorType === "USER" ? item.user.displayName || "Игрок" : message.author?.displayName || (message.authorType === "SYSTEM" ? "VX House" : "Менеджер"),
        body: decoder.decode(await this.protector.decrypt(message.bodyProtected as unknown as EncryptedPayload, {
          classification: "confidential", purpose: "support-message", resourceType: "SupportConversation", resourceId: item.id,
        })),
        createdAt: message.createdAt.toISOString(),
        attachments: message.attachments.map(({ id, fileName, mediaType, sizeBytes }) => ({ id, fileName, mediaType, sizeBytes })),
      }))),
      history: item.statusHistory.map((entry) => ({ ...entry, occurredAt: entry.occurredAt.toISOString() })),
      appeals: [],
    };
  }

  private async noteViews(rows: NonNullable<ConversationRecord>["internalNotes"]): Promise<AdminMessengerNote[]> {
    const current = new Map<string, AdminMessengerNote>();
    for (const row of rows) {
      const raw = decoder.decode(await this.protector.decrypt(row.bodyProtected as unknown as EncryptedPayload, {
        classification: "confidential", purpose: "support-internal-note", resourceType: "SupportConversation", resourceId: row.conversationId,
      }));
      let envelope: { logicalId: string; action: string; body: string } | null = null;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed.messengerNote === 1) envelope = { logicalId: String(parsed.logicalId), action: String(parsed.action), body: String(parsed.body ?? "") };
      } catch {}
      const logicalId = envelope?.logicalId ?? row.id;
      if (envelope?.action === "delete") {
        current.delete(logicalId);
        continue;
      }
      const previous = current.get(logicalId);
      current.set(logicalId, {
        id: row.id,
        logicalId,
        body: envelope?.body ?? raw,
        author: row.author.displayName || row.author.email,
        createdAt: previous?.createdAt ?? row.createdAt.toISOString(),
        modifiedAt: previous ? row.createdAt.toISOString() : null,
        edited: Boolean(previous),
      });
    }
    return [...current.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private encrypt(value: string, purpose: "support-message" | "support-internal-note", resourceId: string) {
    return this.protector.encrypt(encoder.encode(value), {
      classification: "confidential", purpose, resourceType: "SupportConversation", resourceId,
    });
  }
}
