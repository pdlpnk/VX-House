import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { ApplicationError } from "../lib/application/index.ts";
import type { AuthenticatedPrincipal } from "../lib/auth/index.ts";
import { AesGcmDataProtector } from "../lib/data-protection/index.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { AdminApplicationService, PlatformOperationsService, promocodeFingerprint } from "../lib/services/index.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;
const protector = new AesGcmDataProtector("module-6-test", Buffer.alloc(32, 17).toString("base64url"));
const service = new PlatformOperationsService(database, protector);
const adminService = new AdminApplicationService(database, protector);

let player: AuthenticatedPrincipal;
let partner: AuthenticatedPrincipal;
let otherPlayer: AuthenticatedPrincipal;
let authorId: string;
let admin: AuthenticatedPrincipal;
let trId: string;
let azId: string;

async function createProfile(email: string, role: "PLAYER" | "PARTNER", marketId: string) {
  const user = await database.user.create({ data: { email, displayName: email.split("@")[0], profile: { create: { productRole: role, marketId, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", accountStatus: "ACTIVE", ...(role === "PLAYER" ? { playerProfile: { create: { participationStatus: "ACTIVE" } } } : { partnerProfile: { create: { status: "ACTIVE", approvedAt: new Date() } } }) } } } });
  return { userId: user.id, sessionId: randomUUID(), roleKeys: [role.toLowerCase()], permissionKeys: [] } satisfies AuthenticatedPrincipal;
}

async function createForecast(input: { key: string; title: string; role: "PLAYER" | "PARTNER"; marketId?: string; userId?: string; status?: "PUBLISHED" | "ARCHIVED" }) {
  const forecast = await database.forecast.create({ data: { key: input.key, title: input.title, authorId } });
  await database.forecastVersion.create({ data: { forecastId: forecast.id, version: 1, language: "RU", status: input.status ?? "PUBLISHED", content: { summary: `${input.title}: кратко`, body: `${input.title}: полный материал`, context: ["Серверный контекст"] }, contentHash: "f".repeat(64), disclaimer: "Материал не гарантирует результат.", validFrom: new Date(Date.now() - 60_000), validUntil: new Date(Date.now() + 86_400_000), publishedAt: new Date(), accessRules: { create: { productRole: input.role, marketId: input.marketId ?? trId, userId: input.userId, ruleVersion: "forecast-test-v1" } } } });
  return forecast;
}

async function createPromocode(input: { key: string; role?: "PLAYER" | "PARTNER"; marketId?: string; validUntil?: Date }) {
  const partnerService = await database.partnerService.create({ data: { key: `service-${input.key}`, name: `Сервис ${input.key}`, status: "ACTIVE", markets: { create: { marketId: input.marketId ?? trId, status: "ACTIVE" } } } });
  const id = randomUUID(); const code = `VX-${input.key.toUpperCase()}`;
  const protectedCode = await protector.encrypt(new TextEncoder().encode(code), { classification: "restricted", purpose: "promocode", resourceType: "Promocode", resourceId: id });
  const promocode = await database.promocode.create({ data: { id, key: input.key, partnerServiceId: partnerService.id, marketId: input.marketId ?? trId, productRole: input.role ?? "PLAYER", codeProtected: protectedCode as never, codeFingerprint: promocodeFingerprint(code), instructions: "Используйте код в соответствии с опубликованными условиями.", validFrom: new Date(Date.now() - 60_000), validUntil: input.validUntil ?? new Date(Date.now() + 86_400_000), status: "PUBLISHED" } });
  return { promocode, code };
}

describe("Functional Integration Module 6", { concurrency: false }, () => {
  beforeEach(async () => {
    await database.$executeRawUnsafe('TRUNCATE TABLE "AuditEvent", "User", "Market" CASCADE');
    const tr = await database.market.create({ data: { code: "TR", name: "Турция", defaultLanguage: "TR", isActive: true } });
    const az = await database.market.create({ data: { code: "AZ", name: "Азербайджан", defaultLanguage: "AZ", isActive: true } });
    trId = tr.id; azId = az.id;
    authorId = (await database.user.create({ data: { email: "author-module6@test.invalid", displayName: "Редактор VX House" } })).id;
    admin = { userId: authorId, sessionId: randomUUID(), roleKeys: ["admin"], permissionKeys: ["content.read", "content.write", "content.publish"] };
    player = await createProfile("player-module6@test.invalid", "PLAYER", trId);
    otherPlayer = await createProfile("other-module6@test.invalid", "PLAYER", trId);
    partner = await createProfile("partner-module6@test.invalid", "PARTNER", trId);
  });

  after(async () => database.$disconnect());

  test("прогнозы фильтруются сервером по роли, рынку, пользователю и публикации", async () => {
    await createForecast({ key: "visible-player", title: "Прогноз игрока", role: "PLAYER" });
    await createForecast({ key: "partner-only", title: "Прогноз партнёра", role: "PARTNER" });
    await createForecast({ key: "az-only", title: "Прогноз Азербайджана", role: "PLAYER", marketId: azId });
    await createForecast({ key: "personal-other", title: "Персональный прогноз", role: "PLAYER", userId: otherPlayer.userId });
    await createForecast({ key: "archived", title: "Архивный прогноз", role: "PLAYER", status: "ARCHIVED" });
    assert.deepEqual((await service.listForecasts(player)).map((item) => item.key), ["visible-player"]);
    assert.deepEqual((await service.listForecasts(partner)).map((item) => item.key), ["partner-only"]);
  });

  test("административная публикация создаёт versioned Forecast и уведомляет аудиторию", async () => {
    const created = await adminService.create(admin, "content", { action: "CONTENT_DRAFT", content: { kind: "FORECAST", title: "Опубликованный прогноз", description: "Проверяемый аналитический материал", role: "PLAYER", market: "TR", nextStep: "Открыть материал", reason: "Подготовка редакционной версии" } }) as { id: string };
    await adminService.execute(admin, "content", created.id, { action: "CONTENT_PUBLISH", reason: "Материал прошёл редакционную проверку" });
    assert.equal((await service.listForecasts(player))[0]?.title, "Опубликованный прогноз");
    assert.equal(await database.notification.count({ where: { userId: player.userId, type: "forecast.published", relatedId: created.id } }), 1);
    const versions = await database.adminContentRevision.findMany({ where: { entityType: "FORECAST", entityId: created.id }, orderBy: { version: "asc" } });
    assert.deepEqual(versions.map((item) => item.status), ["DRAFT", "PUBLISHED"]);
  });

  test("административная публикация Promocode хранит код защищённо", async () => {
    const partnerService = await database.partnerService.create({ data: { key: "admin-promo-service", name: "Сервис публикации", status: "ACTIVE", markets: { create: { marketId: trId, status: "ACTIVE" } } } });
    const created = await adminService.create(admin, "content", { action: "CONTENT_DRAFT", content: { kind: "PROMOCODE", title: "Промокод сервиса", description: "Условия использования опубликованного кода", role: "PLAYER", market: "TR", nextStep: "Активировать код", partnerServiceId: partnerService.id, code: "VX-SECURE-2026", reason: "Подготовка защищённой публикации" } }) as { id: string };
    await adminService.execute(admin, "content", created.id, { action: "CONTENT_PUBLISH", reason: "Условия и срок проверены" });
    const stored = await database.promocode.findUniqueOrThrow({ where: { id: created.id } });
    assert.doesNotMatch(JSON.stringify(stored.codeProtected), /VX-SECURE-2026/);
    assert.equal((await service.listPromocodes(player))[0]?.availability, "AVAILABLE");
    assert.equal(await database.notification.count({ where: { userId: player.userId, type: "promocode.published", relatedId: created.id } }), 1);
  });

  test("каталог промокодов учитывает роль и рынок и не раскрывает код до активации", async () => {
    const { promocode } = await createPromocode({ key: "catalog" });
    await createPromocode({ key: "partner", role: "PARTNER" });
    await createPromocode({ key: "az", marketId: azId });
    const list = await service.listPromocodes(player);
    assert.equal(list.length, 1); assert.equal(list[0]?.id, promocode.id); assert.equal(list[0]?.code, null); assert.equal(list[0]?.availability, "AVAILABLE");
  });

  test("активация промокода идемпотентна, принадлежит пользователю и создаёт уведомление", async () => {
    const { promocode, code } = await createPromocode({ key: "activate" }); const requestKey = `promo-${randomUUID()}`;
    const first = await service.activatePromocode(player, promocode.id, requestKey); const replay = await service.activatePromocode(player, promocode.id, requestKey);
    assert.equal(first.code, code); assert.equal(replay.activation?.id, first.activation?.id);
    assert.equal(await database.promocodeActivation.count({ where: { promocodeId: promocode.id, userId: player.userId } }), 1);
    assert.equal(await database.notification.count({ where: { userId: player.userId, type: "promocode.activated" } }), 1);
    assert.equal((await service.listPromocodes(otherPlayer))[0]?.code, null);
  });

  test("чужая или истёкшая активация запрещена и транзакция откатывается", async () => {
    const { promocode } = await createPromocode({ key: "expired", validUntil: new Date(Date.now() - 1000) });
    await assert.rejects(service.activatePromocode(player, promocode.id, `promo-${randomUUID()}`), (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT");
    assert.equal(await database.promocodeActivation.count({ where: { promocodeId: promocode.id } }), 0);
    const partnerPromo = await createPromocode({ key: "wrong-role", role: "PARTNER" });
    await assert.rejects(service.activatePromocode(player, partnerPromo.promocode.id, `promo-${randomUUID()}`), (error: unknown) => error instanceof ApplicationError && error.code === "NOT_FOUND");
  });

  test("история активации append-only", async () => {
    const { promocode } = await createPromocode({ key: "history" }); await service.activatePromocode(player, promocode.id, `promo-${randomUUID()}`);
    const event = await database.promocodeActivationHistory.findFirstOrThrow();
    await assert.rejects(database.promocodeActivationHistory.update({ where: { id: event.id }, data: { reason: "Скрытая замена" } }));
    await assert.rejects(database.promocodeActivationHistory.delete({ where: { id: event.id } }));
  });

  test("глобальный поиск возвращает только доступные и принадлежащие пользователю сущности", async () => {
    await createForecast({ key: "search-forecast", title: "Аналитика рынка", role: "PLAYER" });
    await database.supportCategory.create({ data: { key: "general-module6", title: "Общее", description: "Общие вопросы", roles: ["PLAYER"], isActive: true } });
    await database.supportConversation.create({ data: { userId: player.userId, category: "general-module6", subject: "Аналитика по обращению", context: {}, status: "CREATED" } });
    await database.supportConversation.create({ data: { userId: otherPlayer.userId, category: "general-module6", subject: "Аналитика чужого профиля", context: {}, status: "CREATED" } });
    const results = await service.search(player, "Аналитика");
    assert.ok(results.some((item) => item.type === "FORECAST")); assert.equal(results.filter((item) => item.type === "SUPPORT").length, 1);
  });

  test("Dashboard summary и activity вычисляются из серверных записей", async () => {
    const { promocode } = await createPromocode({ key: "summary" }); await service.activatePromocode(player, promocode.id, `promo-${randomUUID()}`);
    await createForecast({ key: "summary-forecast", title: "Прогноз обзора", role: "PLAYER" });
    const summary = await service.workspaceSummary(player); const activity = await service.activity(player);
    assert.equal(summary.availableForecasts, 1); assert.equal(summary.availablePromocodes, 1); assert.equal(summary.unreadNotifications, 1);
    assert.ok(activity.some((item) => item.category === "PROMOCODE")); assert.ok(activity.some((item) => item.category === "NOTIFICATION"));
  });
});
