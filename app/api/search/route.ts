import { errorResponse, getPlatformOperationsService, json, limitRequest, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "global-search", key: principal.userId, limit: 60, windowSeconds: 60 });
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return json({ items: await getPlatformOperationsService().search(principal, query) });
  } catch (error) { return errorResponse(error); }
}
