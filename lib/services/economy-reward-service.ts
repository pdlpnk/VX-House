import "server-only";

import { createHash } from "node:crypto";

import type { AuthenticatedPrincipal } from "@/lib/auth";
import { ApplicationError, createTransactionalEventServices, hashCommandPayload, PrismaTransactionRunner } from "@/lib/application";
import type { DatabaseClient, PrismaClient } from "@/lib/db";
import { assertTransition, rewardStateMachine } from "@/lib/domain";
import type { EconomyCriterion, EconomyHistoryEvent, EconomyHistoryView, EconomyRuleCommand, EconomySnapshotView, RankCode, RankView, RewardStatus, RewardView } from "@/lib/economy";
import { PrismaEconomyRewardRepository, PrismaIdempotencyRepository } from "@/lib/repositories";
import { createProductNotification } from "./product-notification";

const ECONOMY_WRITE_PERMISSION = "economy.write";
const keyPattern = /^[A-Za-z0-9_.:-]{8,160}$/;
const rankOrder: RankCode[] = ["EXPLORER", "NAVIGATOR", "ATLAS", "PRIME", "SIGNATURE"];
const rankLabels: Record<RankCode, string> = { EXPLORER: "Исследователь", NAVIGATOR: "Навигатор", ATLAS: "Атлас", PRIME: "Прайм", SIGNATURE: "Сигнатура" };

function requireKey(key: string) { if (!keyPattern.test(key)) throw new ApplicationError("VALIDATION", "Некорректный ключ идемпотентности"); }
function requireEconomyWriter(actor: AuthenticatedPrincipal) { if (!actor.permissionKeys.includes(ECONOMY_WRITE_PERMISSION)) throw new ApplicationError("FORBIDDEN", "Недостаточно прав для изменения экономики"); }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 40) : []; }
function number(value: unknown) { return typeof value === "number" && Number.isSafeInteger(value) ? value : null; }
function bool(value: unknown) { return value === true; }
function clampScore(value: number) { return Math.max(0, Math.min(100, value)); }
function derivedKey(prefix: string, key: string) { return `${prefix}-${createHash("sha256").update(key).digest("hex")}`; }

type Profile = NonNullable<Awaited<ReturnType<PrismaEconomyRewardRepository["findProfile"]>>>;
type Policy = Awaited<ReturnType<PrismaEconomyRewardRepository["listEffectivePolicies"]>>[number];
type RankDefinition = Awaited<ReturnType<PrismaEconomyRewardRepository["listRankDefinitions"]>>[number];
type RewardRecord = NonNullable<Awaited<ReturnType<PrismaEconomyRewardRepository["findReward"]>>>;

function assertProfile(profile: Awaited<ReturnType<PrismaEconomyRewardRepository["findProfile"]>>): asserts profile is Profile {
  if (!profile || !profile.market.isActive || profile.accountStatus === "SUSPENDED" || profile.accountStatus === "CLOSED") throw new ApplicationError("FORBIDDEN", "Экономика недоступна для профиля");
}

function specificity(item: { productRole: string | null; marketId: string | null }, profile: Profile) {
  return (item.productRole === profile.productRole ? 2 : 0) + (item.marketId === profile.market.id ? 1 : 0);
}

function selectPolicy(items: Policy[], profile: Profile) {
  return [...items].sort((a, b) => specificity(b, profile) - specificity(a, profile) || b.version - a.version)[0] ?? null;
}

function selectRankDefinitions(items: RankDefinition[], profile: Profile) {
  const byCode = new Map<RankCode, RankDefinition>();
  for (const item of [...items].sort((a, b) => specificity(b, profile) - specificity(a, profile) || b.version - a.version)) if (!byCode.has(item.code)) byCode.set(item.code, item);
  return rankOrder.flatMap((code) => byCode.get(code) ? [byCode.get(code)!] : []);
}

