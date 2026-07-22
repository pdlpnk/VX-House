import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен для DB integration tests");
const parsed = new URL(connectionString);
if (!["localhost", "127.0.0.1"].includes(parsed.hostname)) {
  throw new Error("DB integration tests разрешены только для изолированной локальной БД");
}

const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;
const id = () => randomUUID();
const json = (value: unknown) => JSON.stringify(value);

after(async () => database.$disconnect());

beforeEach(async () => {
  await database.$executeRawUnsafe(
    'TRUNCATE TABLE "AuditEvent", "User", "Market", "ConsentDocument" CASCADE',
  );
});

async function execute(statement: string, values: readonly unknown[] = []) {
  return database.$executeRawUnsafe(statement, ...values);
}

async function expectDatabaseRejection(statement: string, values: readonly unknown[]) {
  await assert.rejects(async () => execute(statement, values));
}

async function insertUser() {
  const userId = id();
  await execute('INSERT INTO "User" ("id","email","createdAt","updatedAt") VALUES ($1,$2,NOW(),NOW())', [
    userId,
    `${userId}@test.invalid`,
  ]);
  return userId;
}

async function insertMarket(active = true) {
  const marketId = id();
  await execute(
    'INSERT INTO "Market" ("id","code","name","defaultLanguage","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())',
    [marketId, active ? "TR" : "AZ", active ? "Турция" : "Азербайджан", active ? "TR" : "AZ", active],
  );
  return marketId;
}

