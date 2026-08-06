import "server-only";

import { randomUUID } from "node:crypto";

import { PrismaTransactionRunner } from "@/lib/application";
import type { AuthenticatedPrincipal } from "@/lib/auth";
import { Prisma, type DatabaseClient, type PrismaClient } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { buildKeitaroPostbackUrl, keitaroStatus, keitaroTransactionId, type KeitaroConfig } from "./keitaro";
import type { AnalyticsEventName, ClientAnalyticsCommand, FunnelReport } from "./types";
import { isTestIdentity, sanitizeFirstTouch } from "./validation";

const EVENT_TO_DATABASE = {
  landing_viewed: "LANDING_VIEWED",
  access_clicked: "ACCESS_CLICKED",
  registration_started: "REGISTRATION_STARTED",
  email_confirmed: "EMAIL_CONFIRMED",
  dashboard_opened: "DASHBOARD_OPENED",
} as const;

const logger = createLogger({ level: "info", context: { component: "analytics" } });
const ANONYMOUS_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function asJson(value: unknown) { return value as Prisma.InputJsonValue; }
function rate(numerator: number, denominator: number) { return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0; }

export class AnalyticsService {
  private readonly transactions: PrismaTransactionRunner;

  constructor(private readonly database: PrismaClient, private readonly keitaro: KeitaroConfig) {
    this.transactions = new PrismaTransactionRunner(database);
  }

  validAnonymousId(value: string | null | undefined) {
    return value && ANONYMOUS_ID.test(value) ? value : null;
  }

  async captureClientEvent(input: { anonymousId?: string | null; command: ClientAnalyticsCommand; now?: Date }) {
    const supplied = this.validAnonymousId(input.anonymousId);
    const anonymousId = supplied ?? randomUUID();
    const result = await this.transactions.run(async ({ database, occurredAt }) => {
      let session = await database.analyticsSession.findUnique({ where: { anonymousId } });
      if (!session) {
        const firstTouch = sanitizeFirstTouch(input.command.attribution, input.now ?? occurredAt);
        session = await database.analyticsSession.create({
          data: { anonymousId, keitaroSubId: firstTouch.subid, firstTouch: asJson(firstTouch), createdAt: occurredAt },
        });
      }
      const key = input.command.eventName === "access_clicked"
        ? `analytics:${input.command.eventName}:${session.id}:${input.command.clientEventId}`
        : `analytics:${input.command.eventName}:${session.id}`;
      const existing = await database.analyticsEvent.findUnique({ where: { idempotencyKey: key } });
      if (existing) return { session, event: existing, replayed: true };
      const eventId = randomUUID();
      const event = await database.analyticsEvent.create({
        data: {
          id: eventId,
          eventName: EVENT_TO_DATABASE[input.command.eventName],
          analyticsSessionId: session.id,
          userId: session.userId,
          metadata: asJson(input.command.metadata ?? {}),
          idempotencyKey: key,
          isTest: session.isTest,
          occurredAt,
        },
      });
      await this.queueConversion(database, eventId, input.command.eventName, session.keitaroSubId, occurredAt);
      return { session, event, replayed: false };
    });
    return { anonymousId, createdCookie: !supplied, eventId: result.event.id, replayed: result.replayed };
  }

  async linkAnonymousSession(database: DatabaseClient, input: { anonymousId?: string | null; userId: string; email: string; productRole: "PLAYER" | "PARTNER"; occurredAt: Date }) {
    const anonymousId = this.validAnonymousId(input.anonymousId);
    const attributedSession = anonymousId ? await database.analyticsSession.findUnique({ where: { anonymousId } }) : null;
    const existingSession = attributedSession ?? await database.analyticsSession.findFirst({
      where: { userId: input.userId },
      orderBy: { createdAt: "asc" },
    });
    if (existingSession?.userId && existingSession.userId !== input.userId) return null;
    const session = existingSession
      ? await database.analyticsSession.update({
          where: { id: existingSession.id },
          data: { userId: input.userId, isTest: isTestIdentity(input.email), updatedAt: input.occurredAt },
        })
      : await database.analyticsSession.create({
          data: {
            anonymousId: randomUUID(),
            userId: input.userId,
            firstTouch: asJson(sanitizeFirstTouch(undefined, input.occurredAt)),
            isTest: isTestIdentity(input.email),
            createdAt: input.occurredAt,
          },
        });
    const existingEvent = await database.analyticsEvent.findFirst({
      where: {
        eventName: "REGISTRATION_STARTED",
        OR: [
          { analyticsSessionId: session.id },
          { userId: input.userId },
        ],
      },
    });
    if (existingEvent) return session;
    const eventId = randomUUID();
    await database.analyticsEvent.create({
      data: {
        id: eventId,
        eventName: "REGISTRATION_STARTED",
        analyticsSessionId: session.id,
        userId: null,
        metadata: { role: input.productRole },
        idempotencyKey: `analytics:registration_started:${session.id}`,
        isTest: isTestIdentity(input.email),
        occurredAt: input.occurredAt,
      },
    });
    await this.queueConversion(database, eventId, "registration_started", session.keitaroSubId, input.occurredAt);
    return session;
  }

