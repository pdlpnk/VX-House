import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, limitRequest, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    const body = await readJsonBody(request);
    await limitRequest({ namespace: "email.verify.user", key: principal.userId, limit: 10, windowSeconds: 900 });
    await limitRequest({ namespace: "email.verify.network", key: deriveNetworkIdentifier(request), limit: 40, windowSeconds: 900 });
    const result = await getIdentitySystem().onboarding.verifyEmail({
      principal,
      code: typeof body.code === "string" ? body.code : "",
    });
    return result.ok
      ? json({ ok: true, nextStep: "CONSENTS_PENDING" })
      : json({ error: result.code, message: result.code === "EXPIRED_CODE" ? "Срок действия кода истёк." : result.code === "ATTEMPTS_EXHAUSTED" ? "Лимит попыток исчерпан. Запросите новый код." : "Код не подошёл." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
