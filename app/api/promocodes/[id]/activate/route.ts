import { errorResponse, getPlatformOperationsService, json, limitRequest, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "promocode-activate", key: principal.userId, limit: 20, windowSeconds: 60 });
    const body = await readJsonBody(request);
    return json(await getPlatformOperationsService().activatePromocode(principal, (await context.params).id, String(body.idempotencyKey ?? "")));
  } catch (error) { return errorResponse(error); }
}
