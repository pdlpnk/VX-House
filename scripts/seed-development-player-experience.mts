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
const dataProtectionKey = process.env.DATA_PROTECTION_KEY;
if (!dataProtectionKey) throw new Error("DATA_PROTECTION_KEY обязателен");
const dataProtectionKeyId = process.env.DATA_PROTECTION_KEY_ID ?? "local.primary";
const cryptoKey = crypto.subtle.importKey("raw", Buffer.from(dataProtectionKey, "base64url"), "AES-GCM", false, ["encrypt"]);
const textEncoder = new TextEncoder();

async function protectBytes(bytes: Uint8Array, purpose: string, resourceType: string, resourceId: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const context = { classification: "confidential", purpose, resourceId, resourceType };
  const payload = Uint8Array.from(bytes);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: textEncoder.encode(JSON.stringify(context)), tagLength: 128 }, await cryptoKey, payload.buffer);
  return { version: 1, algorithm: "AES-256-GCM", keyId: dataProtectionKeyId, iv: Buffer.from(iv).toString("base64url"), ciphertext: Buffer.from(ciphertext).toString("base64url") };
}

function protectText(body: string, purpose: "support-message" | "support-internal-note", conversationId: string) {
  return protectBytes(textEncoder.encode(body), purpose, "SupportConversation", conversationId);
}