function criteria(definition: RankDefinition, totals: { points: number; trust: number | null; confirmedTasks: number }): EconomyCriterion[] {
  const config = object(definition.criteria);
  const output: EconomyCriterion[] = [];
  const minPoints = number(config.minPoints); if (minPoints !== null) output.push({ key: "points", label: "Подтверждённые VX Points", current: totals.points, required: minPoints, completed: totals.points >= minPoints });
  const minTrust = number(config.minTrustScore); if (minTrust !== null) output.push({ key: "trust", label: "Trust Score", current: totals.trust ?? 0, required: minTrust, completed: totals.trust !== null && totals.trust >= minTrust });
  const taskCount = number(config.confirmedTasks); if (taskCount !== null) output.push({ key: "confirmedTasks", label: "Подтверждённые задания", current: totals.confirmedTasks, required: taskCount, completed: totals.confirmedTasks >= taskCount });
  if (bool(config.manualApproval)) output.push({ key: "manualApproval", label: "Подтверждение руководителя", current: false, required: true, completed: false });
  return output;
}

function rankView(definition: RankDefinition, totals: { points: number; trust: number | null; confirmedTasks: number }): RankView {
  return { id: definition.id, code: definition.code, label: rankLabels[definition.code], version: definition.version, benefits: strings(definition.benefits), criteria: criteria(definition, totals) };
}

function trustZone(policy: Policy | null, score: number | null) {
  if (!policy || score === null || !Array.isArray(policy.trustZones)) return null;
  for (const item of policy.trustZones) { const zone = object(item); const min = number(zone.min); const max = number(zone.max); if (min !== null && max !== null && score >= min && score <= max && typeof zone.label === "string") return zone.label; }
  return null;
}

function rewardAvailability(reward: RewardRecord, at: Date): Pick<RewardView, "availability" | "availabilityReason"> {
  if (reward.status === "PROVIDED") return { availability: "COMPLETED", availabilityReason: "Преимущество уже предоставлено и сохранено в истории." };
  if (reward.status === "EXPIRED" || (reward.validUntil && reward.validUntil <= at)) return { availability: "EXPIRED", availabilityReason: "Опубликованный срок использования завершён." };
  if (reward.status === "AVAILABLE" && (!reward.validFrom || reward.validFrom <= at)) return { availability: "CLAIMABLE", availabilityReason: "Reward подтверждён и доступен для получения." };
  return { availability: "NOT_READY", availabilityReason: "Текущий статус ещё не разрешает получение Reward." };
}

function rewardView(reward: RewardRecord, at = new Date()): RewardView {
  const value = reward.nonMonetaryValue;
  return {
    id: reward.id, typeKey: reward.rewardType.key, typeName: reward.rewardType.name, valueKind: reward.rewardType.valueKind, status: reward.status,
    title: reward.title, description: reward.description, amount: reward.amount?.toString() ?? null, currency: reward.currency,
    nonMonetaryValue: value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null,
    validFrom: reward.validFrom?.toISOString() ?? null, validUntil: reward.validUntil?.toISOString() ?? null, provisionDueAt: reward.provisionDueAt?.toISOString() ?? null,
    userTaskId: reward.userTaskId, submissionReviewId: reward.submissionReviewId,
    ...rewardAvailability(reward, at),
    history: reward.statusHistory.map((item) => ({ id: item.id, fromStatus: item.fromStatus, toStatus: item.toStatus, reason: item.reason, occurredAt: item.occurredAt.toISOString() })),
  };
}

export class EconomyRewardApplicationService {
  private readonly transactions: PrismaTransactionRunner;
  constructor(private readonly database: PrismaClient) { this.transactions = new PrismaTransactionRunner(database); }

  async getSnapshot(principal: AuthenticatedPrincipal): Promise<EconomySnapshotView> {
    return this.snapshot(principal.userId, new PrismaEconomyRewardRepository(this.database));
  }

