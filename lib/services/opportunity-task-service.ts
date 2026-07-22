import "server-only";

import { createHash } from "node:crypto";

import type { AuthenticatedPrincipal } from "@/lib/auth";
import { ApplicationError, createTransactionalEventServices, hashCommandPayload, PrismaTransactionRunner } from "@/lib/application";
import type { DatabaseClient, PrismaClient } from "@/lib/db";
import { assertTransition, taskStateMachine } from "@/lib/domain";
import type { OpportunityCatalogQuery, OpportunityView, TaskVersionView, UserTaskView } from "@/lib/opportunities/types";
import { PrismaIdempotencyRepository, PrismaOpportunityTaskRepository } from "@/lib/repositories";
import { createProductNotification } from "./product-notification";

const keyPattern = /^[A-Za-z0-9_.:-]{8,160}$/;

function requireKey(key: string) {
  if (!keyPattern.test(key)) throw new ApplicationError("VALIDATION", "Некорректный ключ идемпотентности");
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 40) : [];
}

function submissionPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { comment: "", reference: "" };
  const record = value as Record<string, unknown>;
  return { comment: typeof record.comment === "string" ? record.comment : "", reference: typeof record.reference === "string" ? record.reference : "" };
}

function instructionView(version: {
  id: string; version: number; title: string; summary: string; language: "RU" | "TR" | "AZ";
  sections: { id: string; position: number; title: string; body: string }[];
  steps: { id: string; position: number; title: string; body: string; isRequired: boolean; warning: string | null }[];
} | null | undefined) {
  if (!version) return null;
  return { id: version.id, version: version.version, title: version.title, summary: version.summary, language: version.language, sections: version.sections, steps: version.steps.map((step) => ({ id: step.id, position: step.position, title: step.title, body: step.body, required: step.isRequired, warning: step.warning })) };
}

function taskVersionView(version: {
  id: string; taskDefinitionId: string; version: number; title: string; summary: string; requirements: unknown; limitations: unknown; resultRequirements: unknown;
  reviewWindowMinutes: number | null; availableUntil: Date | null; completionDeadline: Date | null; resubmissionPolicy: string;
  instructionVersion: Parameters<typeof instructionView>[0];
}): TaskVersionView {
  return { id: version.id, definitionId: version.taskDefinitionId, version: version.version, title: version.title, summary: version.summary, requirements: stringList(version.requirements), limitations: stringList(version.limitations), resultRequirements: stringList(version.resultRequirements), reviewWindowMinutes: version.reviewWindowMinutes, availableUntil: version.availableUntil?.toISOString() ?? null, completionDeadline: version.completionDeadline?.toISOString() ?? null, resubmissionPolicy: version.resubmissionPolicy, instruction: instructionView(version.instructionVersion) };
}

function availability(record: { eligibility: { status: "ELIGIBLE" | "INELIGIBLE" | "PENDING" | "EXPIRED"; explanation: string; validUntil: Date | null }[] }, now: Date) {
  const current = record.eligibility[0];
  if (!current || (current.validUntil && current.validUntil <= now)) return { availability: "AVAILABLE" as const, reason: "Доступ подтверждён ролью, рынком и публикацией." };
  if (current.status === "ELIGIBLE") return { availability: "AVAILABLE" as const, reason: current.explanation };
  if (current.status === "PENDING") return { availability: "PENDING" as const, reason: current.explanation };
  return { availability: "UNAVAILABLE" as const, reason: current.explanation };
}

type OpportunityRecord = Awaited<ReturnType<PrismaOpportunityTaskRepository["listVisible"]>>[number];

function opportunityView(record: OpportunityRecord, role: "PLAYER" | "PARTNER", now: Date): OpportunityView {
  const audience = record.audiences[0];
  const access = availability(record, now);
  const taskVersion = record.taskDefinitions.flatMap((definition) => definition.versions).at(0);
  const standaloneInstruction = record.instruction?.versions[0];
  return { id: record.id, key: record.key, type: record.type, title: record.title, description: record.description, nextStep: access.availability === "AVAILABLE" ? record.nextStep : access.reason, role, market: { code: audience.market.code, name: audience.market.name }, availability: access.availability, availabilityReason: access.reason, task: taskVersion ? taskVersionView(taskVersion) : null, instruction: instructionView(standaloneInstruction) };
}

