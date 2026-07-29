import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { ApplicationError } from "../lib/application/index.ts";
import type { AuthenticatedPrincipal } from "../lib/auth/index.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { OpportunityTaskApplicationService } from "../lib/services/index.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;
const service = new OpportunityTaskApplicationService(database);

type Fixture = Awaited<ReturnType<typeof seedFixture>>;
let fixture: Fixture;

async function createProfile(role: "PLAYER" | "PARTNER", marketId: string, suffix: string = randomUUID()) {
  const user = await database.user.create({ data: { email: `${suffix}@test.invalid`, displayName: "Тестовый пользователь", profile: { create: { productRole: role, marketId, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", accountStatus: "ACTIVE", ...(role === "PLAYER" ? { playerProfile: { create: { participationStatus: "ACTIVE" } } } : { partnerProfile: { create: { status: "ACTIVE" } } }) } } } });
  return { user, principal: { userId: user.id, sessionId: randomUUID(), roleKeys: ["authenticated"], permissionKeys: [] } satisfies AuthenticatedPrincipal };
}

async function seedFixture() {
  const tr = await database.market.create({ data: { code: "TR", name: "Турция", defaultLanguage: "TR", isActive: true } });
  const az = await database.market.create({ data: { code: "AZ", name: "Азербайджан", defaultLanguage: "AZ", isActive: true } });
  const player = await createProfile("PLAYER", tr.id, "player");
  const other = await createProfile("PLAYER", tr.id, "other");
  const partner = await createProfile("PARTNER", tr.id, "partner");
  const azPlayer = await createProfile("PLAYER", az.id, "az-player");
  const author = await database.user.create({ data: { email: "author@test.invalid", displayName: "Автор" } });
  const instruction = await database.instruction.create({ data: { key: "instruction-main", title: "Базовая инструкция" } });
  const instructionV1 = await database.instructionVersion.create({ data: { instructionId: instruction.id, version: 1, status: "PUBLISHED", title: "Инструкция по выполнению", summary: "Проверенная последовательность действий.", language: "RU", contentHash: "a".repeat(64), createdById: author.id, publishedAt: new Date("2026-01-01"), audiences: { create: { productRole: "PLAYER", marketId: tr.id } }, sections: { create: { position: 1, title: "Подготовка", body: "Проверьте условия до начала." } }, steps: { create: [{ position: 1, title: "Изучите условия", body: "Убедитесь, что требования понятны.", isRequired: true }, { position: 2, title: "Подготовьте результат", body: "Укажите комментарий или ссылку.", isRequired: true }] } } });
  const opportunity = await database.opportunity.create({ data: { key: "player-tr-task", type: "TASK", title: "Проверка нового сценария", description: "Опубликованная возможность для игрока из Турции.", status: "PUBLISHED", nextStep: "Изучить условия и принять задание", publishedAt: new Date("2026-01-01"), audiences: { create: { productRole: "PLAYER", marketId: tr.id } } } });
  const definition = await database.taskDefinition.create({ data: { key: "player-tr-task-definition", opportunityId: opportunity.id } });
  const version = await database.taskVersion.create({ data: { taskDefinitionId: definition.id, version: 1, status: "PUBLISHED", title: "Выполните проверку", summary: "Следуйте зафиксированной инструкции.", requirements: ["Активный профиль"], limitations: ["Одна активная попытка"], resultRequirements: ["Комментарий или ссылка"], instructionVersionId: instructionV1.id, resubmissionPolicy: "Повторная отправка после запроса уточнения", termsHash: "b".repeat(64), publishedAt: new Date("2026-01-01"), audiences: { create: { productRole: "PLAYER", marketId: tr.id } } } });
  const archived = await database.opportunity.create({ data: { key: "archived", type: "TASK", title: "Архивная возможность", description: "Не показывается", status: "ARCHIVED", nextStep: "Недоступно", archivedAt: new Date(), audiences: { create: { productRole: "PLAYER", marketId: tr.id } } } });
  const partnerOnly = await database.opportunity.create({ data: { key: "partner-only", type: "TASK", title: "Партнёрская возможность", description: "Только партнёру", status: "PUBLISHED", nextStep: "Открыть", publishedAt: new Date("2026-01-01"), audiences: { create: { productRole: "PARTNER", marketId: tr.id } } } });
  return { tr, az, player, other, partner, azPlayer, author, instruction, instructionV1, opportunity, definition, version, archived, partnerOnly };
}

beforeEach(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "AuditEvent", "User", "Market", "Instruction", "Opportunity" CASCADE');
  fixture = await seedFixture();
});
after(async () => database.$disconnect());

test("каталог возвращает только опубликованные возможности роли и рынка", async () => {
  const items = await service.list(fixture.player.principal);
  assert.deepEqual(items.map((item) => item.id), [fixture.opportunity.id]);
  assert.equal(items[0]!.availability, "AVAILABLE");
});

test("поиск и фильтрация выполняются сервером", async () => {
  assert.equal((await service.list(fixture.player.principal, { search: "нового" })).length, 1);
  assert.equal((await service.list(fixture.player.principal, { search: "отсутствует" })).length, 0);
  assert.equal((await service.list(fixture.player.principal, { type: "INSTRUCTION" })).length, 0);
});

test("eligibility делает возможность недоступной и запрещает принятие", async () => {
  await database.opportunityEligibility.create({ data: { opportunityId: fixture.opportunity.id, userId: fixture.player.user.id, status: "INELIGIBLE", reasonCode: "PROFILE_RULE", explanation: "Профиль не соответствует условиям.", policyVersion: "test-1", idempotencyKey: randomUUID() } });
  const [item] = await service.list(fixture.player.principal);
  assert.equal(item!.availability, "UNAVAILABLE");
  await assert.rejects(service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`), (error: unknown) => error instanceof ApplicationError && error.code === "FORBIDDEN");
  assert.equal(await database.userTask.count(), 0);
});

test("архив, другая роль и другой рынок скрыты", async () => {
  await assert.rejects(service.getOpportunity(fixture.player.principal, fixture.archived.id), ApplicationError);
  await assert.rejects(service.getOpportunity(fixture.player.principal, fixture.partnerOnly.id), ApplicationError);
  assert.equal((await service.list(fixture.azPlayer.principal)).length, 0);
});

test("принятие создаёт owned assignment и фиксирует версии задания и инструкции", async () => {
  const task = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  assert.equal(task.status, "ACCEPTED");
  assert.equal(task.task.id, fixture.version.id);
  assert.equal(task.task.instruction?.id, fixture.instructionV1.id);
  const instructionV2 = await database.instructionVersion.create({ data: { instructionId: fixture.instruction.id, version: 2, status: "PUBLISHED", title: "Новая инструкция", summary: "Новая версия", language: "RU", contentHash: "c".repeat(64), createdById: fixture.author.id, publishedAt: new Date(), audiences: { create: { productRole: "PLAYER", marketId: fixture.tr.id } } } });
  await database.taskVersion.create({ data: { taskDefinitionId: fixture.definition.id, version: 2, status: "PUBLISHED", title: "Новая версия задания", summary: "Новые условия", requirements: [], limitations: [], resultRequirements: [], instructionVersionId: instructionV2.id, resubmissionPolicy: "По решению", termsHash: "d".repeat(64), publishedAt: new Date(), audiences: { create: { productRole: "PLAYER", marketId: fixture.tr.id } } } });
  const pinned = await service.getTask(fixture.player.principal, task.id);
  assert.equal(pinned.task.version, 1);
  assert.equal(pinned.task.instruction?.version, 1);
});

test("state machine проводит accepted → in progress → awaiting submission → under review", async () => {
  let task = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  task = await service.start(fixture.player.principal, task.id);
  assert.equal(task.status, "IN_PROGRESS");
  task = await service.saveDraft(fixture.player.principal, task.id, { comment: "Черновик результата" }, `draft-${randomUUID()}`);
  assert.equal(task.status, "AWAITING_SUBMISSION");
  task = await service.submit(fixture.player.principal, task.id, { comment: "Готовый результат" }, `submit-${randomUUID()}`);
  assert.equal(task.status, "UNDER_REVIEW");
  assert.deepEqual(task.history.map((item) => item.toStatus), ["ACCEPTED", "IN_PROGRESS", "AWAITING_SUBMISSION", "SUBMITTED", "UNDER_REVIEW"]);
});

test("черновики и повторная отправка сохраняются append-only версиями", async () => {
  let task = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  task = await service.start(fixture.player.principal, task.id);
  task = await service.saveDraft(fixture.player.principal, task.id, { comment: "Версия один" }, `draft-${randomUUID()}`);
  task = await service.submit(fixture.player.principal, task.id, { comment: "Версия два" }, `submit-${randomUUID()}`);
  await database.userTask.update({ where: { id: task.id }, data: { status: "RESUBMISSION_REQUIRED" } });
  task = await service.saveDraft(fixture.player.principal, task.id, { comment: "Версия три" }, `draft-${randomUUID()}`);
  task = await service.submit(fixture.player.principal, task.id, { comment: "Версия четыре" }, `submit-${randomUUID()}`);
  assert.deepEqual(task.submissions.map((item) => item.version), [1, 2, 3, 4]);
  await assert.rejects(database.submissionVersion.update({ where: { id: task.submissions[0]!.id }, data: { payload: { changed: true } } }));
});

test("ownership не позволяет открыть или изменить чужое задание", async () => {
  const task = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  await assert.rejects(service.getTask(fixture.other.principal, task.id), (error: unknown) => error instanceof ApplicationError && error.code === "NOT_FOUND");
  await assert.rejects(service.start(fixture.other.principal, task.id), ApplicationError);
});

test("недопустимый переход отклоняется без частичной истории", async () => {
  const task = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  const before = await database.userTaskStatusHistory.count({ where: { userTaskId: task.id } });
  await assert.rejects(service.submit(fixture.player.principal, task.id, { comment: "Нельзя отправить" }, `submit-${randomUUID()}`), (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT");
  assert.equal(await database.userTaskStatusHistory.count({ where: { userTaskId: task.id } }), before);
  assert.equal((await database.userTask.findUniqueOrThrow({ where: { id: task.id } })).status, "ACCEPTED");
});

test("идемпотентность принятия не создаёт вторую попытку", async () => {
  const key = `accept-${randomUUID()}`;
  const first = await service.accept(fixture.player.principal, fixture.opportunity.id, key);
  const replay = await service.accept(fixture.player.principal, fixture.opportunity.id, key);
  assert.equal(replay.id, first.id);
  assert.equal(await database.userTask.count({ where: { userId: fixture.player.user.id } }), 1);
});

test("короткое действие «выполнено» создаёт отправку и ставит задание на проверку", async () => {
  const accepted = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  const key = `complete-${randomUUID()}`;
  const completed = await service.completeTask(fixture.player.principal, accepted.id, key);
  assert.equal(completed.status, "UNDER_REVIEW");
  assert.equal(completed.submissions.length, 1);
  assert.deepEqual(completed.history.map((item) => item.toStatus), ["ACCEPTED", "IN_PROGRESS", "AWAITING_SUBMISSION", "SUBMITTED", "UNDER_REVIEW"]);
  const replay = await service.completeTask(fixture.player.principal, accepted.id, key);
  assert.equal(replay.id, completed.id);
  assert.equal(replay.submissions.length, 1);
});

test("следующее последовательное задание открывается только после подтверждения предыдущего", async () => {
  await database.taskDefinition.update({ where: { id: fixture.definition.id }, data: { sequenceOrder: 1 } });
  const opportunity = await database.opportunity.create({ data: { key: "player-tr-task-second", type: "TASK", title: "Второе задание", description: "Открывается после первого.", status: "PUBLISHED", nextStep: "Изучить условия", publishedAt: new Date("2026-01-01"), audiences: { create: { productRole: "PLAYER", marketId: fixture.tr.id } } } });
  const definition = await database.taskDefinition.create({ data: { key: "player-tr-task-definition-second", opportunityId: opportunity.id, sequenceOrder: 2 } });
  await database.taskVersion.create({ data: { taskDefinitionId: definition.id, version: 1, status: "PUBLISHED", title: "Второе задание", summary: "Продолжение маршрута.", requirements: [], limitations: [], resultRequirements: [], instructionVersionId: fixture.instructionV1.id, resubmissionPolicy: "По решению менеджера", termsHash: "e".repeat(64), publishedAt: new Date("2026-01-01"), audiences: { create: { productRole: "PLAYER", marketId: fixture.tr.id } } } });

  let items = await service.list(fixture.player.principal);
  assert.equal(items.find((item) => item.id === fixture.opportunity.id)?.availability, "AVAILABLE");
  assert.equal(items.find((item) => item.id === opportunity.id)?.availability, "UNAVAILABLE");

  const first = await service.accept(fixture.player.principal, fixture.opportunity.id, `accept-${randomUUID()}`);
  await database.userTask.update({ where: { id: first.id }, data: { status: "CONFIRMED", completedAt: new Date() } });

  items = await service.list(fixture.player.principal);
  assert.equal(items.find((item) => item.id === opportunity.id)?.availability, "AVAILABLE");
});
