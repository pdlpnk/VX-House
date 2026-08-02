import { errorResponse, getIdentitySystem, json, requireRequestPrincipal } from "@/lib/server/identity-delivery";

export async function GET(request: Request) {
  try {
    return json(await getIdentitySystem().onboarding.getSnapshot(await requireRequestPrincipal(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
