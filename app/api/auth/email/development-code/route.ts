import { DevelopmentEmailProvider } from "@/lib/services";
import { errorResponse, getIdentitySystem, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const principal = await requireRequestPrincipal(request);
    const system = getIdentitySystem();
    if (system.config.runtime.environment !== "development" || !(system.emailProvider instanceof DevelopmentEmailProvider)) {
      return json({ error: "NOT_AVAILABLE" }, { status: 404 });
    }
    const code = system.emailProvider.readCode(principal.userId);
    return code ? json({ code }) : json({ error: "NOT_AVAILABLE" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}