function assertActiveProfile(profile: Awaited<ReturnType<PrismaOpportunityTaskRepository["findProfile"]>>) {
  if (!profile || !profile.market.isActive) throw new ApplicationError("FORBIDDEN", "Профиль или рынок недоступен");
  if (profile.accountStatus !== "ACTIVE" && profile.productRole !== "PARTNER") throw new ApplicationError("FORBIDDEN", "Аккаунт не готов к заданиям");
  return profile;
}

export class OpportunityTaskApplicationService {
  private readonly transactions: PrismaTransactionRunner;
  constructor(private readonly database: PrismaClient) { this.transactions = new PrismaTransactionRunner(database); }

  async list(principal: AuthenticatedPrincipal, query: OpportunityCatalogQuery = {}) {
    const now = new Date();
    const repository = new PrismaOpportunityTaskRepository(this.database);
    const profile = assertActiveProfile(await repository.findProfile(principal.userId));
    const rows = await repository.listVisible({ userId: principal.userId, role: profile.productRole, marketId: profile.market.id, now, search: query.search, type: query.type });
    const items = rows.map((row) => opportunityView(row, profile.productRole, now));
    return query.availability ? items.filter((item) => item.availability === query.availability) : items;
  }

  async getOpportunity(principal: AuthenticatedPrincipal, id: string) {
    const now = new Date();
    const repository = new PrismaOpportunityTaskRepository(this.database);
    const profile = assertActiveProfile(await repository.findProfile(principal.userId));
    const row = await repository.findVisibleById({ id, userId: principal.userId, role: profile.productRole, marketId: profile.market.id, now });
    if (!row) throw new ApplicationError("NOT_FOUND", "Возможность не найдена или недоступна");
    return opportunityView(row as OpportunityRecord, profile.productRole, now);
  }

