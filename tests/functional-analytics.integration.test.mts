import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { AnalyticsService } from "../lib/analytics/service.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;
const disabled = () => new AnalyticsService(database, { enabled: false, requestTimeoutMs: 500, maxRetries: 5 });
const command = (eventName: "landing_viewed" | "registration_started" | "access_clicked", extra: Record<string, unknown> = {}) => ({ eventName, ...extra } as const);

beforeEach(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "ConversionDelivery", "AnalyticsEvent", "AnalyticsSession", "User" CASCADE');
});
after(async () => database.$disconnect());

test("first-touch, alias, UTM и refresh сохраняются без перезаписи", async () => {
  const service = disabled();
  const first = await service.captureClientEvent({ command: command("landing_viewed", { attribution: { clickid: "first-click", utm_source: "telegram", landing_path: "/welcome" } }) });
  const replay = await service.captureClientEvent({ anonymousId: first.anonymousId, command: command("landing_viewed", { attribution: { subid: "overwrite", utm_source: "other" } }) });
  assert.equal(replay.replayed, true);
  assert.equal(await database.analyticsSession.count(), 1);
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "LANDING_VIEWED" } }), 1);
  const session = await database.analyticsSession.findUniqueOrThrow({ where: { anonymousId: first.anonymousId } });
  assert.equal(session.keitaroSubId, "first-click");
  assert.match(JSON.stringify(session.firstTouch), /telegram/u);
  assert.doesNotMatch(JSON.stringify(session.firstTouch), /overwrite/u);
});

test("placement хранится, registration_started дедуплицируется и anonymous session связывается с Player/Partner", async () => {
  for (const role of ["PLAYER", "PARTNER"] as const) {
    const service = disabled();
    const landing = await service.captureClientEvent({ command: command("landing_viewed") });
    await service.captureClientEvent({ anonymousId: landing.anonymousId, command: command("access_clicked", { clientEventId: `click-${randomUUID()}`, metadata: { placement: "hero" } }) });
    await service.captureClientEvent({ anonymousId: landing.anonymousId, command: command("registration_started", { metadata: { role } }) });
    await service.captureClientEvent({ anonymousId: landing.anonymousId, command: command("registration_started", { metadata: { role } }) });
    const user = await database.user.create({ data: { email: `${role.toLowerCase()}-${randomUUID()}@test.invalid` } });
    await database.$transaction((tx) => service.linkAnonymousSession(tx, { anonymousId: landing.anonymousId, userId: user.id, email: user.email, productRole: role, occurredAt: new Date() }));
    const session = await database.analyticsSession.findUniqueOrThrow({ where: { anonymousId: landing.anonymousId } });
    assert.equal(session.userId, user.id);
    assert.equal(session.isTest, true);
  }
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "REGISTRATION_STARTED" } }), 2);
  assert.deepEqual((await database.analyticsEvent.findFirstOrThrow({ where: { eventName: "ACCESS_CLICKED" } })).metadata, { placement: "hero" });
});

test("серверная регистрация гарантирует registration_started даже без attribution cookie", async () => {
  const service = disabled();
  const user = await database.user.create({ data: { email: `${randomUUID()}@example.com` } });
  const input = { anonymousId: null, userId: user.id, email: user.email, productRole: "PLAYER" as const, occurredAt: new Date() };
  await database.$transaction((tx) => service.linkAnonymousSession(tx, input));
  await database.$transaction((tx) => service.linkAnonymousSession(tx, input));
  const session = await database.analyticsSession.findFirstOrThrow({ where: { userId: user.id } });
  const event = await database.analyticsEvent.findFirstOrThrow({ where: { analyticsSessionId: session.id, eventName: "REGISTRATION_STARTED" } });
  assert.deepEqual(event.metadata, { role: "PLAYER" });
  assert.equal(event.userId, null);
  assert.equal(await database.analyticsEvent.count({ where: { analyticsSessionId: session.id, eventName: "REGISTRATION_STARTED" } }), 1);
});

