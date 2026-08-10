import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, limitRequest, readJsonBody, requireTrustedOrigin } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    await limitRequest({ namespace: "password-reset.complete.network", key: deriveNetworkIdentifier(request), limit: 20, windowSeconds: 900 });
    const body = await readJsonBody(request);
    const system = getIdentitySystem();
    const result = await system.passwordReset.complete({
      token: system.passwordResetCookies.read(request),
      password: typeof body.password === "string" ? body.password : "",
      passwordConfirmation: typeof body.passwordConfirmation === "string" ? body.passwordConfirmation : "",
    });
    return json({ ok: true }, { headers: { "set-cookie": result.setCookie } });
  } catch (error) {
    return errorResponse(error);
  }
}
