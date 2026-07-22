import type { AuthorizationPolicy } from "@/lib/policies";
import type { AuthenticatedPrincipal } from "./types";

export interface AuthorizationResource {
  readonly type: string;
  readonly id: string;
  readonly ownerId: string | null;
}

export interface AuthorizationRequest {
  readonly principal: AuthenticatedPrincipal | null;
  readonly policy: AuthorizationPolicy;
  readonly resource?: AuthorizationResource | null;
}

export type AuthorizationReason =
  | "ALLOWED"
  | "AUTHENTICATION_REQUIRED"
  | "ROLE_REQUIRED"
  | "PERMISSION_REQUIRED"
  | "RESOURCE_REQUIRED"
  | "OWNERSHIP_REQUIRED"
  | "NO_POLICY_RULE_MATCHED"
  | "INVALID_POLICY";

export interface PolicyAuthorizationDecision {
  readonly allowed: boolean;
  readonly policyKey: string;
  readonly reason: AuthorizationReason;
}