  async recordEmailConfirmed(database: DatabaseClient, input: { userId: string; authSessionId: string; occurredAt: Date }) {
    return this.recordServerEvent(database, {
      eventName: "email_confirmed",
      userId: input.userId,
      authSessionId: input.authSessionId,
      idempotencyKey: `analytics:email_confirmed:${input.userId}`,
      occurredAt: input.occurredAt,
    });
  }

  async recordDashboardOpened(principal: AuthenticatedPrincipal) {
    return this.transactions.run(({ database, occurredAt }) => this.recordServerEvent(database, {
      eventName: "dashboard_opened",
      userId: principal.userId,
      authSessionId: principal.sessionId,
      idempotencyKey: `analytics:dashboard_opened:${principal.sessionId}`,
      occurredAt,
    }));
  }

  private async recordServerEvent(database: DatabaseClient, input: { eventName: "email_confirmed" | "dashboard_opened"; userId: string; authSessionId: string; idempotencyKey: string; occurredAt: Date }) {
    const existing = await database.analyticsEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return existing;
    const user = await database.user.findUnique({ where: { id: input.userId }, select: { email: true } });
    const analyticsSession = await database.analyticsSession.findFirst({ where: { userId: input.userId }, orderBy: { createdAt: "asc" } });
    const eventId = randomUUID();
    const event = await database.analyticsEvent.create({
      data: {
        id: eventId,
        eventName: EVENT_TO_DATABASE[input.eventName],
        analyticsSessionId: analyticsSession?.id,
        userId: input.userId,
        authSessionId: input.authSessionId,
        metadata: {},
        idempotencyKey: input.idempotencyKey,
        isTest: analyticsSession?.isTest ?? isTestIdentity(user?.email),
        occurredAt: input.occurredAt,
      },
    });
    await this.queueConversion(database, eventId, input.eventName, analyticsSession?.keitaroSubId, input.occurredAt);
    return event;
  }

  private async queueConversion(database: DatabaseClient, eventId: string, eventName: AnalyticsEventName, subid: string | null | undefined, occurredAt: Date) {
    const status = keitaroStatus(eventName, this.keitaro.dashboardStatus);
    if (!this.keitaro.enabled || !status || !subid) return;
    await database.conversionDelivery.create({
      data: {
        eventId,
        provider: "keitaro",
        providerStatus: status,
        transactionId: keitaroTransactionId(eventName, eventId),
        nextAttemptAt: occurredAt,
      },
    });
  }

