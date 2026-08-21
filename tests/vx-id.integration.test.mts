import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

import type { PrismaClient } from "../lib/db/generated/client.ts";
import { PrismaClient as NodePrismaClient } from "../lib/db/generated-node/client.ts";
import { avatarEmojiForVxId } from "../lib/user-avatar.ts";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required");
const database = new NodePrismaClient({ adapter: new PrismaPg({ connectionString }) }) as unknown as PrismaClient;

const numberOf = (vxId: string) => Number(vxId.slice(2));

beforeEach(async () => {
  await database.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
});

after(async () => {
  await database.$disconnect();
});

test("new and parallel users receive unique sequential VX IDs", async () => {
  const first = await database.user.create({ data: { email: `${randomUUID()}@test.invalid` } });
  assert.match(first.vxId, /^VX\d{6}$/u);

  const created = await Promise.all(Array.from({ length: 16 }, () => database.user.create({ data: { email: `${randomUUID()}@test.invalid` } })));
  const ids = created.map((user) => user.vxId);
  assert.equal(new Set(ids).size, ids.length);
  const numbers = ids.map(numberOf).sort((a, b) => a - b);
  assert.deepEqual(numbers, Array.from({ length: 16 }, (_, index) => numberOf(first.vxId) + index + 1));
});

test("parallel player avatar writes remain deterministic and unique", async () => {
  const created = await Promise.all(Array.from({ length: 24 }, () => database.user.create({ data: { email: `${randomUUID()}@test.invalid` } })));
  await Promise.all(created.map((user) => database.user.update({
    where: { id: user.id },
    data: { avatarEmoji: avatarEmojiForVxId(user.vxId) },
  })));
  const persisted = await database.user.findMany({ where: { id: { in: created.map((user) => user.id) } } });
  assert.equal(new Set(persisted.map((user) => user.avatarEmoji)).size, persisted.length);
  for (const user of persisted) assert.equal(user.avatarEmoji, avatarEmojiForVxId(user.vxId));
});

test("deleted VX ID is never reused", async () => {
  const deleted = await database.user.create({ data: { email: `${randomUUID()}@test.invalid` } });
  await database.user.delete({ where: { id: deleted.id } });
  const next = await database.user.create({ data: { email: `${randomUUID()}@test.invalid` } });
  assert.ok(numberOf(next.vxId) > numberOf(deleted.vxId));
  assert.notEqual(next.vxId, deleted.vxId);
});

test("duplicate and mutation of VX ID are rejected by PostgreSQL", async () => {
  const first = await database.user.create({ data: { email: `${randomUUID()}@test.invalid` } });
  await assert.rejects(database.user.create({ data: { email: `${randomUUID()}@test.invalid`, vxId: first.vxId } }));
  await assert.rejects(database.user.update({ where: { id: first.id }, data: { vxId: "VX999999" } }));
  assert.equal((await database.user.findUniqueOrThrow({ where: { id: first.id } })).vxId, first.vxId);
});