  async getHistory(principal: AuthenticatedPrincipal): Promise<EconomyHistoryView> {
    const repository = new PrismaEconomyRewardRepository(this.database);
    assertProfile(await repository.findProfile(principal.userId));
    const points = await repository.listPoints(principal.userId);
    const trust = await repository.listTrustEvents(principal.userId);
    const ranks = await repository.listUserRanks(principal.userId);
    const rewards = await repository.listRewards(principal.userId);
    const items: EconomyHistoryEvent[] = [
      ...points.map((item) => ({ kind: "POINTS" as const, id: item.id, delta: item.delta, status: item.status, sourceType: item.sourceType, sourceId: item.sourceId, reason: item.reason, ruleVersion: item.ruleVersion, occurredAt: item.occurredAt.toISOString(), reversesEntryId: item.reversesEntryId })),
      ...trust.map((item) => ({ kind: "TRUST" as const, id: item.id, delta: item.delta, scoreBefore: item.scoreBefore, scoreAfter: item.scoreAfter, eventType: item.eventType, sourceType: item.sourceType, sourceId: item.sourceId, reason: item.reason, ruleVersion: item.ruleVersion, isAppealable: item.isAppealable, occurredAt: item.occurredAt.toISOString() })),
      ...ranks.map((item) => ({ kind: "RANK" as const, id: item.id, code: item.rankDefinition.code, label: rankLabels[item.rankDefinition.code], version: item.rankDefinition.version, reason: item.reason, assignedAt: item.assignedAt.toISOString() })),
      ...rewards.flatMap((reward) => reward.statusHistory.map((item) => ({ kind: "REWARD" as const, rewardId: reward.id, rewardTitle: reward.title, id: item.id, fromStatus: item.fromStatus, toStatus: item.toStatus, reason: item.reason, occurredAt: item.occurredAt.toISOString() }))),
    ];
    items.sort((a, b) => new Date("occurredAt" in b ? b.occurredAt : b.assignedAt).getTime() - new Date("occurredAt" in a ? a.occurredAt : a.assignedAt).getTime());
    return { items };
  }

  async listRewards(principal: AuthenticatedPrincipal) {
    const repository = new PrismaEconomyRewardRepository(this.database); assertProfile(await repository.findProfile(principal.userId));
    return (await repository.listRewards(principal.userId)).map((item) => rewardView(item));
  }

  async getReward(principal: AuthenticatedPrincipal, id: string) {
    const repository = new PrismaEconomyRewardRepository(this.database); assertProfile(await repository.findProfile(principal.userId));
    const reward = await repository.findReward(id, principal.userId); if (!reward) throw new ApplicationError("NOT_FOUND", "VX Reward не найден");
    return rewardView(reward);
  }

  applyRules(actor: AuthenticatedPrincipal, command: EconomyRuleCommand, idempotencyKey: string) {
    requireEconomyWriter(actor); requireKey(idempotencyKey);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaEconomyRewardRepository(database); const receipts = new PrismaIdempotencyRepository(database);
      const requestHash = hashCommandPayload(command); const replay = await receipts.find("economy.rules.apply", idempotencyKey);
      if (replay) { if (replay.actorId !== actor.userId || replay.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другого экономического события"); return this.snapshot(command.userId, repository); }
      const profile = await repository.findProfile(command.userId); assertProfile(profile);
      if (command.userTaskId) {
        const task = await database.userTask.findFirst({ where: { id: command.userTaskId, userId: command.userId, status: "CONFIRMED" }, select: { id: true } });
        if (!task) throw new ApplicationError("FORBIDDEN", "Экономическое событие требует подтверждённого задания владельца");
      }
      const policy = selectPolicy(await repository.listEffectivePolicies({ role: profile.productRole, marketId: profile.market.id, at: occurredAt }), profile);
      if (!policy) throw new ApplicationError("CONFLICT", "Опубликованная конфигурация экономики отсутствует");
      if (command.pointsRuleKey) await this.appendPointsByRule(database, repository, policy, command, idempotencyKey, occurredAt);
      if (command.trustRuleKey) await this.appendTrustByRule(database, repository, policy, command, idempotencyKey, occurredAt);
      await this.promoteRank(database, repository, profile, command.userId, derivedKey("rank", idempotencyKey), occurredAt);
      await createProductNotification(database, { userId: command.userId, type: "economy.updated", title: "Обновлён прогресс", body: command.reason, relatedType: "ECONOMY", relatedId: command.sourceId, idempotencyKey: `economy-updated:${idempotencyKey}`, actorId: actor.userId, occurredAt, systemMessage: { key: "system.economyUpdated", params: { reason: command.reason } } });
      await receipts.create({ operation: "economy.rules.apply", key: idempotencyKey, actorId: actor.userId, requestHash, resultType: "EconomySnapshot", resultId: command.userId, createdAt: occurredAt });
      const { audit } = createTransactionalEventServices(database, occurredAt);
      await audit.record({ actor: { type: "user", id: actor.userId, sessionId: actor.sessionId }, action: "economy.rules.applied", target: { type: "user", id: command.userId }, metadata: { sourceType: command.sourceType, sourceId: command.sourceId, policyVersion: policy.version } });
      return this.snapshot(command.userId, repository);
    });
  }

