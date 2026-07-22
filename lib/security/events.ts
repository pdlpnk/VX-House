import type { AuditActor, AuditMetadata, AuditTarget } from "@/lib/audit";

export const SECURITY_EVENT_TYPES = Object.freeze({
  loginSucceeded: "authentication.login.succeeded",
  loginFailed: "authentication.login.failed",
  logout: "authentication.logout",
  sessionRefreshed: "authentication.session.refreshed",
  sessionRevoked: "authentication.session.revoked",
  permissionDenied: "authorization.permission.denied",
  registrationCreated: "identity.registration.created",
  emailCodeRequested: "identity.email_verification.requested",
  emailVerificationSucceeded: "identity.email_verification.succeeded",
  emailVerificationFailed: "identity.email_verification.failed",
  onboardingCompleted: "identity.onboarding.completed",
} as const);

export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[keyof typeof SECURITY_EVENT_TYPES];

interface SecurityEventMetadataMap {
  "authentication.login.succeeded": Readonly<{ method: "password" }>;
  "authentication.login.failed": Readonly<{
    method: "password";
    reason: "invalid_credentials" | "account_disabled" | "rate_limited";
  }>;
  "authentication.logout": Readonly<{ scope: "current_session" | "all_sessions" }>;
  "authentication.session.refreshed": Readonly<{ rotated: true }>;
  "authentication.session.revoked": Readonly<{
    reason: "logout" | "expired" | "password_changed" | "administrator" | "security_response";
  }>;
  "authorization.permission.denied": Readonly<{
    policyKey: string;
    reason: string;
  }>;
  "identity.registration.created": Readonly<{ productRole: "PLAYER" | "PARTNER"; market: "TR" | "AZ" }>;
  "identity.email_verification.requested": Readonly<{ reason: "registration" | "resend" }>;
  "identity.email_verification.succeeded": Readonly<{ method: "email_code" }>;
  "identity.email_verification.failed": Readonly<{
    reason: "invalid" | "expired" | "attempts_exhausted";
  }>;
  "identity.onboarding.completed": Readonly<{
    productRole: "PLAYER" | "PARTNER";
    outcome: "completed" | "partner_approval_pending";
  }>;
}

type SecurityEventFor<TType extends SecurityEventType> = Readonly<{
  type: TType;
  actor: AuditActor;
  target: AuditTarget;
  metadata: SecurityEventMetadataMap[TType] & AuditMetadata;
}>;

export type SecurityEvent = {
  [TType in SecurityEventType]: SecurityEventFor<TType>;
}[SecurityEventType];