test("email и Dashboard — серверные события с дедупликацией auth session", async () => {
  const service = disabled();
  const landing = await service.captureClientEvent({ command: command("landing_viewed") });
  await service.captureClientEvent({ anonymousId: landing.anonymousId, command: command("access_clicked", { clientEventId: `click-${randomUUID()}`, metadata: { placement: "header" } }) });
  await service.captureClientEvent({ anonymousId: landing.anonymousId, command: command("registration_started", { metadata: { role: "PLAYER" } }) });
  const user = await database.user.create({ data: { email: `${randomUUID()}@example.com` } });
  await database.$transaction((tx) => service.linkAnonymousSession(tx, { anonymousId: landing.anonymousId, userId: user.id, email: user.email, productRole: "PLAYER", occurredAt: new Date() }));
  const sessionId = randomUUID();
  await database.$transaction((tx) => service.recordEmailConfirmed(tx, { userId: user.id, authSessionId: sessionId, occurredAt: new Date() }));
  await database.$transaction((tx) => service.recordEmailConfirmed(tx, { userId: user.id, authSessionId: sessionId, occurredAt: new Date() }));
  const principal = { userId: user.id, sessionId, roleKeys: ["authenticated"], permissionKeys: [] };
  await service.recordDashboardOpened(principal);
  await service.recordDashboardOpened(principal);
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "EMAIL_CONFIRMED" } }), 1);
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "DASHBOARD_OPENED" } }), 1);
  await service.recordDashboardOpened({ ...principal, sessionId: randomUUID() });
  assert.equal(await database.analyticsEvent.count({ where: { eventName: "DASHBOARD_OPENED" } }), 2);
  const report = await service.funnel(new Date(Date.now() - 60_000), new Date(Date.now() + 60_000));
  assert.equal(report.emailConfirmed.count, 1);
  assert.equal(report.dashboardOpened.count, 1);
  assert.equal(report.dashboardOpened.rate, 100);
});

test("Keitaro outbox доставляет один раз, 5xx уходит в retry, disabled не создаёт delivery", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let requests = 0;
    globalThis.fetch = async () => { requests += 1; return new Response("ok", { status: 200 }); };
    const service = new AnalyticsService(database, { enabled: true, postbackUrl: "https://tracker.example/secret/postback", requestTimeoutMs: 500, maxRetries: 5 });
    await service.captureClientEvent({ command: command("registration_started", { metadata: { role: "PLAYER" }, attribution: { subid: "tracked-1" } }) });
    assert.equal((await service.deliverPending()).delivered, 1);
    assert.equal((await service.deliverPending()).delivered, 0);
    assert.equal(requests, 1);
    assert.equal(await database.conversionDelivery.count({ where: { status: "DELIVERED" } }), 1);

    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await service.captureClientEvent({ command: command("registration_started", { metadata: { role: "PLAYER" }, attribution: { subid: "tracked-2" } }) });
    await service.deliverPending();
    assert.equal(await database.conversionDelivery.count({ where: { status: "RETRY" } }), 1);

    const off = disabled();
    await off.captureClientEvent({ command: command("registration_started", { metadata: { role: "PLAYER" }, attribution: { subid: "tracked-off" } }) });
    assert.equal(await database.conversionDelivery.count(), 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("воронка исключает test identities и безопасно считает нулевой знаменатель", async () => {
  const service = disabled();
  const empty = await service.funnel(new Date("2026-01-01"), new Date("2026-01-02"));
  assert.equal(empty.accessClicked.rate, 0);
  const real = await service.captureClientEvent({ command: command("landing_viewed") });
  await service.captureClientEvent({ anonymousId: real.anonymousId, command: command("access_clicked", { clientEventId: `click-${randomUUID()}`, metadata: { placement: "header" } }) });
  const report = await service.funnel(new Date(Date.now() - 60_000), new Date(Date.now() + 60_000));
  assert.equal(report.landingViewed, 1);
  assert.equal(report.accessClicked.rate, 100);
});
