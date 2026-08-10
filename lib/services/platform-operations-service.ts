import "server-only";

import { createHash } from "node:crypto";

import { ApplicationError, createTransactionalEventServices, hashCommandPayload, PrismaTransactionRunner } from "@/lib/application";
import type { AuthenticatedPrincipal } from "@/lib/auth";
import type { AesGcmDataProtector, EncryptedPayload } from "@/lib/data-protection";
import type { PrismaClient } from "@/lib/db";
import type { ActivityEventView, ForecastView, GlobalSearchResult, PromocodeView, WorkspaceSummary } from "@/lib/platform-operations";
import { PrismaPlatformOperationsRepository } from "@/lib/repositories";
import { createProductNotification } from "./product-notification";

const decoder = new TextDecoder();
const rankOrder = ["EXPLORER", "NAVIGATOR", "ATLAS", "PRIME", "SIGNATURE"] as const;
const idempotencyPattern = /^[A-Za-z0-9_.:-]{8,160}$/;
const rankLabels = { EXPLORER: "Исследователь", NAVIGATOR: "Навигатор", ATLAS: "Атлас", PRIME: "Прайм", SIGNATURE: "Сигнатура" } as const;

function content(value: unknown) {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    summary: typeof data.summary === "string" ? data.summary : "Актуальный аналитический материал VX House.",
    body: typeof data.body === "string" ? data.body : typeof data.content === "string" ? data.content : "Содержание опубликовано ответственным аналитиком.",
    context: Array.isArray(data.context) ? data.context.filter((item): item is string => typeof item === "string").slice(0, 12) : [],
  };
}

function assertProfile(profile: Awaited<ReturnType<PrismaPlatformOperationsRepository["findProfile"]>>) {
  if (!profile || !profile.market.isActive || (profile.productRole === "PLAYER" && profile.accountStatus !== "ACTIVE")) throw new ApplicationError("FORBIDDEN", "Профиль или рынок недоступен");
  return profile;
}

function rankAllows(current: string | null, minimum: string | null) {
  if (!minimum) return true;
  return current !== null && rankOrder.indexOf(current as typeof rankOrder[number]) >= rankOrder.indexOf(minimum as typeof rankOrder[number]);
}

export class PlatformOperationsService {
  private readonly transactions: PrismaTransactionRunner;
  constructor(private readonly database: PrismaClient, private readonly protector: AesGcmDataProtector) { this.transactions = new PrismaTransactionRunner(database); }

  async listForecasts(principal: AuthenticatedPrincipal): Promise<ForecastView[]> {
    const repository = new PrismaPlatformOperationsRepository(this.database);
    const profile = assertProfile(await repository.findProfile(principal.userId));
    if (profile.productRole === "PARTNER" && profile.partnerProfile?.status !== "ACTIVE") return [];
    const currentRank = (await repository.findCurrentRank(principal.userId))?.rankDefinition.code ?? null;
    const versions = await repository.listForecastVersions(new Date());
    const visible = versions.filter((version) => version.accessRules.some((rule) =>
      rule.productRole === profile.productRole && rule.marketId === profile.marketId && (!rule.userId || rule.userId === principal.userId) && rankAllows(currentRank, rule.minimumRank),
    ));
    const latest = new Map<string, typeof visible[number]>();
    for (const version of visible) if (!latest.has(version.forecastId)) latest.set(version.forecastId, version);
    return [...latest.values()].map((version) => {
      const value = content(version.content);
      const rule = version.accessRules.find((item) => item.productRole === profile.productRole && item.marketId === profile.marketId && (!item.userId || item.userId === principal.userId));
      return {
        id: version.forecast.id,
        key: version.forecast.key,
        title: version.forecast.title,
        author: version.forecast.author.displayName ?? version.forecast.author.email,
        version: version.version,
        language: version.language,
        status: "PUBLISHED",
        summary: value.summary,
        body: value.body,
        context: value.context,
        disclaimer: version.disclaimer,
        validFrom: version.validFrom.toISOString(),
        validUntil: version.validUntil.toISOString(),
        publishedAt: version.publishedAt?.toISOString() ?? null,
        accessReason: rule?.userId ? "Персональный доступ" : rule?.minimumRank ? `Доступ по рангу ${rule.minimumRank}` : "Доступ по роли и рынку",
      };
    });
  }

