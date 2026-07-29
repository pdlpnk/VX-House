import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, limitRequest, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    await limitRequest({ namespace: "email.request.user", key: principal.userId, limit: 5, windowSeconds: 3600 });
    await limitRequest({ namespace: "email.request.network", key: deriveNetworkIdentifier(request), limit: 20, windowSeconds: 3600 });
    const result = await getIdentitySystem().onboarding.requestVerificationCode({ principal });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
