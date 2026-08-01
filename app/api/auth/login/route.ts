import { ApplicationError } from "@/lib/application";
import { deriveNetworkIdentifier, errorResponse, getIdentitySystem, json, normalizedIdentifier, readJsonBody, recordLoginEvent, requireTrustedOrigin, securityServices } from "@/lib/server/identity-delivery";

export async function POST(request: Request) {
  try {
    requireTrustedOrigin(request);
    const body = await readJsonBody(request);
    const email = normalizedIdentifier(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const key = { identifier: email || "invalid", network: deriveNetworkIdentifier(request) };
    const bruteForce = securityServices().infrastructure.bruteForce;
    const assessment = await bruteForce.assess(key);
    if (!assessment.allowed) {
      await recordLoginEvent({ succeeded: false, reason: "rate_limited" });
      throw new ApplicationError("RATE_LIMITED", "Слишком много попыток входа. Повторите позже.", {
        retryAfterSeconds: String(assessment.retryAfterSeconds),
      });
    }
    const identity = getIdentitySystem();
    await identity.onboarding.purgeExpiredUnverifiedAccounts();
    const result = await identity.authentication.login({ email, password });
    if (!result.ok) {
      const failure = await bruteForce.registerFailure(key);
      await recordLoginEvent({ succeeded: false, reason: "invalid_credentials" });
      if (!failure.allowed) {
        throw new ApplicationError("RATE_LIMITED", "Слишком много попыток входа. Повторите позже.", {
          retryAfterSeconds: String(failure.retryAfterSeconds),
        });
      }
      return json({ error: "INVALID_CREDENTIALS", message: "Неверная электронная почта или пароль." }, { status: 401 });
    }
    await bruteForce.registerSuccess(key);
    await recordLoginEvent({ principal: result.authentication.principal, succeeded: true });
    if (result.authentication.principal.roleKeys.includes("admin")) {
      return json(
        { user: { id: result.authentication.principal.userId }, profile: null, redirectTo: "/admin" },
        { headers: { "set-cookie": result.setCookie } },
      );
    }
    const snapshot = await identity.onboarding.getSnapshot(result.authentication.principal);
    return json(
      { user: { id: result.authentication.principal.userId }, profile: snapshot.profile, redirectTo: snapshot.redirectTo },
      { headers: { "set-cookie": result.setCookie } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
