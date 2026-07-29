import { SECURITY_EVENT_TYPES } from "@/lib/security";
import { errorResponse, getIdentitySystem, json, requireTrustedOrigin, securityServices } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const system = getIdentitySystem();
    const token = system.cookies.read(request);
    const current = await system.authentication.authenticate(token);
    const result = await system.authentication.logout(token);
    if (current.ok) {
      await securityServices().security.record({
        type: SECURITY_EVENT_TYPES.logout,
        actor: { type: "user", id: current.principal.userId, sessionId: current.principal.sessionId },
        target: { type: "session", id: current.principal.sessionId },
        metadata: { scope: "current_session" },
      });
    }
    return json({ ok: true, redirectTo: "/" }, { headers: { "set-cookie": result.setCookie } });
  } catch (error) {
    return errorResponse(error);
  }
}