  async deliverPending(limit = 20, now = new Date()) {
    if (!this.keitaro.enabled || !this.keitaro.postbackUrl) return { attempted: 0, delivered: 0 };
    const abandonedBefore = new Date(now.getTime() - Math.max(this.keitaro.requestTimeoutMs * 2, 60_000));
    const pending = await this.database.conversionDelivery.findMany({
      where: {
        attemptCount: { lt: this.keitaro.maxRetries },
        OR: [
          { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
          { status: "PROCESSING", updatedAt: { lte: abandonedBefore } },
        ],
      },
      include: { event: { include: { analyticsSession: true } } },
      orderBy: { createdAt: "asc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
    let delivered = 0;
    for (const item of pending) {
      const claimed = await this.database.conversionDelivery.updateMany({
        where: { id: item.id, status: item.status, attemptCount: item.attemptCount, updatedAt: item.updatedAt },
        data: { status: "PROCESSING", attemptCount: { increment: 1 } },
      });
      if (claimed.count !== 1) continue;
      const subid = item.event.analyticsSession?.keitaroSubId;
      if (!subid) {
        await this.database.conversionDelivery.update({ where: { id: item.id }, data: { status: "SKIPPED", lastErrorSafe: "missing_attribution" } });
        continue;
      }
      try {
        const url = buildKeitaroPostbackUrl(this.keitaro.postbackUrl, { subid, status: item.providerStatus, transactionId: item.transactionId });
        const response = await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(this.keitaro.requestTimeoutMs) });
        if (!response.ok) throw new Error(`provider_http_${response.status}`);
        await this.database.conversionDelivery.update({
          where: { id: item.id },
          data: { status: "DELIVERED", deliveredAt: new Date(), lastErrorSafe: null, providerTransactionId: response.headers.get("x-request-id")?.slice(0, 255) ?? null },
        });
        delivered += 1;
      } catch (error) {
        const attempts = item.attemptCount + 1;
        const exhausted = attempts >= this.keitaro.maxRetries;
        const safeReason = error instanceof Error && /^provider_http_\d{3}$/u.test(error.message) ? error.message : "provider_unavailable";
        await this.database.conversionDelivery.update({
          where: { id: item.id },
          data: {
            status: exhausted ? "EXHAUSTED" : "RETRY",
            nextAttemptAt: new Date(now.getTime() + Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempts - 1))),
            lastErrorSafe: safeReason,
          },
        });
        logger.warn("conversion_delivery_deferred", { deliveryId: item.id, attempt: attempts, reason: safeReason });
      }
    }
    return { attempted: pending.length, delivered };
  }

  async funnel(from: Date, to: Date): Promise<FunnelReport> {
    const events = await this.database.analyticsEvent.findMany({
      where: {
        occurredAt: { gte: from, lt: to },
        isTest: false,
        OR: [{ analyticsSession: null }, { analyticsSession: { isTest: false } }],
      },
      select: {
        eventName: true,
        analyticsSessionId: true,
        userId: true,
        analyticsSession: { select: { userId: true } },
      },
    });
    const landingSessions = new Set(events.filter((event) => event.eventName === "LANDING_VIEWED").map((event) => event.analyticsSessionId).filter((value): value is string => Boolean(value)));
    const accessSessions = new Set(events.filter((event) => event.eventName === "ACCESS_CLICKED" && event.analyticsSessionId && landingSessions.has(event.analyticsSessionId)).map((event) => event.analyticsSessionId as string));
    const registrationEvents = events.filter((event) => event.eventName === "REGISTRATION_STARTED" && event.analyticsSessionId && accessSessions.has(event.analyticsSessionId));
    const registrationSessions = new Set(registrationEvents.map((event) => event.analyticsSessionId as string));
    const registrationUsers = new Set(registrationEvents.map((event) => event.userId ?? event.analyticsSession?.userId).filter((value): value is string => Boolean(value)));
    const confirmedUsers = new Set(events.filter((event) => event.eventName === "EMAIL_CONFIRMED" && event.userId && registrationUsers.has(event.userId)).map((event) => event.userId as string));
    const dashboardUsers = new Set(events.filter((event) => event.eventName === "DASHBOARD_OPENED" && event.userId && confirmedUsers.has(event.userId)).map((event) => event.userId as string));
    const landingViewed = landingSessions.size;
    const accessClicked = accessSessions.size;
    const registrationStarted = registrationSessions.size;
    const emailConfirmed = confirmedUsers.size;
    const dashboardOpened = dashboardUsers.size;
    return {
      from: from.toISOString(), to: to.toISOString(), landingViewed,
      accessClicked: { count: accessClicked, rate: rate(accessClicked, landingViewed) },
      registrationStarted: { count: registrationStarted, rate: rate(registrationStarted, accessClicked) },
      emailConfirmed: { count: emailConfirmed, rate: rate(emailConfirmed, registrationStarted) },
      dashboardOpened: { count: dashboardOpened, rate: rate(dashboardOpened, emailConfirmed) },
    };
  }
}
