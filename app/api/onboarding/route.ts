import { errorResponse, getIdentitySystem, json, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server/identity-delivery";

export async function GET(request: Request) {
  try {
    return json(await getIdentitySystem().onboarding.getSnapshot(await requireRequestPrincipal(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    const body = await readJsonBody(request);
    return json(await getIdentitySystem().onboarding.configureProfile({
      principal,
      command: {
        productRole: body.productRole,
        marketCode: body.marketCode,
        preferredLanguage: body.preferredLanguage,
      },
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