  reversePoints(actor: AuthenticatedPrincipal, userId: string, entryId: string, reason: string, idempotencyKey: string) {
    requireEconomyWriter(actor); requireKey(idempotencyKey);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaEconomyRewardRepository(database); const original = await repository.findPointById(entryId, userId);
      if (!original || original.status !== "CONFIRMED" || original.delta <= 0) throw new ApplicationError("CONFLICT", "Исходное подтверждённое начисление не найдено");
      const existing = await database.vXPointsLedgerEntry.findUnique({ where: { idempotencyKey } });
      if (existing) {
        if (existing.userId !== userId || existing.reversesEntryId !== original.id || existing.delta !== -original.delta || existing.reason !== reason) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другой корректировки");
        return existing;
      }
      const created = await database.vXPointsLedgerEntry.create({ data: { userId, userTaskId: original.userTaskId, delta: -original.delta, status: "REVERSED", sourceType: "REVERSAL", sourceId: original.id, reason, ruleVersion: original.ruleVersion, idempotencyKey, reversesEntryId: original.id, occurredAt } });
      await createProductNotification(database, { userId, type: "economy.adjusted", title: "Скорректированы VX Points", body: reason, relatedType: "POINTS_ENTRY", relatedId: created.id, idempotencyKey: `economy-reversed:${created.id}`, actorId: actor.userId, occurredAt, systemMessage: { key: "system.economyAdjusted", params: { reason } } });
      const profile = await repository.findProfile(userId); assertProfile(profile); await this.promoteRank(database, repository, profile, userId, derivedKey("rank", idempotencyKey), occurredAt);
      return created;
    });
  }

  issueReward(actor: AuthenticatedPrincipal, input: { userId: string; typeKey: string; title: string; description: string; amount?: string; currency?: string; nonMonetaryValue?: Record<string, unknown>; userTaskId?: string; submissionReviewId?: string; validFrom?: Date; validUntil?: Date }, idempotencyKey: string) {
    requireEconomyWriter(actor); requireKey(idempotencyKey);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaEconomyRewardRepository(database); const receipts = new PrismaIdempotencyRepository(database); const requestHash = hashCommandPayload(input);
      const type = await repository.findPublishedRewardType(input.typeKey); if (!type) throw new ApplicationError("NOT_FOUND", "Опубликованный тип Reward не найден");
      assertProfile(await repository.findProfile(input.userId));
      const replay = await receipts.find("reward.issue", idempotencyKey);
      if (replay) { if (replay.actorId !== actor.userId || replay.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другого Reward"); const stored = await repository.findReward(replay.resultId, input.userId); if (!stored) throw new ApplicationError("NOT_FOUND", "VX Reward не найден"); return rewardView(stored, occurredAt); }
      const existing = await database.vXReward.findUnique({ where: { idempotencyKey } });
      if (existing) {
        const samePayload = existing.userId === input.userId && existing.rewardTypeId === type.id && existing.title === input.title && existing.description === input.description && (existing.amount?.toString() ?? undefined) === input.amount && (existing.currency ?? undefined) === input.currency;
        if (!samePayload) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другого Reward");
        const stored = await repository.findReward(existing.id, input.userId); return rewardView(stored!, occurredAt);
      }
      if (type.valueKind === "MONETARY" && (!input.amount || !input.currency)) throw new ApplicationError("VALIDATION", "Денежный Reward требует значение и валюту");
      if (type.valueKind === "NON_MONETARY" && !input.nonMonetaryValue) throw new ApplicationError("VALIDATION", "Неденежный Reward требует точное описание значения");
      const reward = await database.vXReward.create({ data: { userId: input.userId, rewardTypeId: type.id, userTaskId: input.userTaskId, submissionReviewId: input.submissionReviewId, status: "EXPECTED", title: input.title, description: input.description, amount: input.amount, currency: input.currency, nonMonetaryValue: input.nonMonetaryValue as never, validFrom: input.validFrom, validUntil: input.validUntil, idempotencyKey }, select: { id: true } });
      await database.rewardStatusHistory.create({ data: { rewardId: reward.id, fromStatus: null, toStatus: "EXPECTED", actorId: actor.userId, reason: "Reward создан по подтверждённому серверному основанию", occurredAt } });
      await createProductNotification(database, { userId: input.userId, type: "reward.created", title: "Создан VX Reward", body: input.title, relatedType: "REWARD", relatedId: reward.id, idempotencyKey: `reward-created:${reward.id}`, actorId: actor.userId, occurredAt, systemMessage: { key: "system.rewardCreated", params: { title: input.title } } });
      await receipts.create({ operation: "reward.issue", key: idempotencyKey, actorId: actor.userId, requestHash, resultType: "VXReward", resultId: reward.id, createdAt: occurredAt });
      const stored = await repository.findReward(reward.id, input.userId); return rewardView(stored!, occurredAt);
    });
  }

  transitionReward(actor: AuthenticatedPrincipal, rewardId: string, target: RewardStatus, reason: string, idempotencyKey: string) {
    requireEconomyWriter(actor); requireKey(idempotencyKey);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaEconomyRewardRepository(database); const receipts = new PrismaIdempotencyRepository(database);
      const requestHash = hashCommandPayload({ rewardId, target, reason }); const replay = await receipts.find("reward.transition", idempotencyKey);
      if (replay) { if (replay.actorId !== actor.userId || replay.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другого перехода"); const owner = await database.vXReward.findUnique({ where: { id: replay.resultId }, select: { userId: true } }); const stored = owner ? await repository.findReward(replay.resultId, owner.userId) : null; if (!stored) throw new ApplicationError("NOT_FOUND", "VX Reward не найден"); return rewardView(stored, occurredAt); }
      const reward = await database.vXReward.findUnique({ where: { id: rewardId } }); if (!reward) throw new ApplicationError("NOT_FOUND", "VX Reward не найден");
      try { assertTransition(rewardStateMachine, reward.status, target); } catch { throw new ApplicationError("CONFLICT", "Переход статуса Reward недоступен"); }
      if (["REJECTED", "CANCELLED", "EXPIRED"].includes(target) && reason.trim().length < 3) throw new ApplicationError("VALIDATION", "Для статуса требуется причина");
      await database.vXReward.update({ where: { id: reward.id }, data: { status: target } });
      await database.rewardStatusHistory.create({ data: { rewardId: reward.id, fromStatus: reward.status, toStatus: target, actorId: actor.userId, reason, occurredAt } });
      await createProductNotification(database, { userId: reward.userId, type: "reward.status", title: "Изменился статус VX Reward", body: `${reward.title}: ${target}. ${reason}`, relatedType: "REWARD", relatedId: reward.id, idempotencyKey: `reward-status:${reward.id}:${target}:${occurredAt.getTime()}`, actorId: actor.userId, occurredAt, systemMessage: { key: "system.rewardStatus", params: { title: reward.title, status: target, reason } } });
      await receipts.create({ operation: "reward.transition", key: idempotencyKey, actorId: actor.userId, requestHash, resultType: "VXReward", resultId: reward.id, createdAt: occurredAt });
      const stored = await repository.findReward(reward.id, reward.userId); return rewardView(stored!, occurredAt);
    });
  }

  claimReward(principal: AuthenticatedPrincipal, rewardId: string, idempotencyKey: string) {
    requireKey(idempotencyKey);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaEconomyRewardRepository(database); const receipts = new PrismaIdempotencyRepository(database);
      const requestHash = hashCommandPayload({ rewardId }); const replay = await receipts.find("reward.claim", idempotencyKey);
      if (replay) { if (replay.actorId !== principal.userId || replay.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другого Reward"); const stored = await repository.findReward(replay.resultId, principal.userId); if (!stored) throw new ApplicationError("NOT_FOUND", "VX Reward не найден"); return rewardView(stored, occurredAt); }
      const reward = await repository.findReward(rewardId, principal.userId); if (!reward) throw new ApplicationError("NOT_FOUND", "VX Reward не найден");
      const availability = rewardAvailability(reward, occurredAt); if (availability.availability !== "CLAIMABLE") throw new ApplicationError("CONFLICT", availability.availabilityReason);
      try { assertTransition(rewardStateMachine, reward.status, "PROVIDED"); } catch { throw new ApplicationError("CONFLICT", "Reward нельзя получить в текущем статусе"); }
      await database.vXReward.update({ where: { id: reward.id }, data: { status: "PROVIDED" } });
      await database.rewardStatusHistory.create({ data: { rewardId: reward.id, fromStatus: reward.status, toStatus: "PROVIDED", actorId: principal.userId, reason: "Пользователь получил доступный Reward", occurredAt } });
      await createProductNotification(database, { userId: principal.userId, type: "reward.provided", title: "VX Reward предоставлен", body: reward.title, relatedType: "REWARD", relatedId: reward.id, idempotencyKey: `reward-provided:${reward.id}`, actorId: principal.userId, occurredAt, systemMessage: { key: "system.rewardProvided", params: { title: reward.title } } });
      await receipts.create({ operation: "reward.claim", key: idempotencyKey, actorId: principal.userId, requestHash, resultType: "VXReward", resultId: reward.id, createdAt: occurredAt });
      const stored = await repository.findReward(reward.id, principal.userId); return rewardView(stored!, occurredAt);
    });
  }

  private async snapshot(userId: string, repository: PrismaEconomyRewardRepository): Promise<EconomySnapshotView> {
    const profile = await repository.findProfile(userId); assertProfile(profile); const now = new Date();
    const policies = await repository.listEffectivePolicies({ role: profile.productRole, marketId: profile.market.id, at: now });
    const totalsRaw = await repository.pointsTotals(userId);
    const trustSnapshot = await repository.findTrustSnapshot(userId);
    const definitionsRaw = await repository.listRankDefinitions({ role: profile.productRole, marketId: profile.market.id, at: now });
    const rankHistoryRaw = await repository.listUserRanks(userId);
    const confirmedTasks = await repository.countConfirmedTasks(userId);
    const rewardsRaw = await repository.listRewards(userId, 4);
    const totalRewards = await repository.countRewards(userId);
    const claimableRewards = await repository.countClaimableRewards(userId, now);
    const policy = selectPolicy(policies, profile); const points = totalsRaw[0]._sum.delta ?? 0; const pending = totalsRaw[1]._sum.delta ?? 0; const trust = trustSnapshot?.score ?? policy?.startingTrustScore ?? null;
    const definitions = selectRankDefinitions(definitionsRaw, profile); const totals = { points, trust, confirmedTasks }; const currentRecord = rankHistoryRaw[0] ?? null; const current = currentRecord ? rankView(currentRecord.rankDefinition, totals) : null; const currentIndex = current ? rankOrder.indexOf(current.code) : -1; const nextDefinition = definitions.find((item) => rankOrder.indexOf(item.code) > currentIndex) ?? null;
    const latest = rewardsRaw.map((item) => rewardView(item, now));
    return { configured: Boolean(policy), role: profile.productRole, market: { code: profile.market.code, name: profile.market.name }, points: { confirmedBalance: points, pendingBalance: pending }, trust: { score: trust, zone: trustZone(policy, trust), explanation: trust === null ? "Опубликованная конфигурация Trust Score отсутствует." : trustSnapshot ? "Значение рассчитано из неизменяемых событий." : "Показано стартовое значение действующей конфигурации." }, rank: { current, next: nextDefinition ? rankView(nextDefinition, totals) : null, history: rankHistoryRaw.map((item) => ({ id: item.id, code: item.rankDefinition.code, label: rankLabels[item.rankDefinition.code], version: item.rankDefinition.version, reason: item.reason, assignedAt: item.assignedAt.toISOString() })) }, rewards: { total: totalRewards, claimable: claimableRewards, latest }, calculatedAt: now.toISOString() };
  }

  private async appendPointsByRule(database: DatabaseClient, _repository: PrismaEconomyRewardRepository, policy: Policy, command: EconomyRuleCommand, rootKey: string, occurredAt: Date) {
    const rule = object(object(policy.pointsRules)[command.pointsRuleKey!]); const delta = number(rule.delta); if (delta === null || delta === 0 || rule.enabled === false) throw new ApplicationError("CONFLICT", "Правило VX Points недоступно");
    await database.vXPointsLedgerEntry.create({ data: { userId: command.userId, userTaskId: command.userTaskId, delta, status: "CONFIRMED", sourceType: command.sourceType, sourceId: command.sourceId, reason: command.reason, ruleVersion: `${policy.scopeKey}:${policy.version}:${command.pointsRuleKey}`, idempotencyKey: derivedKey("points", rootKey), occurredAt } });
  }

  private async appendTrustByRule(database: DatabaseClient, repository: PrismaEconomyRewardRepository, policy: Policy, command: EconomyRuleCommand, rootKey: string, occurredAt: Date) {
    const rule = object(object(policy.trustRules)[command.trustRuleKey!]); const delta = number(rule.delta); if (delta === null || delta === 0 || rule.enabled === false) throw new ApplicationError("CONFLICT", "Правило Trust Score недоступно");
    const current = (await repository.findTrustSnapshot(command.userId))?.score ?? policy.startingTrustScore; const after = clampScore(current + delta);
    const event = await database.trustScoreEvent.create({ data: { userId: command.userId, delta: after - current, scoreBefore: current, scoreAfter: after, eventType: command.trustRuleKey!, sourceType: command.sourceType, sourceId: command.sourceId, reason: command.reason, ruleVersion: `${policy.scopeKey}:${policy.version}:${command.trustRuleKey}`, isAppealable: rule.appealable === true, idempotencyKey: derivedKey("trust", rootKey), occurredAt } });
    await database.trustScoreSnapshot.upsert({ where: { userId: command.userId }, update: { score: after, lastEventId: event.id, calculatedAt: occurredAt }, create: { userId: command.userId, score: after, lastEventId: event.id, calculatedAt: occurredAt } });
  }

  private async promoteRank(database: DatabaseClient, repository: PrismaEconomyRewardRepository, profile: Profile, userId: string, idempotencyKey: string, occurredAt: Date) {
    const totalsRaw = await repository.pointsTotals(userId);
    const snapshot = await repository.findTrustSnapshot(userId);
    const definitionsRaw = await repository.listRankDefinitions({ role: profile.productRole, marketId: profile.market.id, at: occurredAt });
    const history = await repository.listUserRanks(userId);
    const confirmedTasks = await repository.countConfirmedTasks(userId);
    const totals = { points: totalsRaw[0]._sum.delta ?? 0, trust: snapshot?.score ?? selectPolicy(await repository.listEffectivePolicies({ role: profile.productRole, marketId: profile.market.id, at: occurredAt }), profile)?.startingTrustScore ?? null, confirmedTasks };
    const eligible = selectRankDefinitions(definitionsRaw, profile).filter((item) => criteria(item, totals).every((criterion) => criterion.completed)); const candidate = eligible.at(-1); if (!candidate) return;
    const current = history[0]; if (current && rankOrder.indexOf(current.rankDefinition.code) >= rankOrder.indexOf(candidate.code)) return;
    await database.userRank.create({ data: { userId, rankDefinitionId: candidate.id, previousRankId: current?.id, reason: "Выполнены опубликованные критерии ранга", idempotencyKey, assignedAt: occurredAt } });
  }
}
