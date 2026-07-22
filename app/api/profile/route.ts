import { errorResponse, getIdentitySystem, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const principal = await requireRequestPrincipal(request);
    return json({ profile: (await getIdentitySystem().onboarding.getSnapshot(principal)).profile });
  } catch (error) {
    return errorResponse(error);
  }
}