  async listPromocodes(principal: AuthenticatedPrincipal): Promise<PromocodeView[]> {
    const repository = new PrismaPlatformOperationsRepository(this.database);
    const profile = assertProfile(await repository.findProfile(principal.userId));
    if (profile.productRole === "PARTNER" && profile.partnerProfile?.status !== "ACTIVE") return [];
    const now = new Date();
    const rows = await repository.listPromocodes(principal.userId, profile.productRole, profile.marketId);
    return Promise.all(rows.map((row) => this.promocodeView(row, principal.userId, now)));
  }

  activatePromocode(principal: AuthenticatedPrincipal, id: string, idempotencyKey: string) {
    if (!idempotencyPattern.test(idempotencyKey)) throw new ApplicationError("VALIDATION", "Некорректный ключ идемпотентности");
    return this.transactions.run(async ({ database, occurredAt }) => {
      const repository = new PrismaPlatformOperationsRepository(database);
      const profile = assertProfile(await repository.findProfile(principal.userId));
      if (profile.productRole === "PARTNER" && profile.partnerProfile?.status !== "ACTIVE") throw new ApplicationError("FORBIDDEN", "Партнёрский доступ ещё не одобрен");
      const row = await repository.findPromocode(id, principal.userId);
      if (!row || row.status !== "PUBLISHED" || row.productRole !== profile.productRole || row.marketId !== profile.marketId || row.partnerService.status !== "ACTIVE" || !row.partnerService.markets.some((market) => market.marketId === profile.marketId && market.status === "ACTIVE")) throw new ApplicationError("NOT_FOUND", "Промокод не найден или недоступен");
      if (row.validFrom > occurredAt || row.validUntil <= occurredAt) throw new ApplicationError("CONFLICT", "Срок действия промокода не позволяет активацию");
      const requestHash = hashCommandPayload({ id });
      const receipt = await database.idempotencyRecord.findUnique({ where: { operation_key: { operation: "promocode.activate", key: idempotencyKey } } });
      if (receipt) {
        if (receipt.actorId !== principal.userId || receipt.requestHash !== requestHash) throw new ApplicationError("IDEMPOTENCY_CONFLICT", "Ключ уже использован для другой активации");
        const replay = await repository.findPromocode(id, principal.userId);
        return this.promocodeView(replay!, principal.userId, occurredAt);
      }
      let activation = row.activations[0];
      if (!activation) {
        activation = await database.promocodeActivation.create({ data: { promocodeId: id, userId: principal.userId, status: "ACTIVE", activatedAt: occurredAt, expiresAt: row.validUntil, idempotencyKey }, include: { history: true } });
        await database.promocodeActivationHistory.create({ data: { activationId: activation.id, fromStatus: null, toStatus: "ACTIVE", actorId: principal.userId, reason: "Пользователь активировал доступный промокод", occurredAt } });
      }
      await database.idempotencyRecord.create({ data: { operation: "promocode.activate", key: idempotencyKey, actorId: principal.userId, requestHash, resultType: "PromocodeActivation", resultId: activation.id, createdAt: occurredAt } });
      await createProductNotification(database, { userId: principal.userId, type: "promocode.activated", title: "Промокод активирован", body: `Код ${row.partnerService.name} доступен до указанного срока.`, relatedType: "PROMOCODE", relatedId: id, idempotencyKey: `promocode-activated:${activation.id}`, actorId: principal.userId, occurredAt, systemMessage: { key: "system.promocodeActivated", params: { partner: row.partnerService.name } } });
      await createTransactionalEventServices(database, occurredAt).audit.record({ actor: { type: "user", id: principal.userId, sessionId: principal.sessionId }, action: "promocode.activated", target: { type: "promocode", id }, metadata: { activationId: activation.id, market: profile.market.code, role: profile.productRole } });
      return this.promocodeView((await repository.findPromocode(id, principal.userId))!, principal.userId, occurredAt);
    });
  }

