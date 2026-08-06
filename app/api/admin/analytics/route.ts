import { errorResponse, json, requireAdminRequestPrincipal } from "@/lib/server/identity-delivery";
import { getAnalyticsSystem } from "@/lib/server/analytics";

export async function GET(request: Request) {
  try {
    await requireAdminRequestPrincipal(request);
    const url = new URL(request.url);
    const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : new Date();
    const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : new Date(to.getTime() - 30 * 86_400_000);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to || to.getTime() - from.getTime() > 366 * 86_400_000) {
      return json({ error: "VALIDATION", message: "Некорректный период" }, { status: 400 });
    }
    return json(await getAnalyticsSystem().service.funnel(from, to));
  } catch (error) { return errorResponse(error); }
}

