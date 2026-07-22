import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { ApplicationError } from "../lib/application/index.ts";
import type { AuthenticatedPrincipal } from "../lib/auth/index.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { EconomyRewardApplicationService } from "../lib/services/index.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;
const service = new EconomyRewardApplicationService(database);
let player: { userId: string; principal: AuthenticatedPrincipal };
let other: { userId: string; principal: AuthenticatedPrincipal };
let writer: AuthenticatedPrincipal;

async function createPlayer(marketId: string, email: string) {
  const user = await database.user.create({ data: { email, displayName: "Тестовый пользователь", profile: { create: { productRole: "PLAYER", marketId, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", accountStatus: "ACTIVE", playerProfile: { create: { participationStatus: "ACTIVE" } } } } } });
  return { userId: user.id, principal: { userId: user.id, sessionId: randomUUID(), roleKeys: ["authenticated"], permissionKeys: [] } satisfies AuthenticatedPrincipal };
}

beforeEach(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "AuditEvent", "User", "Market", "EconomyPolicy", "RankDefinition", "RewardType" CASCADE');
  const market = await database.market.create({ data: { code: "TR", name: "Турция", defaultLanguage: "TR", isActive: true } });
  player = await createPlayer(market.id, "economy-player@test.invalid"); other = await createPlayer(market.id, "economy-other@test.invalid");
  writer = { userId: player.userId, sessionId: randomUUID(), roleKeys: ["system"], permissionKeys: ["economy.write"] };
  await database.economyPolicy.create({ data: { scopeKey: "player-tr", version: 1, productRole: "PLAYER", marketId: market.id, status: "PUBLISHED", startingTrustScore: 50, pointsRules: { confirmed_action: { delta: 40 }, correction: { delta: -10 } }, trustRules: { confirmed_action: { delta: 10, appealable: false }, violation: { delta: -20, appealable: true } }, trustZones: [{ min: 0, max: 49, label: "Требует внимания" }, { min: 50, max: 79, label: "Стабильный" }, { min: 80, max: 100, label: "Высокий" }] } });
  await database.rankDefinition.createMany({ data: [
    { code: "EXPLORER", scopeKey: "player-tr", version: 1, productRole: "PLAYER", marketId: market.id, criteria: { minPoints: 0, minTrustScore: 0 }, benefits: [], status: "PUBLISHED" },
    { code: "NAVIGATOR", scopeKey: "player-tr", version: 1, productRole: "PLAYER", marketId: market.id, criteria: { minPoints: 40, minTrustScore: 60 }, benefits: ["Новые возможности"], status: "PUBLISHED" },
    { code: "ATLAS", scopeKey: "player-tr", version: 1, productRole: "PLAYER", marketId: market.id, criteria: { minPoints: 100, minTrustScore: 70 }, benefits: [], status: "PUBLISHED" },
  ] });
  await database.rewardType.create({ data: { key: "personal-condition", name: "Персональные условия", valueKind: "NON_MONETARY", description: "Тестовый тип", status: "PUBLISHED" } });
});
after(async () => database.$disconnect());

test("ledger, Trust Score и ранг рассчитываются сервером и идемпотентно", async () => {
  const key = `economy-${randomUUID()}`;
  const first = await service.applyRules(writer, { userId: player.userId, pointsRuleKey: "confirmed_action", trustRuleKey: "confirmed_action", sourceType: "TEST", sourceId: "event-1", reason: "Подтверждённое тестовое событие" }, key);
  const replay = await service.applyRules(writer, { userId: player.userId, pointsRuleKey: "confirmed_action", trustRuleKey: "confirmed_action", sourceType: "TEST", sourceId: "event-1", reason: "Подтверждённое тестовое событие" }, key);
  assert.equal(first.points.confirmedBalance, 40); assert.equal(first.trust.score, 60); assert.equal(first.rank.current?.code, "NAVIGATOR");
  assert.equal(replay.points.confirmedBalance, 40); assert.equal(await database.vXPointsLedgerEntry.count({ where: { userId: player.userId } }), 1); assert.equal(await database.trustScoreEvent.count({ where: { userId: player.userId } }), 1); assert.equal(await database.userRank.count({ where: { userId: player.userId } }), 1);
});

test("ошибка второго правила откатывает весь экономический command", async () => {
  await assert.rejects(service.applyRules(writer, { userId: player.userId, pointsRuleKey: "confirmed_action", trustRuleKey: "missing", sourceType: "TEST", sourceId: "rollback", reason: "Проверка rollback" }, `rollback-${randomUUID()}`), ApplicationError);
  assert.equal(await database.vXPointsLedgerEntry.count({ where: { userId: player.userId } }), 0);
  assert.equal(await database.trustScoreEvent.count({ where: { userId: player.userId } }), 0);
});

test("корректировка ledger создаёт отдельную append-only запись", async () => {
  await service.applyRules(writer, { userId: player.userId, pointsRuleKey: "confirmed_action", sourceType: "TEST", sourceId: "grant", reason: "Начисление" }, `grant-${randomUUID()}`);
  const original = await database.vXPointsLedgerEntry.findFirstOrThrow({ where: { userId: player.userId, delta: 40 } });
  await service.reversePoints(writer, player.userId, original.id, "Отмена основания", `reverse-${randomUUID()}`);
  assert.equal((await service.getSnapshot(player.principal)).points.confirmedBalance, 0);
  assert.equal(await database.vXPointsLedgerEntry.count({ where: { userId: player.userId } }), 2);
  await assert.rejects(database.vXPointsLedgerEntry.update({ where: { id: original.id }, data: { delta: 1 } }));
});

test("Trust history сохраняет причину, зоны и ограничение диапазона", async () => {
  await service.applyRules(writer, { userId: player.userId, trustRuleKey: "violation", sourceType: "TEST", sourceId: "trust-1", reason: "Подтверждённое нарушение" }, `trust-${randomUUID()}`);
  const snapshot = await service.getSnapshot(player.principal); const history = await service.getHistory(player.principal);
  assert.equal(snapshot.trust.score, 30); assert.equal(snapshot.trust.zone, "Требует внимания");
  assert.ok(history.items.some((item) => item.kind === "TRUST" && item.reason === "Подтверждённое нарушение"));
});

test("Reward проходит серверный lifecycle и claim идемпотентен", async () => {
  let reward = await service.issueReward(writer, { userId: player.userId, typeKey: "personal-condition", title: "Тестовое преимущество", description: "Создано только тестом", nonMonetaryValue: { access: "test" } }, `issue-${randomUUID()}`);
  reward = await service.transitionReward(writer, reward.id, "AWAITING_CONFIRMATION", "Ожидает проверки", `status-${randomUUID()}`);
  reward = await service.transitionReward(writer, reward.id, "CONFIRMED", "Основание подтверждено", `status-${randomUUID()}`);
  reward = await service.transitionReward(writer, reward.id, "AVAILABLE", "Подготовлено", `status-${randomUUID()}`);
  const key = `claim-${randomUUID()}`; const claimed = await service.claimReward(player.principal, reward.id, key); const replay = await service.claimReward(player.principal, reward.id, key);
  assert.equal(claimed.status, "PROVIDED"); assert.equal(replay.status, "PROVIDED"); assert.deepEqual(claimed.history.map((item) => item.toStatus), ["EXPECTED", "AWAITING_CONFIRMATION", "CONFIRMED", "AVAILABLE", "PROVIDED"]);
});

test("ownership и availability защищаются сервером", async () => {
  const reward = await service.issueReward(writer, { userId: player.userId, typeKey: "personal-condition", title: "Чужой Reward", description: "Тест", nonMonetaryValue: { access: "test" } }, `issue-${randomUUID()}`);
  await assert.rejects(service.getReward(other.principal, reward.id), (error: unknown) => error instanceof ApplicationError && error.code === "NOT_FOUND");
  await assert.rejects(service.claimReward(player.principal, reward.id, `claim-${randomUUID()}`), (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT");
});

test("общая история объединяет Points, Trust, Rank и Reward", async () => {
  await service.applyRules(writer, { userId: player.userId, pointsRuleKey: "confirmed_action", trustRuleKey: "confirmed_action", sourceType: "TEST", sourceId: "combined", reason: "Событие" }, `combined-${randomUUID()}`);
  await service.issueReward(writer, { userId: player.userId, typeKey: "personal-condition", title: "Reward", description: "Тест", nonMonetaryValue: { access: "test" } }, `issue-${randomUUID()}`);
  const kinds = new Set((await service.getHistory(player.principal)).items.map((item) => item.kind));
  assert.deepEqual(kinds, new Set(["POINTS", "TRUST", "RANK", "REWARD"]));
});
