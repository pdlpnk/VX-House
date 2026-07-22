import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SECURITY_EVENT_TYPES } from "@/lib/security";
import { decideProductWorkspaceAccess } from "@/lib/auth";
import { getIdentitySystem } from "./identity-onboarding";
import { securityServices } from "./identity-delivery";

async function currentAuthentication() {
  const requestHeaders = await headers();
  const request = new Request("http://vx-house.local/", { headers: requestHeaders });
  const system = getIdentitySystem();
  return system.authentication.authenticate(system.cookies.read(request));
}

export async function requireProductWorkspace(kind: "PLAYER" | "PARTNER", returnTo: string) {
  return (await requireProductWorkspaceContext(kind, returnTo)).profile;
}

export async function requireProductWorkspaceContext(kind: "PLAYER" | "PARTNER", returnTo: string) {
  const authentication = await currentAuthentication();
  if (!authentication.ok) redirect(`/access?mode=login&returnTo=${encodeURIComponent(returnTo)}`);
  const snapshot = await getIdentitySystem().onboarding.getSnapshot(authentication.principal);
  const decision = decideProductWorkspaceAccess({ requestedRole: kind, actualRole: snapshot.profile.productRole, onboardingStatus: snapshot.status, accountStatus: snapshot.profile.accountStatus, onboardingRedirectTo: snapshot.redirectTo });
  if (!decision.allowed) {
    await securityServices().security.record({
      type: SECURITY_EVENT_TYPES.permissionDenied,
      actor: { type: "user", id: authentication.principal.userId, sessionId: authentication.principal.sessionId },
      target: { type: "workspace", id: returnTo },
      metadata: { policyKey: `workspace.${kind.toLowerCase()}`, reason: decision.reason },
    });
    redirect(decision.redirectTo);
  }
  return { principal: authentication.principal, profile: snapshot.profile };
}

export async function requireAdminWorkspace() {
  const authentication = await currentAuthentication();
  if (!authentication.ok) redirect("/access?mode=login&returnTo=%2Fadmin");
  if (!authentication.principal.roleKeys.includes("admin")) {
    await securityServices().security.record({
      type: SECURITY_EVENT_TYPES.permissionDenied,
      actor: { type: "user", id: authentication.principal.userId, sessionId: authentication.principal.sessionId },
      target: { type: "workspace", id: "/admin" },
      metadata: { policyKey: "workspace.admin", reason: "INFRASTRUCTURE_ROLE_REQUIRED" },
    });
    redirect("/");
  }
  return authentication.principal;
}
