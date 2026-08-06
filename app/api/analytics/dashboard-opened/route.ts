import { shouldRecordDashboardRequest } from "@/lib/analytics";
import { errorResponse, json, limitRequest, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server/identity-delivery";
import { getAnalyticsSystem, scheduleAnalyticsDelivery } from "@/lib/server/analytics";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "analytics.dashboard", key: principal.userId, limit: 30, windowSeconds: 60 });
    if (!shouldRecordDashboardRequest(request.headers)) return json({ accepted: false }, { status: 202 });
    await getAnalyticsSystem().service.recordDashboardOpened(principal);
    scheduleAnalyticsDelivery();
    return json({ accepted: true }, { status: 202 });
  } catch (error) { return errorResponse(error); }
}
