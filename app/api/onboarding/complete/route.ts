import { errorResponse, getIdentitySystem, json, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

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
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
