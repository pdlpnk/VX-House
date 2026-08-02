import { ApplicationError } from "@/lib/application";
import { getDatabase } from "@/lib/db";
import { ProfileApplicationService } from "@/lib/services";
import { errorResponse, getIdentitySystem, json, readJsonBody, requireRequestPrincipal, requireTrustedOrigin } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const principal = await requireRequestPrincipal(request);
    return json({ profile: (await getIdentitySystem().onboarding.getSnapshot(principal)).profile });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    requireTrustedOrigin(request);
    const principal = await requireRequestPrincipal(request);
    const body = await readJsonBody(request);
    const preferredLanguage = String(body.preferredLanguage ?? "").toUpperCase();
    if (!["EN", "RU", "TR", "AZ"].includes(preferredLanguage)) {
      throw new ApplicationError("VALIDATION", "Некорректный язык интерфейса");
    }
    const profile = await new ProfileApplicationService(getDatabase()).updateLanguage({
      principal,
      preferredLanguage: preferredLanguage as "EN" | "RU" | "TR" | "AZ",
    });
    return json({ profile });
  } catch (error) {
    return errorResponse(error);
  }
}
