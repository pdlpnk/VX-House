import type { ProductRole } from "@/lib/db/generated/client";

export type WorkspaceAccessDecision =
  | { allowed: true }
  | { allowed: false; redirectTo: string; reason: "ONBOARDING_INCOMPLETE" | "PRODUCT_ROLE_MISMATCH" | "ACCOUNT_RESTRICTED" };

export function decideProductWorkspaceAccess(input: { requestedRole: ProductRole; actualRole: ProductRole; onboardingStatus: string; accountStatus: string; onboardingRedirectTo: string }): WorkspaceAccessDecision {
  if (["SUSPENDED", "CLOSED"].includes(input.accountStatus)) return { allowed: false, redirectTo: "/access?state=restricted", reason: "ACCOUNT_RESTRICTED" };
  if (input.onboardingRedirectTo.startsWith("/access")) return { allowed: false, redirectTo: input.onboardingRedirectTo, reason: "ONBOARDING_INCOMPLETE" };
  if (input.actualRole !== input.requestedRole) return { allowed: false, redirectTo: input.actualRole === "PLAYER" ? "/dashboard" : "/partner", reason: "PRODUCT_ROLE_MISMATCH" };
  return { allowed: true };
}
