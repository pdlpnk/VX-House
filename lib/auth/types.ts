export interface AuthenticatedPrincipal {
  readonly userId: string;
  readonly sessionId: string;
  readonly roleKeys: readonly string[];
  readonly permissionKeys: readonly string[];
}

export interface SessionIdentity {
  readonly sessionId: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly createdAt: Date;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly reason?: string;
}

export type RouteAccessPolicy =
  | Readonly<{ kind: "public" }>
  | Readonly<{ kind: "authenticated" }>
  | Readonly<{ kind: "role"; roles: readonly string[] }>;

export type AuthenticationFailureCode =
  | "INVALID_CREDENTIALS"
  | "INVALID_SESSION"
  | "SESSION_EXPIRED"
  | "ACCESS_DENIED";

export type AuthenticationResult =
  | Readonly<{
      ok: true;
      principal: AuthenticatedPrincipal;
      session: SessionIdentity;
      refreshRecommended: boolean;
    }>
  | Readonly<{ ok: false; code: AuthenticationFailureCode }>;