function stableUuid(value: string) {
  const bytes = Buffer.from(hash(value).slice(0, 32), "hex");
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ensureSeedPersonalConversation(userId: string, marketId: string, displayName: string, occurredAt: Date) {
  const category = await database.supportCategory.upsert({
    where: { key: "personal-manager" },
    update: { title: "Персональный менеджер", description: "Постоянный личный канал связи с VX House.", roles: ["PLAYER", "PARTNER"], isActive: true },
    create: { key: "personal-manager", title: "Персональный менеджер", description: "Постоянный личный канал связи с VX House.", roles: ["PLAYER", "PARTNER"], isActive: true },
  });
  const id = stableUuid(`vx-house:personal-conversation:${userId}`);
  const conversation = await database.supportConversation.upsert({
    where: { id },
    update: { subject: "Менеджер VX House", category: category.key, context: { personalConversation: true, role: "PLAYER", marketId } },
    create: { id, userId, category: category.key, priority: "NORMAL", status: "CREATED", subject: "Менеджер VX House", context: { personalConversation: true, role: "PLAYER", marketId }, createdAt: occurredAt, updatedAt: occurredAt },
  });
  if (!await database.supportMessage.findFirst({ where: { conversationId: id } })) {
    const greeting = `Здравствуйте, ${displayName}!\n\nДобро пожаловать в VX House.\n\nЯ ваш персональный менеджер. Если возникнут вопросы — просто напишите мне.`;
    await database.supportMessage.create({ data: { conversationId: id, authorType: "SYSTEM", bodyProtected: await protectText(greeting, "support-message", id) as never, createdAt: occurredAt } });
  }
  return conversation;
}

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
  const admin = await database.user.upsert({
    where: { email: "admin@vxhouse.local" },
    update: { displayName: "Администратор VX House", passwordHash: passwordHash(demoPassword), disabledAt: null, roles: { connect: { id: adminRole.id } } },
    create: { email: "admin@vxhouse.local", displayName: "Администратор VX House", passwordHash: passwordHash(demoPassword), roles: { connect: { id: adminRole.id } } },
  });
  const user = await database.user.upsert({
    where: { email: "player1@vxhouse.local" },
    update: { displayName: "Алексей Волков", passwordHash: passwordHash(demoPassword), disabledAt: null, roles: { disconnect: { id: adminRole.id } } },
    create: { email: "player1@vxhouse.local", displayName: "Алексей Волков", passwordHash: passwordHash(demoPassword) },
  });
  const playerTwo = await database.user.upsert({
    where: { email: "player2@vxhouse.local" },
    update: { displayName: "Мария Соколова", passwordHash: passwordHash(demoPassword), disabledAt: null, roles: { disconnect: { id: adminRole.id } } },
    create: { email: "player2@vxhouse.local", displayName: "Мария Соколова", passwordHash: passwordHash(demoPassword) },
  });
  await database.user.updateMany({
    where: { email: { in: ["demo.player@vxhouse.local", "demo.elena@vxhouse.local", "demo.timur@vxhouse.local", "demo.marina@vxhouse.local", "demo.denis@vxhouse.local"] } },
    data: { disabledAt: now },
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
  await database.$transaction(async (transaction) => {
    const existing = await transaction.userProfile.findUnique({ where: { userId: playerTwo.id } });
    if (existing && existing.productRole !== "PLAYER") throw new Error("Player Two уже связан с другой ролью");
    const stored = existing
      ? await transaction.userProfile.update({ where: { id: existing.id }, data: { marketId: market.id, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", contactVerifiedAt: daysAgo(2), accountStatus: "ACTIVE" } })
      : await transaction.userProfile.create({ data: { userId: playerTwo.id, productRole: "PLAYER", marketId: market.id, preferredLanguage: "RU", contactVerificationStatus: "VERIFIED", contactVerifiedAt: daysAgo(2), accountStatus: "ACTIVE" } });
    await transaction.playerProfile.upsert({ where: { userProfileId: stored.id }, update: { participationStatus: "ACTIVE" }, create: { userProfileId: stored.id, participationStatus: "ACTIVE" } });
  });
  await database.onboardingProgress.upsert({
    where: { userId: playerTwo.id },
    update: { status: "COMPLETED", ageConfirmedAt: daysAgo(2), profileReadyAt: daysAgo(2), completedAt: daysAgo(2) },
    create: { userId: playerTwo.id, status: "COMPLETED", ageConfirmedAt: daysAgo(2), profileReadyAt: daysAgo(2), completedAt: daysAgo(2) },
  });

  const consentVersions = await database.consentVersion.findMany({
    where: { marketId: market.id, language: "RU", consentDocument: { key: { in: ["terms", "privacy"] } } },
    orderBy: { version: "desc" },
    distinct: ["consentDocumentId"],
  });
  for (const consent of consentVersions) {
    const stored = await database.userConsent.findUnique({ where: { userId_consentVersionId: { userId: user.id, consentVersionId: consent.id } } });
    if (!stored) await database.userConsent.create({ data: { userId: user.id, consentVersionId: consent.id, accepted: true, source: "development-demo", recordedAt: daysAgo(48) } });
    const playerTwoConsent = await database.userConsent.findUnique({ where: { userId_consentVersionId: { userId: playerTwo.id, consentVersionId: consent.id } } });
    if (!playerTwoConsent) await database.userConsent.create({ data: { userId: playerTwo.id, consentVersionId: consent.id, accepted: true, source: "development-demo", recordedAt: daysAgo(2) } });
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
  if (!await database.userRank.findUnique({ where: { idempotencyKey: "pass4-player-one-rank-explorer" } })) {
    await database.userRank.create({ data: { userId: user.id, rankDefinitionId: rankDefinitions[0].id, reason: "Начальный уровень участника", idempotencyKey: "pass4-player-one-rank-explorer", assignedAt: daysAgo(48) } });
  }
  if (!await database.userRank.findUnique({ where: { idempotencyKey: "demo-player-two-rank-explorer" } })) {
    await database.userRank.create({ data: { userId: playerTwo.id, rankDefinitionId: rankDefinitions[0].id, reason: "Начальный уровень участника", idempotencyKey: "demo-player-two-rank-explorer", assignedAt: daysAgo(2) } });
  }

  for (const entry of [
    { key: "welcome", delta: 100, reason: "Приветствие в VX House", date: daysAgo(28) },
    { key: "profile", delta: 150, reason: "Профиль полностью заполнен", date: daysAgo(20) },
    { key: "activity", delta: 250, reason: "Выполнено ознакомительное задание", date: daysAgo(12) },
    { key: "bonus", delta: 350, reason: "Персональный бонус участника", date: daysAgo(3) },
  ]) {
    const idempotencyKey = `pass4-player-one-points-${entry.key}`;
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
  const completedRegistration = await database.userTask.upsert({ where: { assignmentKey: "pass4-player-one-partner-registration" }, update: { userId: user.id, taskDefinitionId: registrationTask.id, taskVersionId: registrationTaskVersion.id, status: "CONFIRMED", completedAt: daysAgo(6) }, create: { userId: user.id, taskDefinitionId: registrationTask.id, taskVersionId: registrationTaskVersion.id, status: "CONFIRMED", assignmentKey: "pass4-player-one-partner-registration", acceptedAt: daysAgo(8), startedAt: daysAgo(8), completedAt: daysAgo(6) } });
  const completedHistoryId = stableUuid("pass4-player-one-registration-confirmed");
  await database.userTaskStatusHistory.upsert({ where: { id: completedHistoryId }, update: {}, create: { id: completedHistoryId, userTaskId: completedRegistration.id, fromStatus: "UNDER_REVIEW", toStatus: "CONFIRMED", reason: "Менеджер подтвердил выполнение", occurredAt: daysAgo(6) } });

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
    where: { assignmentKey: "pass4-player-one-first-deposit" },
    update: { userId: user.id, taskDefinitionId: taskDefinition.id, taskVersionId: taskVersion.id, status: "UNDER_REVIEW", acceptedAt: daysAgo(4), startedAt: daysAgo(4) },
    create: { userId: user.id, taskDefinitionId: taskDefinition.id, taskVersionId: taskVersion.id, status: "UNDER_REVIEW", assignmentKey: "pass4-player-one-first-deposit", acceptedAt: daysAgo(4), startedAt: daysAgo(4) },
  });
  for (const event of [
    { id: stableUuid("pass4-player-one-task-available"), from: null, to: "AVAILABLE", reason: "Задание стало доступно", date: daysAgo(4) },
    { id: stableUuid("pass4-player-one-task-accepted"), from: "AVAILABLE", to: "ACCEPTED", reason: "Задание принято", date: daysAgo(4) },
    { id: stableUuid("pass4-player-one-task-in-progress"), from: "ACCEPTED", to: "IN_PROGRESS", reason: "Выполнение начато", date: daysAgo(4) },
    { id: stableUuid("pass4-player-one-task-submitted"), from: "IN_PROGRESS", to: "SUBMITTED", reason: "Результат отправлен", date: daysAgo(2) },
    { id: stableUuid("pass4-player-one-task-under-review"), from: "SUBMITTED", to: "UNDER_REVIEW", reason: "Результат ожидает проверки", date: daysAgo(2) },
  ] as const) {
    if (!await database.userTaskStatusHistory.findUnique({ where: { id: event.id } })) {
      await database.userTaskStatusHistory.create({ data: { id: event.id, userTaskId: userTask.id, fromStatus: event.from, toStatus: event.to, reason: event.reason, occurredAt: event.date } });
    }
  }
  const playerOneSubmission = await database.taskSubmission.upsert({
    where: { userTaskId: userTask.id },
    update: {},
    create: { userTaskId: userTask.id, createdAt: daysAgo(2) },
  });
  if (!await database.submissionVersion.findUnique({ where: { taskSubmissionId_version: { taskSubmissionId: playerOneSubmission.id, version: 1 } } })) {
    await database.submissionVersion.create({
      data: { taskSubmissionId: playerOneSubmission.id, version: 1, status: "SUBMITTED", payload: { note: "Демонстрационный результат для проверки сценария" }, contentHash: hash("player-one-first-deposit-submission-v1"), submittedAt: daysAgo(2), createdAt: daysAgo(2) },
    });
  }

  const playerTwoTask = await database.userTask.upsert({
    where: { assignmentKey: "demo-player-two-partner-registration" },
    update: { userId: playerTwo.id, taskDefinitionId: registrationTask.id, taskVersionId: registrationTaskVersion.id, status: "IN_PROGRESS", acceptedAt: daysAgo(1), startedAt: daysAgo(1) },
    create: { userId: playerTwo.id, taskDefinitionId: registrationTask.id, taskVersionId: registrationTaskVersion.id, status: "IN_PROGRESS", assignmentKey: "demo-player-two-partner-registration", acceptedAt: daysAgo(1), startedAt: daysAgo(1) },
  });
  for (const event of [
    { id: "10000000-0000-4000-8000-000000000201", from: null, to: "AVAILABLE", reason: "Первое задание стало доступно", date: daysAgo(1.5) },
    { id: "10000000-0000-4000-8000-000000000202", from: "AVAILABLE", to: "ACCEPTED", reason: "Задание принято", date: daysAgo(1) },
    { id: "10000000-0000-4000-8000-000000000203", from: "ACCEPTED", to: "IN_PROGRESS", reason: "Выполнение начато", date: daysAgo(1) },
  ] as const) {
    await database.userTaskStatusHistory.upsert({ where: { id: event.id }, update: {}, create: { id: event.id, userTaskId: playerTwoTask.id, fromStatus: event.from, toStatus: event.to, reason: event.reason, occurredAt: event.date } });
  }

  const rewardType = await database.rewardType.findUnique({ where: { key: "demo-benefit" } })
    ?? await database.rewardType.create({ data: { key: "demo-benefit", name: "Преимущество участника", valueKind: "NON_MONETARY", description: "Персональное преимущество VX House", status: "PUBLISHED" } });
  for (const reward of [
    { key: "welcome", title: "Приветственный бонус", description: "Стартовое преимущество нового участника.", status: "PROVIDED", date: daysAgo(46) },
    { key: "priority", title: "Приоритетное сопровождение", description: "Ускоренная обработка вопросов по заданиям.", status: "AVAILABLE", date: daysAgo(8) },
    { key: "personal", title: "Персональное предложение", description: "Новое преимущество готовится для вашего профиля.", status: "PREPARING", date: daysAgo(2) },
  ] as const) {
    const stored = await database.vXReward.upsert({
      where: { idempotencyKey: `pass4-player-one-reward-${reward.key}` },
      update: { rewardTypeId: rewardType.id, status: reward.status, title: reward.title, description: reward.description, nonMonetaryValue: { type: reward.key } },
      create: { userId: user.id, rewardTypeId: rewardType.id, status: reward.status, title: reward.title, description: reward.description, nonMonetaryValue: { type: reward.key }, idempotencyKey: `pass4-player-one-reward-${reward.key}`, createdAt: reward.date },
    });
    const historyId = stableUuid(`pass4-player-one-reward-history-${reward.key}`);
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
      where: { idempotencyKey: `pass4-player-one-notification-${notification.key}` },
      update: { title: notification.title, body: notification.body, status: notification.status, sentAt: notification.date, readAt: notification.status === "READ" ? notification.date : null },
      create: { userId: user.id, type: `demo.${notification.key}`, channel: "IN_APP", status: notification.status, title: notification.title, body: notification.body, idempotencyKey: `pass4-player-one-notification-${notification.key}`, sentAt: notification.date, readAt: notification.status === "READ" ? notification.date : null, createdAt: notification.date },
    });
  }

  async function seedConversationMessage(input: { conversationId: string; key: string; authorType: "SYSTEM" | "USER" | "OPERATOR"; authorId?: string; body: string; createdAt: Date }) {
    const existing = await database.idempotencyRecord.findUnique({ where: { operation_key: { operation: "pass4.seed.message", key: input.key } } });
    if (existing) return;
    const message = await database.supportMessage.create({
      data: { conversationId: input.conversationId, authorType: input.authorType, authorId: input.authorId, bodyProtected: await protectText(input.body, "support-message", input.conversationId) as never, createdAt: input.createdAt },
    });
    await database.supportConversation.update({ where: { id: input.conversationId }, data: { updatedAt: input.createdAt } });
    await database.idempotencyRecord.create({ data: { operation: "pass4.seed.message", key: input.key, actorId: input.authorId ?? admin.id, requestHash: hash(input.body), resultType: "SupportMessage", resultId: message.id, createdAt: input.createdAt } });
  }

  const playerOneConversation = await ensureSeedPersonalConversation(user.id, market.id, user.displayName || "Алексей", daysAgo(48));
  const playerTwoConversation = await ensureSeedPersonalConversation(playerTwo.id, market.id, playerTwo.displayName || "Мария", daysAgo(2));
  for (const message of [
    { key: "player1-email-verified", authorType: "SYSTEM", body: "Электронная почта подтверждена. Аккаунт готов к следующему шагу.", date: daysAgo(47) },
    { key: "player1-onboarding-completed", authorType: "SYSTEM", body: "Знакомство завершено. Теперь можно выполнять доступные задания.", date: daysAgo(46) },
    { key: "player1-task-submitted", authorType: "SYSTEM", body: "Задание отправлено. Мы получили результат и начали проверку.", date: daysAgo(14) },
    { key: "player1-task-approved", authorType: "SYSTEM", body: "Задание подтверждено. Следующий шаг уже доступен в вашем пространстве.", date: daysAgo(12) },
    { key: "player1-points-added", authorType: "SYSTEM", body: "Начислены VX Points: +250. Запись добавлена в историю прогресса.", date: daysAgo(11) },
    { key: "player1-question", authorType: "USER", authorId: user.id, body: "Здравствуйте! Я отправил результат второго задания. Подскажите, всё ли видно?", date: daysAgo(1) },
    { key: "player1-admin-answer", authorType: "OPERATOR", authorId: admin.id, body: "Здравствуйте, Алексей. Результат получен и сейчас ожидает проверки. Я напишу вам здесь после решения.", date: new Date(now.getTime() - 70 * 60_000) },
  ] as const) await seedConversationMessage({ conversationId: playerOneConversation.id, ...message, createdAt: message.date });

  for (const message of [
    { key: "player2-email-verified", authorType: "SYSTEM", body: "Электронная почта подтверждена. Аккаунт готов к следующему шагу.", date: daysAgo(1.9) },
    { key: "player2-onboarding-completed", authorType: "SYSTEM", body: "Знакомство завершено. Первое задание уже доступно в вашем пространстве.", date: daysAgo(1.8) },
    { key: "player2-first-message", authorType: "USER", authorId: playerTwo.id, body: "Здравствуйте! Я открыла первое задание и начала выполнять инструкцию.", date: new Date(now.getTime() - 45 * 60_000) },
    { key: "player2-admin-answer", authorType: "OPERATOR", authorId: admin.id, body: "Здравствуйте, Мария. Отлично — если появится вопрос по шагам, просто напишите мне в этом диалоге.", date: new Date(now.getTime() - 30 * 60_000) },
  ] as const) await seedConversationMessage({ conversationId: playerTwoConversation.id, ...message, createdAt: message.date });

  const noteKey = "pass4-note-player-one";
  if (!await database.idempotencyRecord.findUnique({ where: { operation_key: { operation: "pass4.seed.note", key: noteKey } } })) {
    const logicalId = "41000000-0000-4000-8000-000000000011";
    const body = JSON.stringify({ messengerNote: 1, logicalId, action: "create", body: "Проверить второе задание и сообщить решение в личном диалоге." });
    const note = await database.supportInternalNote.create({ data: { conversationId: playerOneConversation.id, authorId: admin.id, bodyProtected: await protectText(body, "support-internal-note", playerOneConversation.id) as never, createdAt: daysAgo(1) } });
    await database.idempotencyRecord.create({ data: { operation: "pass4.seed.note", key: noteKey, actorId: admin.id, requestHash: hash(body), resultType: "SupportInternalNote", resultId: note.id } });
  }

  console.info("[VX House] Демо-среда готова:");
  console.info(`  admin@vxhouse.local / ${demoPassword}`);
  console.info(`  player1@vxhouse.local / ${demoPassword}`);
  console.info(`  player2@vxhouse.local / ${demoPassword}`);
} finally {
  await database.$disconnect();
}
