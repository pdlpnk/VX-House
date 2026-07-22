import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import { ApplicationError, createTransactionalEventServices, PrismaTransactionRunner } from "../lib/application/index.ts";
import type { AuthenticatedPrincipal } from "../lib/auth/types.ts";
import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { ConsentApplicationService, ProfileApplicationService } from "../lib/services/identity-profile-consent-service.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL обязателен");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;

let userId = "";
let principal: AuthenticatedPrincipal;

beforeEach(async () => {
  await database.$executeRawUnsafe(
    'TRUNCATE TABLE "AuditEvent", "User", "Market", "ConsentDocument" CASCADE',
  );
  userId = randomUUID();
  await database.user.create({
    data: { id: userId, email: `${userId}@test.invalid`, displayName: "Синтетический пользователь" },
  });
  await database.market.createMany({
    data: [
      { code: "TR", name: "Турция", defaultLanguage: "TR", isActive: true },
      { code: "AZ", name: "Азербайджан", defaultLanguage: "AZ", isActive: false },
    ],
  });
  principal = {
    userId,
    sessionId: randomUUID(),
    roleKeys: ["authenticated"],
    permissionKeys: [],
  };
});

after(async () => {
  await database.$disconnect();
});

test("creates an isolated pending player profile and writes audit atomically", async () => {
  const service = new ProfileApplicationService(database);
  const result = await service.createProfile({
    principal,
    idempotencyKey: "profile-player-0001",
    profile: { productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
  });
  assert.equal(result.productRole, "PLAYER");
  assert.equal(result.playerProfile?.participationStatus, "PENDING");
  assert.equal(result.partnerProfile, null);
  assert.equal(result.contactVerificationStatus, "UNVERIFIED");
  assert.equal(await database.auditEvent.count({ where: { action: "profile.created" } }), 1);
});

test("creates a partner profile only in pending state", async () => {
  const result = await new ProfileApplicationService(database).createProfile({
    principal,
    idempotencyKey: "profile-partner-001",
    profile: { productRole: "PARTNER", marketCode: "TR", preferredLanguage: "TR" },
  });
  assert.equal(result.productRole, "PARTNER");
  assert.equal(result.partnerProfile?.status, "PENDING");
  assert.equal(result.playerProfile, null);
});

test("rejects inactive market, invalid product role and infrastructure role assignment", async () => {
  const service = new ProfileApplicationService(database);
  await assert.rejects(
    async () => service.createProfile({
      principal,
      idempotencyKey: "inactive-market-01",
      profile: { productRole: "PLAYER", marketCode: "AZ", preferredLanguage: "RU" },
    }),
    (error: unknown) => error instanceof ApplicationError && error.code === "VALIDATION",
  );
  await assert.rejects(
    async () => service.createProfile({
      principal,
      idempotencyKey: "invalid-role-0001",
      profile: { productRole: "ADMIN", marketCode: "TR", preferredLanguage: "RU" },
    }),
    (error: unknown) => error instanceof ApplicationError && error.code === "VALIDATION",
  );
  await assert.rejects(
    async () => service.createProfile({
      principal,
      idempotencyKey: "infra-role-000001",
      profile: { productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU", roleKeys: ["admin"] },
    }),
    (error: unknown) => error instanceof ApplicationError && error.code === "FORBIDDEN",
  );
  assert.equal(await database.userProfile.count(), 0);
  assert.equal(await database.auditEvent.count(), 0);
});

test("replays the same command and rejects idempotency payload conflict", async () => {
  const service = new ProfileApplicationService(database);
  const command = {
    principal,
    idempotencyKey: "profile-replay-001",
    profile: { productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
  };
  const first = await service.createProfile(command);
  const replay = await service.createProfile(command);
  assert.equal(replay.id, first.id);
  assert.equal(await database.userProfile.count(), 1);
  assert.equal(await database.auditEvent.count({ where: { action: "profile.created" } }), 1);
  await assert.rejects(
    service.createProfile({ ...command, profile: { productRole: "PARTNER", marketCode: "TR", preferredLanguage: "RU" } }),
    (error: unknown) => error instanceof ApplicationError && error.code === "IDEMPOTENCY_CONFLICT",
  );
});

async function createConsentFixtures() {
  const market = await database.market.findUniqueOrThrow({ where: { code: "TR" } });
  const publishedAt = new Date("2026-01-01T00:00:00.000Z");
  const versions = [];
  for (const [key, title] of [["terms", "Условия"], ["privacy", "Политика"]] as const) {
    const document = await database.consentDocument.create({ data: { key, title, isRequired: true } });
    versions.push(
      await database.consentVersion.create({
        data: {
          consentDocumentId: document.id,
          marketId: market.id,
          version: 1,
          language: "RU",
          contentHash: key.repeat(32).slice(0, 64),
          publishedAt,
          effectiveFrom: publishedAt,
        },
      }),
    );
  }
  return versions;
}

test("accepts concrete consent versions idempotently and checks all required versions", async () => {
  await new ProfileApplicationService(database).createProfile({
    principal,
    idempotencyKey: "consent-profile-01",
    profile: { productRole: "PLAYER", marketCode: "TR", preferredLanguage: "RU" },
  });
  const versions = await createConsentFixtures();
  const service = new ConsentApplicationService(database);
  assert.equal(await service.hasAcceptedRequired(principal), false);
  const first = await service.accept({
    principal,
    consentVersionId: versions[0]!.id,
    idempotencyKey: "accept-consent-001",
  });
  const replay = await service.accept({
    principal,
    consentVersionId: versions[0]!.id,
    idempotencyKey: "accept-consent-001",
  });
  assert.equal(replay.id, first.id);
  await service.accept({
    principal,
    consentVersionId: versions[1]!.id,
    idempotencyKey: "accept-consent-002",
  });
  assert.equal(await service.hasAcceptedRequired(principal), true);
  assert.equal(await database.userConsent.count(), 2);

  const nextVersion = await database.consentVersion.create({
    data: {
      consentDocumentId: versions[0]!.consentDocumentId,
      marketId: versions[0]!.marketId,
      version: 2,
      language: "RU",
      contentHash: "f".repeat(64),
      publishedAt: new Date("2026-06-01T00:00:00.000Z"),
      effectiveFrom: new Date("2026-06-01T00:00:00.000Z"),
    },
  });
  assert.equal(await service.hasAcceptedRequired(principal), false);
  await service.accept({
    principal,
    consentVersionId: nextVersion.id,
    idempotencyKey: "accept-consent-003",
  });
  assert.equal(await service.hasAcceptedRequired(principal), true);
  assert.equal(await database.userConsent.count(), 3);
});

test("transaction rollback removes mutation and audit together", async () => {
  const runner = new PrismaTransactionRunner(database, () => new Date("2026-07-22T00:00:00.000Z"));
  await assert.rejects(
    runner.run(async ({ database: transaction, occurredAt }) => {
      await transaction.idempotencyRecord.create({
        data: {
          operation: "test.rollback",
          key: "rollback-command-1",
          actorId: userId,
          requestHash: "e".repeat(64),
          resultType: "Synthetic",
          resultId: randomUUID(),
          createdAt: occurredAt,
        },
      });
      const { audit } = createTransactionalEventServices(transaction, occurredAt);
      await audit.record({
        actor: { type: "user", id: userId, sessionId: principal.sessionId },
        action: "test.rollback",
        target: { type: "synthetic", id: userId },
        metadata: { synthetic: true },
      });
      throw new Error("synthetic rollback");
    }),
  );
  assert.equal(await database.idempotencyRecord.count(), 0);
  assert.equal(await database.auditEvent.count(), 0);
});
