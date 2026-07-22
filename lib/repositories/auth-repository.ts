import type { AuthenticatedPrincipal, SessionIdentity } from "@/lib/auth/types";

export interface AuthenticationUserRecord {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string | null;
  readonly disabledAt: Date | null;
  readonly roleKeys: readonly string[];
  readonly permissionKeys: readonly string[];
}

export interface AuthenticationSessionRecord {
  readonly identity: SessionIdentity;
  readonly tokenHash: string;
  readonly revokedAt: Date | null;
  readonly refreshedAt: Date | null;
  readonly principal: AuthenticatedPrincipal;
  readonly userDisabledAt: Date | null;
}

export interface CreateSessionInput {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly absoluteExpiresAt: Date;
}

export interface RotateSessionInput {
  readonly sessionId: string;
  readonly currentTokenHash: string;
  readonly nextTokenHash: string;
  readonly expiresAt: Date;
  readonly refreshedAt: Date;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthenticationUserRecord | null>;
  createSession(input: CreateSessionInput): Promise<SessionIdentity>;
  findSessionByTokenHash(tokenHash: string): Promise<AuthenticationSessionRecord | null>;
  rotateSession(input: RotateSessionInput): Promise<boolean>;
  revokeSession(tokenHash: string, revokedAt: Date): Promise<void>;
  revokeUserSessions(userId: string, revokedAt: Date): Promise<number>;
}
