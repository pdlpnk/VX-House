import { SECURITY_EVENT_TYPES } from "@/lib/security";
import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, limitRequest, requireTrustedOrigin, securityServices } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    await limitRequest({ namespace: "session.refresh", key: deriveNetworkIdentifier(request), limit: 30, windowSeconds: 3600 });
    const system = getIdentitySystem();
    const result = await system.authentication.refresh(system.cookies.read(request));
    if (!result.ok) {
      return json({ error: result.code, message: "Сессия недействительна." }, { status: 401, headers: { "set-cookie": result.setCookie } });
    }
    await securityServices().security.record({
      type: SECURITY_EVENT_TYPES.sessionRefreshed,
      actor: { type: "user", id: result.authentication.principal.userId, sessionId: result.authentication.principal.sessionId },
      target: { type: "session", id: result.authentication.principal.sessionId },
      metadata: { rotated: true },
    });
    return json({ ok: true }, { headers: { "set-cookie": result.setCookie } });
  } catch (error) {
    return errorResponse(error);
  }
}
