import { errorResponse, getOpportunityTaskService, json, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { requireTrustedOrigin(request); return json(await getOpportunityTaskService().start(await requireRequestPrincipal(request), (await params).id)); }
  catch (error) { return errorResponse(error); }
}
