import { ApplicationError } from "@/lib/application";
import { validateClientAnalyticsCommand } from "@/lib/analytics";
import { deriveNetworkIdentifier, errorResponse, json, limitRequest, readJsonBody, requireTrustedOrigin } from "@/lib/server/identity-delivery";
import { getAnalyticsSystem, scheduleAnalyticsDelivery } from "@/lib/server/analytics";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > 8_192) throw new ApplicationError("VALIDATION", "Запрос слишком большой");
    await limitRequest({ namespace: "analytics.network", key: deriveNetworkIdentifier(request), limit: 120, windowSeconds: 60 });
    let command;
    try { command = validateClientAnalyticsCommand(await readJsonBody(request)); }
    catch { throw new ApplicationError("VALIDATION", "Некорректное событие аналитики"); }
    const analytics = getAnalyticsSystem();
    const result = await analytics.service.captureClientEvent({ anonymousId: analytics.cookies.read(request), command });
    scheduleAnalyticsDelivery();
    return json(
      { accepted: true, replayed: result.replayed },
      result.createdCookie ? { status: 202, headers: { "set-cookie": analytics.cookies.create(result.anonymousId) } } : { status: 202 },
    );
  } catch (error) { return errorResponse(error); }
}

