import { errorResponse, getOpportunityTaskService, json, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireTrustedOrigin(request);
    const body = await readJsonBody(request);
    return json(await getOpportunityTaskService().completeTask(
      await requireRequestPrincipal(request),
      (await params).id,
      String(body.idempotencyKey ?? ""),
    ));
  } catch (error) {
    return errorResponse(error);
  }
}