  async workspaceSummary(principal: AuthenticatedPrincipal): Promise<WorkspaceSummary> {
    const repository = new PrismaPlatformOperationsRepository(this.database);
    const profile = assertProfile(await repository.findProfile(principal.userId));
    const now = new Date();
    const counts = await repository.workspaceCounts(principal.userId, profile.productRole, profile.marketId, now);
    const forecasts = await this.listForecasts(principal);
    const recommended = await repository.findRecommendedOpportunity(principal.userId, profile.productRole, profile.marketId, now);
    const root = profile.productRole === "PARTNER" ? "/partner" : "/dashboard";
    return {
      memberSince: profile.createdAt.toISOString(),
      daysWithPlatform: Math.max(1, Math.floor((now.getTime() - profile.createdAt.getTime()) / 86_400_000) + 1),
      partnerStatus: profile.partnerProfile?.status ?? null,
      ...counts,
      availableForecasts: forecasts.length,
      recommended: recommended ? { title: recommended.title, href: `${root}/opportunities/${recommended.id}`, description: recommended.description } : null,
    };
  }

  async activity(principal: AuthenticatedPrincipal): Promise<ActivityEventView[]> {
    const repository = new PrismaPlatformOperationsRepository(this.database);
    const profile = assertProfile(await repository.findProfile(principal.userId));
    const root = profile.productRole === "PARTNER" ? "/partner" : "/dashboard";
    const [tasks, points, trust, ranks, rewards, support, notifications, promocodes] = await repository.listActivity(principal.userId);
    const events: ActivityEventView[] = [
      ...tasks.map((item) => ({ id: `task:${item.id}`, category: "TASK" as const, title: item.userTask.taskVersion.title, description: item.reason, status: item.toStatus, occurredAt: item.occurredAt.toISOString(), href: `${root}/tasks/${item.userTaskId}` })),
      ...points.map((item) => ({ id: `points:${item.id}`, category: "POINTS" as const, title: `${item.delta > 0 ? "+" : ""}${item.delta} VX Points`, description: item.reason, status: item.status, occurredAt: item.occurredAt.toISOString(), href: `${root}/economy/history` })),
      ...trust.map((item) => ({ id: `trust:${item.id}`, category: "TRUST" as const, title: `Trust Score: ${item.scoreBefore} → ${item.scoreAfter}`, description: item.reason, status: item.eventType, occurredAt: item.occurredAt.toISOString(), href: `${root}/economy/history` })),
      ...ranks.map((item) => ({ id: `rank:${item.id}`, category: "RANK" as const, title: `Ранг: ${rankLabels[item.rankDefinition.code]}`, description: item.reason, status: item.rankDefinition.code, occurredAt: item.assignedAt.toISOString(), href: `${root}/economy` })),
      ...rewards.map((item) => ({ id: `reward:${item.id}`, category: "REWARD" as const, title: item.reward.title, description: item.reason, status: item.toStatus, occurredAt: item.occurredAt.toISOString(), href: `${root}/rewards/${item.rewardId}` })),
      ...support.map((item) => ({ id: `support:${item.id}`, category: "SUPPORT" as const, title: item.conversation.subject, description: item.reason, status: item.toStatus, occurredAt: item.occurredAt.toISOString(), href: `${root}/support/${item.conversationId}` })),
      ...notifications.map((item) => ({ id: `notification:${item.id}`, category: "NOTIFICATION" as const, title: item.title, description: item.body, status: item.status, occurredAt: item.createdAt.toISOString(), href: null })),
      ...promocodes.map((item) => ({ id: `promocode:${item.id}`, category: "PROMOCODE" as const, title: `Промокод ${item.activation.promocode.partnerService.name}`, description: item.reason, status: item.toStatus, occurredAt: item.occurredAt.toISOString(), href: profile.productRole === "PARTNER" ? "/partner/materials" : "/dashboard" })),
    ];
    return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 60);
  }

  async search(principal: AuthenticatedPrincipal, rawTerm: string): Promise<GlobalSearchResult[]> {
    const term = rawTerm.trim().slice(0, 120);
    if (term.length < 2) return [];
    const repository = new PrismaPlatformOperationsRepository(this.database);
    const profile = assertProfile(await repository.findProfile(principal.userId));
    const root = profile.productRole === "PARTNER" ? "/partner" : "/dashboard";
    const [owned, forecasts, opportunities] = await Promise.all([
      repository.searchOwned(principal.userId, term),
      this.listForecasts(principal),
      this.database.opportunity.findMany({ where: {
        status: "PUBLISHED",
        audiences: { some: { productRole: profile.productRole, marketId: profile.marketId } },
        AND: [
          { OR: [{ title: { contains: term, mode: "insensitive" } }, { description: { contains: term, mode: "insensitive" } }] },
          { OR: [{ eligibility: { none: { userId: principal.userId } } }, { eligibility: { some: { userId: principal.userId, status: "ELIGIBLE", OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] } } }] },
        ],
      }, take: 8, orderBy: { publishedAt: "desc" } }),
    ]);
    const [tasks, rewards, support] = owned;
    return [
      ...opportunities.map((item) => ({ id: item.id, type: "OPPORTUNITY" as const, title: item.title, description: item.description, href: `${root}/opportunities/${item.id}` })),
      ...tasks.map((item) => ({ id: item.id, type: "TASK" as const, title: item.taskVersion.title, description: item.taskVersion.summary, href: `${root}/tasks/${item.id}` })),
      ...forecasts.filter((item) => `${item.title} ${item.summary} ${item.body}`.toLocaleLowerCase("ru").includes(term.toLocaleLowerCase("ru"))).slice(0, 8).map((item) => ({ id: item.id, type: "FORECAST" as const, title: item.title, description: item.summary, href: profile.productRole === "PARTNER" ? "/partner/forecasts" : "/dashboard" })),
      ...rewards.map((item) => ({ id: item.id, type: "REWARD" as const, title: item.title, description: item.description, href: `${root}/rewards/${item.id}` })),
      ...support.map((item) => ({ id: item.id, type: "SUPPORT" as const, title: item.subject, description: `Обращение · ${item.status}`, href: `${root}/support/${item.id}` })),
    ].slice(0, 24);
  }

  private async promocodeView(row: Awaited<ReturnType<PrismaPlatformOperationsRepository["findPromocode"]>> extends infer R ? NonNullable<R> : never, userId: string, now: Date): Promise<PromocodeView> {
    const activation = row.activations.find((item) => item.userId === userId) ?? null;
    const expired = row.validUntil <= now || activation?.status === "EXPIRED";
    let code: string | null = null;
    if (activation && !expired && activation.status === "ACTIVE") code = decoder.decode(await this.protector.decrypt(row.codeProtected as unknown as EncryptedPayload, { classification: "restricted", purpose: "promocode", resourceType: "Promocode", resourceId: row.id }));
    return {
      id: row.id,
      key: row.key,
      partner: row.partnerService.name,
      market: row.market.code,
      role: row.productRole,
      instructions: row.instructions,
      validFrom: row.validFrom.toISOString(),
      validUntil: row.validUntil.toISOString(),
      availability: expired ? "EXPIRED" : activation ? "ACTIVATED" : "AVAILABLE",
      code,
      activation: activation ? { id: activation.id, status: activation.status, activatedAt: activation.activatedAt.toISOString(), expiresAt: activation.expiresAt.toISOString() } : null,
    };
  }
}

export function promocodeFingerprint(code: string) { return createHash("sha256").update(code.trim().toLocaleUpperCase("en")).digest("hex"); }
