import { deriveNetworkIdentifier, errorResponse, getOpportunityTaskService, json, limitRequest, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "tasks.accept", key: `${principal.userId}:${deriveNetworkIdentifier(request)}`, limit: 20, windowSeconds: 3600 });
    const body = await readJsonBody(request);
    return json(await getOpportunityTaskService().accept(principal, (await params).id, String(body.idempotencyKey ?? request.headers.get("idempotency-key") ?? "")), { status: 201 });
  } catch (error) { return errorResponse(error); }
}
