import { errorResponse, getIdentitySystem, json, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server/identity-delivery";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ level: "info", context: { component: "onboarding-delivery" } });

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    const body = await readJsonBody(request);
    const result = await getIdentitySystem().onboarding.complete({
      principal,
      ageConfirmed: body.ageConfirmed === true,
      consentVersionIds: Array.isArray(body.consentVersionIds)
        ? body.consentVersionIds.filter((value): value is string => typeof value === "string")
        : [],
      idempotencyKey: String(body.idempotencyKey ?? request.headers.get("idempotency-key") ?? ""),
    });
    logger.info("redirect_started", {
      correlationId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
      userId: principal.userId,
      destination: result.redirectTo,
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