  accept(principal: AuthenticatedPrincipal, opportunityId: string, idempotencyKey: string) {
    requireKey(idempotencyKey);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaOpportunityTaskRepository(database);
      const replay = await repository.findAssignment(idempotencyKey);
      if (replay) {
        if (replay.userId !== principal.userId) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Команда принадлежит другому пользователю");
        return this.requireTask(principal, replay.id, repository);
      }
      const profile = assertActiveProfile(await repository.findProfile(principal.userId));
      const row = await repository.findVisibleById({ id: opportunityId, userId: principal.userId, role: profile.productRole, marketId: profile.market.id, now: occurredAt });
      if (!row) throw new ApplicationError("NOT_FOUND", "Возможность не найдена или недоступна");
      const view = opportunityView(row as OpportunityRecord, profile.productRole, occurredAt);
      if (view.availability !== "AVAILABLE" || !view.task) throw new ApplicationError("FORBIDDEN", "Задание сейчас недоступно");
      const current = await repository.findCurrentTask(principal.userId, view.task.definitionId);
      if (current) return this.requireTask(principal, current.id, repository);
      const attemptNumber = (await repository.countAttempts(principal.userId, view.task.definitionId)) + 1;
      const created = await database.userTask.create({ data: { userId: principal.userId, taskDefinitionId: view.task.definitionId, taskVersionId: view.task.id, attemptNumber, status: "ACCEPTED", assignmentKey: idempotencyKey, acceptedAt: occurredAt, expiresAt: view.task.completionDeadline ? new Date(view.task.completionDeadline) : null }, select: { id: true } });
      await database.userTaskStatusHistory.create({ data: { userTaskId: created.id, fromStatus: null, toStatus: "ACCEPTED", actorId: principal.userId, reason: "Пользователь принял опубликованную версию задания", occurredAt } });
      await createProductNotification(database, { userId: principal.userId, type: "task.accepted", title: "Задание принято", body: `Откройте инструкцию «${view.task.title}» и выполните следующий шаг.`, relatedType: "USER_TASK", relatedId: created.id, idempotencyKey: `task-accepted:${created.id}`, actorId: principal.userId, occurredAt });
      const { audit } = createTransactionalEventServices(database, occurredAt);
      await audit.record({ actor: { type: "user", id: principal.userId, sessionId: principal.sessionId }, action: "task.accepted", target: { type: "user-task", id: created.id }, metadata: { taskVersionId: view.task.id, instructionVersionId: view.task.instruction?.id ?? null } });
      return this.requireTask(principal, created.id, repository);
    });
  }

  getTask(principal: AuthenticatedPrincipal, id: string) { return this.requireTask(principal, id, new PrismaOpportunityTaskRepository(this.database)); }

  start(principal: AuthenticatedPrincipal, id: string) {
    return this.transition(principal, id, "IN_PROGRESS", "Пользователь начал выполнение задания");
  }

  saveDraft(principal: AuthenticatedPrincipal, id: string, payload: unknown, idempotencyKey: string) {
    requireKey(idempotencyKey);
    const normalized = this.validatePayload(payload, false);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaOpportunityTaskRepository(database);
      const task = await repository.findUserTask(id, principal.userId);
      if (!task) throw new ApplicationError("NOT_FOUND", "Задание не найдено");
      if (!["IN_PROGRESS", "AWAITING_SUBMISSION", "RESUBMISSION_REQUIRED"].includes(task.status)) throw new ApplicationError("CONFLICT", "Черновик недоступен в текущем статусе");
      const receipts = new PrismaIdempotencyRepository(database);
      const requestHash = hashCommandPayload({ id, normalized });
      const receipt = await receipts.find("task.draft.save", idempotencyKey);
      if (receipt) {
        if (receipt.actorId !== principal.userId || receipt.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другой версии");
        return this.requireTask(principal, id, repository);
      }
      const submission = task.submissions[0] ?? await database.taskSubmission.create({ data: { userTaskId: id }, include: { versions: true } });
      const version = submission.versions.length + 1;
      const created = await database.submissionVersion.create({ data: { taskSubmissionId: submission.id, version, status: "DRAFT", payload: normalized, contentHash: createHash("sha256").update(JSON.stringify(normalized)).digest("hex") }, select: { id: true } });
      if (task.status === "IN_PROGRESS" || task.status === "RESUBMISSION_REQUIRED") await this.updateStatus(database, task, "AWAITING_SUBMISSION", principal.userId, "Черновик результата сохранён", occurredAt);
      await receipts.create({ operation: "task.draft.save", key: idempotencyKey, actorId: principal.userId, requestHash, resultType: "SubmissionVersion", resultId: created.id, createdAt: occurredAt });
      return this.requireTask(principal, id, repository);
    });
  }

  submit(principal: AuthenticatedPrincipal, id: string, payload: unknown, idempotencyKey: string) {
    requireKey(idempotencyKey);
    const normalized = this.validatePayload(payload, true);
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaOpportunityTaskRepository(database);
      const task = await repository.findUserTask(id, principal.userId);
      if (!task) throw new ApplicationError("NOT_FOUND", "Задание не найдено");
      if (task.status !== "AWAITING_SUBMISSION") throw new ApplicationError("CONFLICT", "Отправка недоступна в текущем статусе");
      const receipts = new PrismaIdempotencyRepository(database);
      const requestHash = hashCommandPayload({ id, normalized });
      const receipt = await receipts.find("task.submission.submit", idempotencyKey);
      if (receipt) {
        if (receipt.actorId !== principal.userId || receipt.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другой отправки");
        return this.requireTask(principal, id, repository);
      }
      const submission = task.submissions[0] ?? await database.taskSubmission.create({ data: { userTaskId: id }, include: { versions: true } });
      const version = submission.versions.length + 1;
      const created = await database.submissionVersion.create({ data: { taskSubmissionId: submission.id, version, status: "SUBMITTED", payload: normalized, contentHash: createHash("sha256").update(JSON.stringify(normalized)).digest("hex"), submittedAt: occurredAt }, select: { id: true } });
      const submitted = await this.updateStatus(database, task, "SUBMITTED", principal.userId, "Результат отправлен отдельной версией", occurredAt);
      await this.updateStatus(database, submitted, "UNDER_REVIEW", null, "Результат поставлен в очередь проверки", occurredAt);
      await createProductNotification(database, { userId: principal.userId, type: "task.submitted", title: "Результат отправлен", body: "Результат сохранён и ожидает проверки.", relatedType: "USER_TASK", relatedId: id, idempotencyKey: `task-submitted:${created.id}`, actorId: principal.userId, occurredAt });
      const { audit } = createTransactionalEventServices(database, occurredAt);
      await audit.record({ actor: { type: "user", id: principal.userId, sessionId: principal.sessionId }, action: "task.submission.created", target: { type: "submission-version", id: created.id }, metadata: { userTaskId: id, version } });
      await receipts.create({ operation: "task.submission.submit", key: idempotencyKey, actorId: principal.userId, requestHash, resultType: "SubmissionVersion", resultId: created.id, createdAt: occurredAt });
      return this.requireTask(principal, id, repository);
    });
  }

  private async transition(principal: AuthenticatedPrincipal, id: string, target: UserTaskView["status"], reason: string) {
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaOpportunityTaskRepository(database);
      const task = await repository.findUserTask(id, principal.userId);
      if (!task) throw new ApplicationError("NOT_FOUND", "Задание не найдено");
      await this.updateStatus(database, task, target, principal.userId, reason, occurredAt);
      return this.requireTask(principal, id, repository);
    });
  }

  private async updateStatus(database: DatabaseClient, task: { id: string; status: UserTaskView["status"] }, target: UserTaskView["status"], actorId: string | null, reason: string, occurredAt: Date) {
    try { assertTransition(taskStateMachine, task.status, target); } catch { throw new ApplicationError("CONFLICT", "Переход статуса недоступен"); }
    const updated = await database.userTask.update({ where: { id: task.id }, data: { status: target, ...(target === "IN_PROGRESS" ? { startedAt: occurredAt } : {}) }, select: { id: true, status: true } });
    await database.userTaskStatusHistory.create({ data: { userTaskId: task.id, fromStatus: task.status, toStatus: target, actorId, reason, occurredAt } });
    return updated;
  }

  private validatePayload(payload: unknown, required: boolean) {
    const value = submissionPayload(payload);
    if (value.comment.length > 4000 || value.reference.length > 500) throw new ApplicationError("VALIDATION", "Результат превышает допустимый размер");
    if (required && value.comment.trim().length < 3 && value.reference.trim().length < 3) throw new ApplicationError("VALIDATION", "Добавьте комментарий или идентификатор результата");
    return { comment: value.comment.trim(), reference: value.reference.trim() };
  }

  private async requireTask(principal: AuthenticatedPrincipal, id: string, repository: PrismaOpportunityTaskRepository): Promise<UserTaskView> {
    const task = await repository.findUserTask(id, principal.userId);
    if (!task) throw new ApplicationError("NOT_FOUND", "Задание не найдено");
    const versions = task.submissions.flatMap((submission) => submission.versions);
    const latestReview = versions.flatMap((version) => version.reviews).sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime())[0] ?? null;
    return { id: task.id, status: task.status, attemptNumber: task.attemptNumber, acceptedAt: task.acceptedAt?.toISOString() ?? null, startedAt: task.startedAt?.toISOString() ?? null, task: taskVersionView(task.taskVersion), opportunityId: task.taskDefinition.opportunityId ?? "", submissions: versions.map((version) => ({ id: version.id, version: version.version, status: version.status, payload: submissionPayload(version.payload), createdAt: version.createdAt.toISOString(), submittedAt: version.submittedAt?.toISOString() ?? null })), history: task.statusHistory.map((item) => ({ id: item.id, fromStatus: item.fromStatus, toStatus: item.toStatus, reason: item.reason, occurredAt: item.occurredAt.toISOString() })), review: latestReview ? { decision: latestReview.decision, reason: latestReview.reason, comment: latestReview.comment, decidedAt: latestReview.decidedAt.toISOString() } : null };
  }
}
