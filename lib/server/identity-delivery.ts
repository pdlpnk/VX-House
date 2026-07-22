import "server-only";

import type { AuthenticatedPrincipal } from "@/lib/auth";
import { hasTrustedRequestOrigin, normalizeEmail } from "@/lib/auth";
import { ApplicationError } from "@/lib/application";
import { getServerConfig } from "@/lib/config";
import { getDatabase } from "@/lib/db";
import { PrismaAuditRepository } from "@/lib/repositories";
import { SECURITY_EVENT_TYPES } from "@/lib/security";
import { AuditService, PermissionEvaluationService, SecurityEventService } from "@/lib/services";
import { createLogger } from "@/lib/logger";
import { createSecurityInfrastructure } from "./security-infrastructure";
import { getIdentitySystem } from "./identity-onboarding";

const JSON_LIMIT = 16_384;

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > JSON_LIMIT) throw new ApplicationError("VALIDATION", "Запрос слишком большой");
  const text = await request.text();
  if (text.length > JSON_LIMIT) throw new ApplicationError("VALIDATION", "Запрос слишком большой");
  try {
    const value: unknown = JSON.parse(text || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ApplicationError("VALIDATION", "Некорректный формат запроса");
  }
}

export function requireTrustedOrigin(request: Request) {
  if (!hasTrustedRequestOrigin(request)) {
    throw new ApplicationError("FORBIDDEN", "Источник запроса не подтверждён");
  }
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...init.headers },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApplicationError) {
    const status = error.code === "AUTHENTICATION_REQUIRED" ? 401 : error.code === "RATE_LIMITED" ? 429 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" || error.code === "IDEMPOTENCY_CONFLICT" ? 409 : 400;
    return json(
      { error: error.code, message: error.message, details: error.details },
      { status, headers: error.details?.retryAfterSeconds ? { "retry-after": error.details.retryAfterSeconds } : undefined },
    );
  }
  createLogger({ level: "error", context: { component: "identity-delivery" } }).error("Identity delivery failed", { error });
  return json({ error: "SERVER_ERROR", message: "Не удалось выполнить операцию. Повторите позже." }, { status: 500 });
}

export function deriveNetworkIdentifier(request: Request) {
  const trusted = getServerConfig().security.network.trustProxyHeaders;
  if (trusted) {
    const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim();
    if (cloudflareAddress && cloudflareAddress.length <= 64) return `trusted:${cloudflareAddress}`;
  }
  return "unattributed-network";
}

export async function requireRequestPrincipal(request: Request): Promise<AuthenticatedPrincipal> {
  const system = getIdentitySystem();
  const authentication = await system.authentication.authenticate(system.cookies.read(request));
  if (!authentication.ok) throw new ApplicationError("AUTHENTICATION_REQUIRED", "Требуется вход в VX House");
  return authentication.principal;
}

export async function requireAdminRequestPrincipal(request: Request): Promise<AuthenticatedPrincipal> {
  const principal = await requireRequestPrincipal(request);
  if (!principal.roleKeys.includes("admin")) throw new ApplicationError("FORBIDDEN", "Требуется административная роль");
  return principal;
}

export function securityServices() {
  const audit = new AuditService(new PrismaAuditRepository(getDatabase()));
  return {
    audit,
    security: new SecurityEventService(audit),
    infrastructure: createSecurityInfrastructure(new PermissionEvaluationService()),
  };
}

export async function limitRequest(input: {
  namespace: string;
  key: string;
  limit: number;
  windowSeconds: number;
}) {
  const decision = await securityServices().infrastructure.rateLimits.consume(
    input.namespace,
    input.key,
    { limit: input.limit, windowSeconds: input.windowSeconds },
  );
  if (!decision.allowed) {
    throw new ApplicationError("RATE_LIMITED", "Слишком много попыток. Повторите позже.", {
      retryAfterSeconds: String(decision.retryAfterSeconds),
    });
  }
  return decision;
}

export async function recordLoginEvent(input: {
  principal?: AuthenticatedPrincipal;
  succeeded: boolean;
  reason?: "invalid_credentials" | "account_disabled" | "rate_limited";
}) {
  const actor = input.principal
    ? { type: "user" as const, id: input.principal.userId, sessionId: input.principal.sessionId }
    : { type: "anonymous" as const };
  await securityServices().security.record(
    input.succeeded
      ? {
          type: SECURITY_EVENT_TYPES.loginSucceeded,
          actor,
          target: { type: "authentication" },
          metadata: { method: "password" },
        }
      : {
          type: SECURITY_EVENT_TYPES.loginFailed,
          actor,
          target: { type: "authentication" },
          metadata: { method: "password", reason: input.reason ?? "invalid_credentials" },
        },
  );
}

export function normalizedIdentifier(value: unknown) {
  return normalizeEmail(typeof value === "string" ? value : "");
}
