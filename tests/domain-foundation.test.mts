import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  accountStateMachine,
  appealStateMachine,
  assertTransition,
  canTransition,
  forecastStateMachine,
  publicationStateMachine,
  rewardStateMachine,
  reviewStateMachine,
  submissionStateMachine,
  supportStateMachine,
  taskStateMachine,
} from "../lib/domain/status-machine.ts";

test("status machines allow explicit transitions and deny everything else", () => {
  assert.equal(canTransition(accountStateMachine, "PENDING", "ACTIVE"), true);
  assert.equal(canTransition(accountStateMachine, "CLOSED", "ACTIVE"), false);
  assert.equal(canTransition(publicationStateMachine, "DRAFT", "PUBLISHED"), false);
  assert.equal(canTransition(taskStateMachine, "AVAILABLE", "CONFIRMED"), false);
  assert.equal(canTransition(submissionStateMachine, "DRAFT", "SUBMITTED"), true);
  assert.equal(canTransition(reviewStateMachine, "UNDER_REVIEW", "REJECTED"), true);
  assert.equal(canTransition(rewardStateMachine, "PROVIDED", "PREPARING"), false);
  assert.equal(canTransition(supportStateMachine, "CLOSED", "ASSIGNED"), true);
  assert.equal(canTransition(appealStateMachine, "DENIED", "UNDER_REVIEW"), false);
  assert.equal(canTransition(forecastStateMachine, "PUBLISHED", "SUPERSEDED"), true);
  assert.throws(() => assertTransition(taskStateMachine, "CONFIRMED", "IN_PROGRESS"));
});

test("critical terminal states have no accidental outgoing transitions", () => {
  assert.deepEqual(taskStateMachine.transitions.CONFIRMED, []);
  assert.deepEqual(taskStateMachine.transitions.REJECTED, []);
  assert.deepEqual(rewardStateMachine.transitions.PROVIDED, []);
  assert.deepEqual(appealStateMachine.transitions.UPHELD, []);
  assert.deepEqual(forecastStateMachine.transitions.ARCHIVED, []);
});

test("schema encodes version and idempotency uniqueness assumptions", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

  const requiredConstraints = [
    "@@unique([consentDocumentId, marketId, version, language])",
    "@@unique([instructionId, version, language])",
    "@@unique([taskDefinitionId, version])",
    "@@unique([taskSubmissionId, version])",
    "@@unique([forecastId, version, language])",
    "idempotencyKey String",
    "@unique @db.VarChar(160)",
  ];

  for (const constraint of requiredConstraints) {
    assert.equal(schema.includes(constraint), true, `Missing schema invariant: ${constraint}`);
  }
});

test("migration protects append-only domain records and financial invariants", async () => {
  const migration = await readFile(
    new URL("../prisma/migrations/20260722030000_domain_foundation/migration.sql", import.meta.url),
    "utf8",
  );

  for (const table of [
    "VXPointsLedgerEntry",
    "TrustScoreEvent",
    "UserRank",
    "UserTaskStatusHistory",
    "SubmissionReview",
    "RewardStatusHistory",
    "SupportStatusHistory",
  ]) {
    assert.equal(migration.includes(`protect_append_only('"${table}"')`), true, `${table} is not protected`);
  }

  assert.equal(migration.includes("VXReward_money_currency_check"), true);
  assert.equal(migration.includes("TrustScoreEvent_score_range_check"), true);
  assert.equal(migration.includes("ForecastVersion_validity_check"), true);
});
