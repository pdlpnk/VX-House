import { errorResponse, getIdentitySystem, json, requireRequestPrincipal } from "@/lib/server";

export async function GET(request: Request) {
  try {
    return json(await getIdentitySystem().onboarding.getSnapshot(await requireRequestPrincipal(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