test("fresh migrations create all infrastructure and domain tables", async () => {
  const rows = await database.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN
     ('User','Session','Role','Permission','AuditEvent','UserProfile','UserConsent','IdempotencyRecord')`,
  );
  assert.equal(Number(rows[0]?.count), 8);
});

test("append-only audit and consent records reject update and delete", async () => {
  const userId = await insertUser();
  const auditId = id();
  await execute(
    'INSERT INTO "AuditEvent" ("id","actorType","actorId","action","targetType","occurredAt","metadata") VALUES ($1,$2,$3,$4,$5,NOW(),$6::jsonb)',
    [auditId, "user", userId, "test.append", "test-target", json({ synthetic: true })],
  );
  await expectDatabaseRejection('UPDATE "AuditEvent" SET "action"=$1 WHERE "id"=$2', ["test.changed", auditId]);
  await expectDatabaseRejection('DELETE FROM "AuditEvent" WHERE "id"=$1', [auditId]);

  const marketId = await insertMarket();
  const documentId = id();
  const versionId = id();
  await execute(
    'INSERT INTO "ConsentDocument" ("id","key","title","isRequired","createdAt","updatedAt") VALUES ($1,$2,$3,true,NOW(),NOW())',
    [documentId, "terms", "Условия"],
  );
  await execute(
    'INSERT INTO "ConsentVersion" ("id","consentDocumentId","marketId","version","language","contentHash","publishedAt","effectiveFrom","createdAt") VALUES ($1,$2,$3,1,$4,$5,NOW(),NOW(),NOW())',
    [versionId, documentId, marketId, "RU", "a".repeat(64)],
  );
  const consentId = id();
  await execute(
    'INSERT INTO "UserConsent" ("id","userId","consentVersionId","accepted","recordedAt","source") VALUES ($1,$2,$3,true,NOW(),$4)',
    [consentId, userId, versionId, "integration-test"],
  );
  await expectDatabaseRejection('UPDATE "UserConsent" SET "accepted"=false WHERE "id"=$1', [consentId]);
  await expectDatabaseRejection('DELETE FROM "UserConsent" WHERE "id"=$1', [consentId]);
});

test("idempotency and consent version uniqueness are enforced", async () => {
  const userId = await insertUser();
  const receipt = [id(), "test.operation", "same-key", userId, "a".repeat(64), "Test", "one"];
  const insertReceipt =
    'INSERT INTO "IdempotencyRecord" ("id","operation","key","actorId","requestHash","resultType","resultId","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())';
  await execute(insertReceipt, receipt);
  await expectDatabaseRejection(insertReceipt, [id(), ...receipt.slice(1)]);

  const marketId = await insertMarket();
  const documentId = id();
  await execute(
    'INSERT INTO "ConsentDocument" ("id","key","title","isRequired","createdAt","updatedAt") VALUES ($1,$2,$3,true,NOW(),NOW())',
    [documentId, "privacy", "Политика"],
  );
  const insertVersion =
    'INSERT INTO "ConsentVersion" ("id","consentDocumentId","marketId","version","language","contentHash","publishedAt","effectiveFrom","createdAt") VALUES ($1,$2,$3,1,$4,$5,NOW(),NOW(),NOW())';
  await execute(insertVersion, [id(), documentId, marketId, "RU", "b".repeat(64)]);
  await expectDatabaseRejection(insertVersion, [id(), documentId, marketId, "RU", "c".repeat(64)]);
});

test("Trust arithmetic and reward currency checks reject invalid values", async () => {
  const userId = await insertUser();
  await expectDatabaseRejection(
    'INSERT INTO "TrustScoreEvent" ("id","userId","delta","scoreBefore","scoreAfter","eventType","sourceType","sourceId","reason","ruleVersion","idempotencyKey","occurredAt") VALUES ($1,$2,5,40,42,$3,$4,$5,$6,$7,$8,NOW())',
    [id(), userId, "test", "test", id(), "Синтетическая проверка", "test-v1", id()],
  );
  const rewardTypeId = id();
  await execute(
    'INSERT INTO "RewardType" ("id","key","name","valueKind","description","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())',
    [rewardTypeId, "test-reward", "Тест", "MONETARY", "Синтетика", "DRAFT"],
  );
  await expectDatabaseRejection(
    'INSERT INTO "VXReward" ("id","userId","rewardTypeId","title","description","amount","currency","idempotencyKey","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,10,$6,$7,NOW(),NOW())',
    [id(), userId, rewardTypeId, "Тест", "Синтетика", "usd", id()],
  );
});

test("UserTask rejects a TaskVersion belonging to another definition", async () => {
  const userId = await insertUser();
  const firstDefinition = id();
  const secondDefinition = id();
  await execute('INSERT INTO "TaskDefinition" ("id","key","createdAt","updatedAt") VALUES ($1,$2,NOW(),NOW())', [firstDefinition, "first"]);
  await execute('INSERT INTO "TaskDefinition" ("id","key","createdAt","updatedAt") VALUES ($1,$2,NOW(),NOW())', [secondDefinition, "second"]);
  const versionId = id();
  await execute(
    'INSERT INTO "TaskVersion" ("id","taskDefinitionId","version","title","summary","requirements","limitations","resultRequirements","resubmissionPolicy","termsHash","createdAt") VALUES ($1,$2,1,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,NOW())',
    [versionId, secondDefinition, "Тест", "Синтетика", json({}), json({}), json({}), "Нет", "d".repeat(64)],
  );
  await expectDatabaseRejection(
    'INSERT INTO "UserTask" ("id","userId","taskDefinitionId","taskVersionId","assignmentKey","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())',
    [id(), userId, firstDefinition, versionId, id()],
  );
});

test("Appeal requires a source and system message cannot impersonate a user", async () => {
  const userId = await insertUser();
  await expectDatabaseRejection(
    'INSERT INTO "Appeal" ("id","userId","reason","createdAt","updatedAt") VALUES ($1,$2,$3,NOW(),NOW())',
    [id(), userId, "Синтетическая апелляция"],
  );
  const conversationId = id();
  await execute(
    'INSERT INTO "SupportCategory" ("id","key","title","description","roles","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5::jsonb,true,NOW(),NOW())',
    [id(), "task", "Задание", "Синтетическая категория", json(["PLAYER", "PARTNER"])],
  );
  await execute(
    'INSERT INTO "SupportConversation" ("id","userId","category","subject","context","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5::jsonb,NOW(),NOW())',
    [conversationId, userId, "task", "Синтетика", json({})],
  );
  await expectDatabaseRejection(
    'INSERT INTO "SupportMessage" ("id","conversationId","authorType","authorId","bodyProtected","createdAt") VALUES ($1,$2,$3,$4,$5::jsonb,NOW())',
    [id(), conversationId, "SYSTEM", userId, json({})],
  );
  await execute(
    'INSERT INTO "SupportMessage" ("id","conversationId","authorType","authorId","bodyProtected","createdAt") VALUES ($1,$2,$3,NULL,$4::jsonb,NOW())',
    [id(), conversationId, "SYSTEM", json({})],
  );
});
