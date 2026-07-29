import { errorResponse, getIdentitySystem, json, requireRequestPrincipal } from "@/lib/server/identity-delivery";

export async function GET(request: Request) {
  try {
    const principal = await requireRequestPrincipal(request);
    const snapshot = await getIdentitySystem().onboarding.getSnapshot(principal);
    return json({ ...snapshot, sessionUser: { id: principal.userId } });
  } catch (error) {
    return errorResponse(error);
  }
}
