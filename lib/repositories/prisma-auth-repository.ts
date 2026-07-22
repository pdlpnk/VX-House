import "server-only";

import type { DatabaseClient } from "@/lib/db";
import type {
  AuthRepository,
  AuthenticationSessionRecord,
  AuthenticationUserRecord,
  CreateSessionInput,
  RotateSessionInput,
} from "./auth-repository";

const userAuthenticationSelect = {
  id: true,
  email: true,
  passwordHash: true,
  disabledAt: true,
  roles: {
    select: {
      key: true,
      permissions: { select: { key: true } },
    },
  },
} as const;

function mapUser(user: {
  id: string;
  email: string;
  passwordHash: string | null;
  disabledAt: Date | null;
  roles: readonly { key: string; permissions: readonly { key: string }[] }[];
}): AuthenticationUserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    disabledAt: user.disabledAt,
    roleKeys: user.roles.map((role) => role.key),
    permissionKeys: [...new Set(user.roles.flatMap((role) => role.permissions.map(({ key }) => key)))],
  };
}

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findUserByEmail(email: string) {
    const user = await this.database.user.findUnique({
      where: { email },
      select: userAuthenticationSelect,
    });
    return user ? mapUser(user) : null;
  }

  async createSession(input: CreateSessionInput) {
    const session = await this.database.session.create({
      data: input,
      select: { id: true, userId: true, expiresAt: true, absoluteExpiresAt: true, createdAt: true },
    });
    return {
      sessionId: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
      createdAt: session.createdAt,
    };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<AuthenticationSessionRecord | null> {
    const session = await this.database.session.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        absoluteExpiresAt: true,
        createdAt: true,
        refreshedAt: true,
        revokedAt: true,
        user: { select: userAuthenticationSelect },
      },
    });
    if (!session) return null;
    const user = mapUser(session.user);
    return {
      identity: {
        sessionId: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        absoluteExpiresAt: session.absoluteExpiresAt,
        createdAt: session.createdAt,
      },
      tokenHash: session.tokenHash,
      refreshedAt: session.refreshedAt,
      revokedAt: session.revokedAt,
      userDisabledAt: user.disabledAt,
      principal: {
        userId: user.id,
        sessionId: session.id,
        roleKeys: user.roleKeys,
        permissionKeys: user.permissionKeys,
      },
    };
  }

  async rotateSession(input: RotateSessionInput) {
    const result = await this.database.session.updateMany({
      where: {
        id: input.sessionId,
        tokenHash: input.currentTokenHash,
        revokedAt: null,
        expiresAt: { gt: input.refreshedAt },
        absoluteExpiresAt: { gt: input.refreshedAt },
      },
      data: {
        tokenHash: input.nextTokenHash,
        expiresAt: input.expiresAt,
        refreshedAt: input.refreshedAt,
        lastSeenAt: input.refreshedAt,
      },
    });
    return result.count === 1;
  }

  async revokeSession(tokenHash: string, revokedAt: Date) {
    await this.database.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });
  }

  async revokeUserSessions(userId: string, revokedAt: Date) {
    const result = await this.database.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
    return result.count;
  }
}
