import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";

import { PrismaClient } from "../lib/db/generated-node/client.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL обязателен");
const parsed = new URL(url);
if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
  throw new Error("Демо-аккаунт разрешён только для локальной development-базы");
}

const database = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const demoPassword = "VXHouse-Demo-2026!";

function passwordHash(password: string) {
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, 600_000, 32, "sha256");
  return `$pbkdf2-sha256$i=600000$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

try {
  const market = await database.market.findUniqueOrThrow({ where: { code: "TR" } });
  const adminRole = await database.role.upsert({
    where: { key: "admin" },
    update: { name: "Администратор" },
    create: { key: "admin", name: "Администратор", description: "Доступ к административному пространству" },
  });
  const user = await database.user.upsert({
    where: { email: "demo.player@vxhouse.local" },
    update: { displayName: "Алексей", passwordHash: passwordHash(demoPassword), disabledAt: null, roles: { connect: { id: adminRole.id } } },
    create: { email: "demo.player@vxhouse.local", displayName: "Алексей", passwordHash: passwordHash(demoPassword), roles: { connect: { id: adminRole.id } } },
  });
  await database.$transaction(async (transaction) => {
    const existing = await transaction.userProfile.findUnique({ where: { userId: user.id } });
    if (existing && existing.productRole !== "PLAYER") throw new Error("Демо-аккаунт уже связан с другой ролью");
    const stored = existing
      ? await transaction.userProfile.update({ where: { id: existing.id }, data: { marketId: market.id, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", contactVerifiedAt: daysAgo(48), accountStatus: "ACTIVE" } })
      : await transaction.userProfile.create({ data: { userId: user.id, productRole: "PLAYER", marketId: market.id, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", contactVerifiedAt: daysAgo(48), accountStatus: "ACTIVE" } });
    await transaction.playerProfile.upsert({
      where: { userProfileId: stored.id },
      update: { participationStatus: "ACTIVE" },
      create: { userProfileId: stored.id, participationStatus: "ACTIVE" },
    });
    return stored;
  });
  await database.onboardingProgress.upsert({
    where: { userId: user.id },
    update: { status: "COMPLETED", ageConfirmedAt: daysAgo(48), profileReadyAt: daysAgo(48), completedAt: daysAgo(48) },
    create: { userId: user.id, status: "COMPLETED", ageConfirmedAt: daysAgo(48), profileReadyAt: daysAgo(48), completedAt: daysAgo(48) },
  });

  const consentVersions = await database.consentVersion.findMany({
    where: { marketId: market.id, language: "RU", consentDocument: { key: { in: ["terms", "privacy"] } } },
    orderBy: { version: "desc" },
    distinct: ["consentDocumentId"],
  });
  for (const consent of consentVersions) {
    const stored = await database.userConsent.findUnique({ where: { userId_consentVersionId: { userId: user.id, consentVersionId: consent.id } } });
    if (!stored) await database.userConsent.create({ data: { userId: user.id, consentVersionId: consent.id, accepted: true, source: "development-demo", recordedAt: daysAgo(48) } });
  }

  if (!await database.economyPolicy.findUnique({ where: { scopeKey_version: { scopeKey: "player-tr-demo", version: 1 } } })) {
    await database.economyPolicy.create({ data: {
      scopeKey: "player-tr-demo",
      version: 1,
      productRole: "PLAYER",
      marketId: market.id,
      status: "PUBLISHED",
      startingTrustScore: 50,
      pointsRules: { demo: { delta: 100, enabled: true } },
      trustRules: {},
      trustZones: [],
      effectiveFrom: daysAgo(90),
    } });
  }

  const rankDefinitions = [];
  for (const rank of [
    { code: "EXPLORER", points: 0, benefits: ["Стартовые задания", "Приветственные преимущества"] },
    { code: "NAVIGATOR", points: 1_000, benefits: ["Расширенный выбор заданий", "Персональные предложения"] },
    { code: "ATLAS", points: 2_500, benefits: ["Приоритетные возможности", "Дополнительные бонусы"] },
    { code: "PRIME", points: 5_000, benefits: ["Закрытые условия", "Приоритетное сопровождение"] },
    { code: "SIGNATURE", points: 10_000, benefits: ["Максимальный набор преимуществ"] },
  ] as const) {
    const existing = await database.rankDefinition.findUnique({ where: { code_scopeKey_version: { code: rank.code, scopeKey: "player-tr-demo", version: 1 } } });
    rankDefinitions.push(existing ?? await database.rankDefinition.create({ data: { code: rank.code, scopeKey: "player-tr-demo", version: 1, productRole: "PLAYER", marketId: market.id, criteria: { minPoints: rank.points }, benefits: rank.benefits, status: "PUBLISHED", effectiveFrom: daysAgo(90) } }));
  }
  if (!await database.userRank.findUnique({ where: { idempotencyKey: "demo-player-rank-bronze" } })) {
    await database.userRank.create({ data: { userId: user.id, rankDefinitionId: rankDefinitions[0].id, reason: "Начальный уровень участника", idempotencyKey: "demo-player-rank-bronze", assignedAt: daysAgo(48) } });
  }

  for (const entry of [
    { key: "welcome", delta: 100, reason: "Приветствие в VX House", date: daysAgo(28) },
    { key: "profile", delta: 150, reason: "Профиль полностью заполнен", date: daysAgo(20) },
    { key: "activity", delta: 250, reason: "Выполнено ознакомительное задание", date: daysAgo(12) },
    { key: "bonus", delta: 350, reason: "Персональный бонус участника", date: daysAgo(3) },
  ]) {
    const idempotencyKey = `demo-player-points-${entry.key}`;
    if (!await database.vXPointsLedgerEntry.findUnique({ where: { idempotencyKey } })) {
      await database.vXPointsLedgerEntry.create({ data: { userId: user.id, delta: entry.delta, status: "CONFIRMED", sourceType: "DEMO_EXPERIENCE", sourceId: entry.key, reason: entry.reason, ruleVersion: "demo:1", idempotencyKey, occurredAt: entry.date } });
    }
  }

  const registrationInstruction = await database.instruction.upsert({
    where: { key: "demo-partner-registration" },
    update: { title: "Регистрация у партнёра" },
    create: { key: "demo-partner-registration", title: "Регистрация у партнёра" },
  });
  const registrationInstructionVersion = await database.instructionVersion.findUnique({
    where: { instructionId_version_language: { instructionId: registrationInstruction.id, version: 1, language: "RU" } },
  }) ?? await database.instructionVersion.create({
    data: { instructionId: registrationInstruction.id, version: 1, status: "PUBLISHED", title: "Как зарегистрироваться у партнёра", summary: "Перейдите по персональной ссылке и используйте указанный промокод.", language: "RU", contentHash: hash("demo-partner-registration-v1"), createdById: user.id, publishedAt: daysAgo(35) },
  });
  await database.instructionAudience.upsert({ where: { instructionVersionId_productRole_marketId: { instructionVersionId: registrationInstructionVersion.id, productRole: "PLAYER", marketId: market.id } }, update: {}, create: { instructionVersionId: registrationInstructionVersion.id, productRole: "PLAYER", marketId: market.id } });
  if (!await database.instructionSection.findUnique({ where: { instructionVersionId_position: { instructionVersionId: registrationInstructionVersion.id, position: 1 } } })) {
    await database.instructionSection.create({ data: { instructionVersionId: registrationInstructionVersion.id, position: 1, title: "Ваши данные", body: "Персональная ссылка: https://example.com/vx-demo · промокод: VXSTART" } });
  }
  await database.instructionStep.upsert({ where: { instructionVersionId_position: { instructionVersionId: registrationInstructionVersion.id, position: 1 } }, update: { title: "Откройте персональную ссылку", body: "Создайте аккаунт партнёра и укажите промокод VXSTART." }, create: { instructionVersionId: registrationInstructionVersion.id, position: 1, title: "Откройте персональную ссылку", body: "Создайте аккаунт партнёра и укажите промокод VXSTART.", isRequired: true } });
  const registrationOpportunity = await database.opportunity.upsert({
    where: { key: "demo-partner-registration" },
    update: { title: "Зарегистрироваться у партнёра", description: "Первый шаг персонального маршрута.", status: "PUBLISHED", instructionId: registrationInstruction.id, nextStep: "Откройте инструкцию.", publishedAt: daysAgo(35), archivedAt: null },
    create: { key: "demo-partner-registration", type: "TASK", title: "Зарегистрироваться у партнёра", description: "Первый шаг персонального маршрута.", status: "PUBLISHED", instructionId: registrationInstruction.id, nextStep: "Откройте инструкцию.", publishedAt: daysAgo(35) },
  });
  await database.opportunityAudience.upsert({ where: { opportunityId_productRole_marketId: { opportunityId: registrationOpportunity.id, productRole: "PLAYER", marketId: market.id } }, update: {}, create: { opportunityId: registrationOpportunity.id, productRole: "PLAYER", marketId: market.id } });
  const registrationTask = await database.taskDefinition.upsert({ where: { key: "demo-partner-registration" }, update: { opportunityId: registrationOpportunity.id, sequenceOrder: 1 }, create: { key: "demo-partner-registration", opportunityId: registrationOpportunity.id, sequenceOrder: 1 } });
  const registrationTaskVersion = await database.taskVersion.findUnique({ where: { taskDefinitionId_version: { taskDefinitionId: registrationTask.id, version: 1 } } }) ?? await database.taskVersion.create({ data: { taskDefinitionId: registrationTask.id, version: 1, status: "PUBLISHED", title: "Зарегистрироваться у партнёра", summary: "Перейдите по персональной ссылке и завершите регистрацию.", requirements: ["Использовать персональную ссылку"], limitations: ["Одно выполнение"], resultRequirements: [], possibleRewardDescription: "Открывает следующее задание", instructionVersionId: registrationInstructionVersion.id, resubmissionPolicy: "Повторная отправка доступна после комментария менеджера.", termsHash: hash("demo-partner-registration-terms-v1"), publishedAt: daysAgo(35) } });
  await database.taskVersionAudience.upsert({ where: { taskVersionId_productRole_marketId: { taskVersionId: registrationTaskVersion.id, productRole: "PLAYER", marketId: market.id } }, update: {}, create: { taskVersionId: registrationTaskVersion.id, productRole: "PLAYER", marketId: market.id } });
  const completedRegistration = await database.userTask.upsert({ where: { assignmentKey: "demo-player-partner-registration" }, update: { status: "CONFIRMED", completedAt: daysAgo(6) }, create: { userId: user.id, taskDefinitionId: registrationTask.id, taskVersionId: registrationTaskVersion.id, status: "CONFIRMED", assignmentKey: "demo-player-partner-registration", acceptedAt: daysAgo(8), startedAt: daysAgo(8), completedAt: daysAgo(6) } });
  await database.userTaskStatusHistory.upsert({ where: { id: "10000000-0000-4000-8000-000000000091" }, update: {}, create: { id: "10000000-0000-4000-8000-000000000091", userTaskId: completedRegistration.id, fromStatus: "UNDER_REVIEW", toStatus: "CONFIRMED", reason: "Менеджер подтвердил выполнение", occurredAt: daysAgo(6) } });

  const instruction = await database.instruction.upsert({
    where: { key: "demo-first-deposit" },
    update: { title: "Первый депозит" },
    create: { key: "demo-first-deposit", title: "Первый депозит" },
  });
  const instructionVersion = await database.instructionVersion.findUnique({
    where: { instructionId_version_language: { instructionId: instruction.id, version: 1, language: "RU" } },
  }) ?? await database.instructionVersion.create({
    data: { instructionId: instruction.id, version: 1, status: "PUBLISHED", title: "Как выполнить первый депозит", summary: "Короткая инструкция по выполнению задания.", language: "RU", contentHash: hash("demo-first-deposit-v1"), createdById: user.id, publishedAt: daysAgo(30) },
  });
  await database.instructionAudience.upsert({
    where: { instructionVersionId_productRole_marketId: { instructionVersionId: instructionVersion.id, productRole: "PLAYER", marketId: market.id } },
    update: {},
    create: { instructionVersionId: instructionVersion.id, productRole: "PLAYER", marketId: market.id },
  });
  if (!await database.instructionSection.findUnique({ where: { instructionVersionId_position: { instructionVersionId: instructionVersion.id, position: 1 } } })) {
    await database.instructionSection.create({ data: { instructionVersionId: instructionVersion.id, position: 1, title: "Условия", body: "Минимальная сумма первого депозита — 20 $." } });
  }
  await database.instructionStep.upsert({
    where: { instructionVersionId_position: { instructionVersionId: instructionVersion.id, position: 1 } },
    update: { title: "Внесите депозит", body: "Пополните баланс на сумму от 20 $ и сохраните подтверждение." },
    create: { instructionVersionId: instructionVersion.id, position: 1, title: "Внесите депозит", body: "Пополните баланс на сумму от 20 $ и сохраните подтверждение.", isRequired: true },
  });
  const opportunity = await database.opportunity.findUnique({ where: { key: "demo-first-deposit" } })
    ?? await database.opportunity.create({ data: { key: "demo-first-deposit", type: "TASK", title: "Выполнить первый депозит", description: "Внесите первый депозит от 20 $. После подтверждения получите награды.", status: "PUBLISHED", instructionId: instruction.id, nextStep: "Откройте подробности и ознакомьтесь с условиями.", publishedAt: daysAgo(30) } });
  await database.opportunityAudience.upsert({
    where: { opportunityId_productRole_marketId: { opportunityId: opportunity.id, productRole: "PLAYER", marketId: market.id } },
    update: {},
    create: { opportunityId: opportunity.id, productRole: "PLAYER", marketId: market.id },
  });
  const taskDefinition = await database.taskDefinition.upsert({
    where: { key: "demo-first-deposit" },
    update: { opportunityId: opportunity.id, sequenceOrder: 2 },
    create: { key: "demo-first-deposit", opportunityId: opportunity.id, sequenceOrder: 2 },
  });
  const taskVersion = await database.taskVersion.findUnique({
    where: { taskDefinitionId_version: { taskDefinitionId: taskDefinition.id, version: 1 } },
  }) ?? await database.taskVersion.create({
    data: {
      taskDefinitionId: taskDefinition.id,
      version: 1,
      status: "PUBLISHED",
      title: "Выполнить первый депозит",
      summary: "Внесите первый депозит от 20 $. После подтверждения автоматически получите награды.",
      requirements: ["Первый депозит от 20 $"],
      limitations: ["Одно выполнение на аккаунт"],
      resultRequirements: ["Подтверждение депозита"],
      pointsRuleKey: "demo",
      possibleRewardDescription: "+150 VX Points · статус Bronze · приветственный бонус",
      instructionVersionId: instructionVersion.id,
      reviewWindowMinutes: 1_440,
      availableFrom: daysAgo(30),
      availableUntil: new Date("2027-12-31T23:59:59.000Z"),
      completionDeadline: new Date("2027-12-31T23:59:59.000Z"),
      resubmissionPolicy: "Повторная отправка доступна после запроса уточнения.",
      termsHash: hash("demo-first-deposit-terms-v1"),
      publishedAt: daysAgo(30),
    },
  });
  await database.taskVersionAudience.upsert({
    where: { taskVersionId_productRole_marketId: { taskVersionId: taskVersion.id, productRole: "PLAYER", marketId: market.id } },
    update: {},
    create: { taskVersionId: taskVersion.id, productRole: "PLAYER", marketId: market.id },
  });
  const userTask = await database.userTask.upsert({
    where: { assignmentKey: "demo-player-first-deposit" },
    update: { userId: user.id, taskDefinitionId: taskDefinition.id, taskVersionId: taskVersion.id, status: "IN_PROGRESS", acceptedAt: daysAgo(2), startedAt: daysAgo(2) },
    create: { userId: user.id, taskDefinitionId: taskDefinition.id, taskVersionId: taskVersion.id, status: "IN_PROGRESS", assignmentKey: "demo-player-first-deposit", acceptedAt: daysAgo(2), startedAt: daysAgo(2) },
  });
  for (const event of [
    { id: "10000000-0000-4000-8000-000000000101", from: null, to: "AVAILABLE", reason: "Задание стало доступно", date: daysAgo(4) },
    { id: "10000000-0000-4000-8000-000000000102", from: "AVAILABLE", to: "ACCEPTED", reason: "Задание принято", date: daysAgo(2) },
    { id: "10000000-0000-4000-8000-000000000103", from: "ACCEPTED", to: "IN_PROGRESS", reason: "Выполнение начато", date: daysAgo(2) },
  ] as const) {
    if (!await database.userTaskStatusHistory.findUnique({ where: { id: event.id } })) {
      await database.userTaskStatusHistory.create({ data: { id: event.id, userTaskId: userTask.id, fromStatus: event.from, toStatus: event.to, reason: event.reason, occurredAt: event.date } });
    }
  }

  const rewardType = await database.rewardType.findUnique({ where: { key: "demo-benefit" } })
    ?? await database.rewardType.create({ data: { key: "demo-benefit", name: "Преимущество участника", valueKind: "NON_MONETARY", description: "Персональное преимущество VX House", status: "PUBLISHED" } });
  for (const reward of [
    { key: "welcome", title: "Приветственный бонус", description: "Стартовое преимущество нового участника.", status: "PROVIDED", date: daysAgo(46) },
    { key: "priority", title: "Приоритетное сопровождение", description: "Ускоренная обработка вопросов по заданиям.", status: "AVAILABLE", date: daysAgo(8) },
    { key: "personal", title: "Персональное предложение", description: "Новое преимущество готовится для вашего профиля.", status: "PREPARING", date: daysAgo(2) },
  ] as const) {
    const stored = await database.vXReward.upsert({
      where: { idempotencyKey: `demo-player-reward-${reward.key}` },
      update: { rewardTypeId: rewardType.id, status: reward.status, title: reward.title, description: reward.description, nonMonetaryValue: { type: reward.key } },
      create: { userId: user.id, rewardTypeId: rewardType.id, status: reward.status, title: reward.title, description: reward.description, nonMonetaryValue: { type: reward.key }, idempotencyKey: `demo-player-reward-${reward.key}`, createdAt: reward.date },
    });
    const historyId = `20000000-0000-4000-8000-00000000010${reward.key === "welcome" ? "1" : reward.key === "priority" ? "2" : "3"}`;
    if (!await database.rewardStatusHistory.findUnique({ where: { id: historyId } })) {
      await database.rewardStatusHistory.create({ data: { id: historyId, rewardId: stored.id, fromStatus: null, toStatus: reward.status, reason: reward.status === "PROVIDED" ? "Преимущество получено" : reward.status === "AVAILABLE" ? "Преимущество доступно" : "Преимущество готовится", occurredAt: reward.date } });
    }
  }

  for (const category of [
    { key: "account", title: "Аккаунт", description: "Вопросы профиля и доступа" },
    { key: "tasks", title: "Задания", description: "Вопросы по выполнению заданий" },
  ]) {
    await database.supportCategory.upsert({
      where: { key: category.key },
      update: { title: category.title, description: category.description, roles: ["PLAYER"], marketId: market.id, isActive: true },
      create: { key: category.key, title: category.title, description: category.description, roles: ["PLAYER"], marketId: market.id, isActive: true },
    });
  }
  for (const ticket of [
    { id: "30000000-0000-4000-8000-000000000101", category: "account", subject: "Вопрос по профилю", status: "RESOLVED", date: daysAgo(18), closedAt: daysAgo(17) },
    { id: "30000000-0000-4000-8000-000000000102", category: "tasks", subject: "Уточнение по заданию", status: "WAITING_OPERATOR", date: daysAgo(1), closedAt: null },
  ] as const) {
    await database.supportConversation.upsert({
      where: { id: ticket.id },
      update: { userId: user.id, category: ticket.category, subject: ticket.subject, status: ticket.status, context: { demo: true }, closedAt: ticket.closedAt },
      create: { id: ticket.id, userId: user.id, category: ticket.category, subject: ticket.subject, status: ticket.status, priority: "NORMAL", context: { demo: true }, createdAt: ticket.date, closedAt: ticket.closedAt },
    });
  }

  for (const notification of [
    { key: "welcome", title: "Добро пожаловать в VX House", body: "Ваш профиль готов к работе.", status: "READ", date: daysAgo(47) },
    { key: "task", title: "Новое задание доступно", body: "Ознакомьтесь с условиями первого задания.", status: "SENT", date: daysAgo(4) },
    { key: "task-review", title: "Проверяем результат", body: "Мы получили информацию по заданию. Я напишу здесь, когда всё будет готово.", status: "SENT", date: daysAgo(2) },
    { key: "points", title: "Начислено 250 VX Points", body: "За выполненное ознакомительное задание вам начислено 250 VX Points.", status: "SENT", date: daysAgo(1.5) },
    { key: "reward", title: "Доступно новое преимущество", body: "Откройте VX Rewards, чтобы посмотреть подробности.", status: "SENT", date: daysAgo(1) },
  ] as const) {
    await database.notification.upsert({
      where: { idempotencyKey: `demo-player-notification-${notification.key}` },
      update: { title: notification.title, body: notification.body, status: notification.status, sentAt: notification.date, readAt: notification.status === "READ" ? notification.date : null },
      create: { userId: user.id, type: `demo.${notification.key}`, channel: "IN_APP", status: notification.status, title: notification.title, body: notification.body, idempotencyKey: `demo-player-notification-${notification.key}`, sentAt: notification.date, readAt: notification.status === "READ" ? notification.date : null, createdAt: notification.date },
    });
  }

  console.info("[VX House] Демо-аккаунт готов: demo.player@vxhouse.local / VXHouse-Demo-2026!");
} finally {
  await database.$disconnect();
}
