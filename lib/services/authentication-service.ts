import "server-only";

import type { SessionCookieManager } from "@/lib/auth/session-cookie";
import type { SessionTokenManager } from "@/lib/auth/session-token";
import type { AuthenticationResult } from "@/lib/auth/types";
import { verifyPassword } from "@/lib/auth/password";
import type { AuthRepository, AuthenticationSessionRecord } from "@/lib/repositories";

export interface AuthenticationServiceConfig {
  readonly sessionIdleTtlSeconds: number;
  readonly sessionAbsoluteTtlSeconds: number;
  readonly sessionRefreshAfterSeconds: number;
}

export type LoginResult =
  | Readonly<{
      ok: true;
      authentication: Extract<AuthenticationResult, { ok: true }>;
      setCookie: string;
    }>
  | Readonly<{ ok: false; code: "INVALID_CREDENTIALS" }>;

export type RefreshResult =
  | Readonly<{
      ok: true;
      authentication: Extract<AuthenticationResult, { ok: true }>;
      setCookie: string;
    }>
  | Readonly<{ ok: false; code: "INVALID_SESSION" | "SESSION_EXPIRED"; setCookie: string }>;

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

function earliest(left: Date, right: Date) {
  return left.getTime() <= right.getTime() ? left : right;
}

function isExpired(session: AuthenticationSessionRecord, now: Date) {
  return (
    session.revokedAt !== null ||
    session.identity.expiresAt.getTime() <= now.getTime() ||
    session.identity.absoluteExpiresAt.getTime() <= now.getTime()
  );
}

export class AuthenticationService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokens: SessionTokenManager,
    private readonly cookies: SessionCookieManager,
    private readonly config: AuthenticationServiceConfig,
  ) {}

  async login(input: { email: string; password: string; now?: Date }): Promise<LoginResult> {
    const now = input.now ?? new Date();
    const email = input.email.trim().toLocaleLowerCase("en-US");
    const user = email ? await this.repository.findUserByEmail(email) : null;
    const passwordMatches = await verifyPassword(input.password, user?.passwordHash);

    if (!user || !passwordMatches || user.disabledAt !== null) {
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    const token = await this.tokens.issue();
    const absoluteExpiresAt = addSeconds(now, this.config.sessionAbsoluteTtlSeconds);
    const expiresAt = earliest(addSeconds(now, this.config.sessionIdleTtlSeconds), absoluteExpiresAt);
    const identity = await this.repository.createSession({
      userId: user.id,
      tokenHash: token.hash,
      expiresAt,
      absoluteExpiresAt,
    });

    const authentication = {
      ok: true,
      session: identity,
      principal: {
        userId: user.id,
        sessionId: identity.sessionId,
        roleKeys: user.roleKeys,
        permissionKeys: user.permissionKeys,
      },
      refreshRecommended: false,
    } as const;

    return {
      ok: true,
      authentication,
      setCookie: this.cookies.create(token.value, this.config.sessionIdleTtlSeconds),
    };
  }

  async authenticate(tokenValue: string | null, now = new Date()): Promise<AuthenticationResult> {
    if (!tokenValue || !this.tokens.isValid(tokenValue)) {
      return { ok: false, code: "INVALID_SESSION" };
    }
    const tokenHash = await this.tokens.digest(tokenValue);
    const session = await this.repository.findSessionByTokenHash(tokenHash);
    if (!session) return { ok: false, code: "INVALID_SESSION" };

    if (isExpired(session, now)) {
      await this.repository.revokeSession(tokenHash, now);
      return { ok: false, code: "SESSION_EXPIRED" };
    }
    if (session.userDisabledAt !== null) {
      await this.repository.revokeSession(tokenHash, now);
      return { ok: false, code: "ACCESS_DENIED" };
    }

    const refreshReference = session.refreshedAt ?? session.identity.createdAt;
    const refreshRecommended =
      now.getTime() - refreshReference.getTime() >= this.config.sessionRefreshAfterSeconds * 1000;
    return {
      ok: true,
      principal: session.principal,
      session: session.identity,
      refreshRecommended,
    };
  }

  async refresh(tokenValue: string | null, now = new Date()): Promise<RefreshResult> {
    const clearCookie = this.cookies.clear();
    if (!tokenValue || !this.tokens.isValid(tokenValue)) {
      return { ok: false, code: "INVALID_SESSION", setCookie: clearCookie };
    }

    const currentTokenHash = await this.tokens.digest(tokenValue);
    const session = await this.repository.findSessionByTokenHash(currentTokenHash);
    if (!session) return { ok: false, code: "INVALID_SESSION", setCookie: clearCookie };

    if (isExpired(session, now) || session.userDisabledAt !== null) {
      await this.repository.revokeSession(currentTokenHash, now);
      return { ok: false, code: "SESSION_EXPIRED", setCookie: clearCookie };
    }

    const nextToken = await this.tokens.issue();
    const expiresAt = earliest(
      addSeconds(now, this.config.sessionIdleTtlSeconds),
      session.identity.absoluteExpiresAt,
    );
    const rotated = await this.repository.rotateSession({
      sessionId: session.identity.sessionId,
      currentTokenHash,
      nextTokenHash: nextToken.hash,
      expiresAt,
      refreshedAt: now,
    });
    if (!rotated) return { ok: false, code: "INVALID_SESSION", setCookie: clearCookie };

    const authentication = {
      ok: true,
      principal: session.principal,
      session: { ...session.identity, expiresAt },
      refreshRecommended: false,
    } as const;
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    return {
      ok: true,
      authentication,
      setCookie: this.cookies.create(nextToken.value, remainingSeconds),
    };
  }

  async logout(tokenValue: string | null, now = new Date()) {
    if (tokenValue && this.tokens.isValid(tokenValue)) {
      await this.repository.revokeSession(await this.tokens.digest(tokenValue), now);
    }
    return { setCookie: this.cookies.clear() } as const;
  }

  async logoutEverywhere(userId: string, now = new Date()) {
    return this.repository.revokeUserSessions(userId, now);
  }
}
