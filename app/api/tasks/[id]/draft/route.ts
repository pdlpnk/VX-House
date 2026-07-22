import { deriveNetworkIdentifier, errorResponse, getOpportunityTaskService, json, limitRequest, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request); const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "tasks.draft", key: `${principal.userId}:${deriveNetworkIdentifier(request)}`, limit: 60, windowSeconds: 3600 });
    const body = await readJsonBody(request);
    return json(await getOpportunityTaskService().saveDraft(principal, (await params).id, body.payload, String(body.idempotencyKey ?? "")));
  } catch (error) { return errorResponse(error); }
}
