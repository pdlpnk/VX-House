import { errorResponse, getIdentitySystem, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const principal = await requireRequestPrincipal(request);
    const snapshot = await getIdentitySystem().onboarding.getSnapshot(principal);
    return json({ user: { id: principal.userId }, ...snapshot });
  } catch (error) {
    return errorResponse(error);
  }
}
