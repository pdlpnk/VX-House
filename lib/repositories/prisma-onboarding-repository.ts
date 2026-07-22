import "server-only";

import type { DatabaseClient } from "@/lib/db";
import type { OnboardingStatus } from "@/lib/db/generated/client";

export class PrismaOnboardingRepository {
  constructor(private readonly database: DatabaseClient) {}

  findByUserId(userId: string) {
    return this.database.onboardingProgress.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        status: true,
        ageConfirmedAt: true,
        profileReadyAt: true,
        completedAt: true,
        updatedAt: true,
      },
    });
  }

  create(userId: string, status: OnboardingStatus) {
    return this.database.onboardingProgress.create({
      data: { userId, status },
      select: { id: true, status: true },
    });
  }

  update(userId: string, data: {
    status: OnboardingStatus;
    ageConfirmedAt?: Date;
    profileReadyAt?: Date;
    completedAt?: Date;
  }) {
    return this.database.onboardingProgress.update({
      where: { userId },
      data,
      select: { id: true, status: true, completedAt: true },
    });
  }
}

export class PrismaEmailVerificationRepository {
  constructor(private readonly database: DatabaseClient) {}

  findLatest(userId: string) {
    return this.database.emailVerificationChallenge.findFirst({
      where: { userId, consumedAt: null, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        codeHash: true,
        attemptCount: true,
        maxAttempts: true,
        expiresAt: true,
        resendAvailableAt: true,
        createdAt: true,
      },
    });
  }

  countActive(userId: string, at: Date) {
    return this.database.emailVerificationChallenge.count({
      where: { userId, consumedAt: null, revokedAt: null, expiresAt: { gt: at } },
    });
  }

  create(input: {
    id: string;
    userId: string;
    codeHash: string;
    maxAttempts: number;
    expiresAt: Date;
    resendAvailableAt: Date;
    createdAt: Date;
  }) {
    return this.database.emailVerificationChallenge.create({ data: input, select: { id: true } });
  }

  revokeActive(userId: string, revokedAt: Date) {
    return this.database.emailVerificationChallenge.updateMany({
      where: { userId, consumedAt: null, revokedAt: null },
      data: { revokedAt },
    });
  }

  revokeById(id: string, revokedAt: Date) {
    return this.database.emailVerificationChallenge.updateMany({
      where: { id, consumedAt: null, revokedAt: null },
      data: { revokedAt },
    });
  }

  incrementAttempt(id: string) {
    return this.database.emailVerificationChallenge.update({
      where: { id },
      data: { attemptCount: { increment: 1 } },
      select: { attemptCount: true, maxAttempts: true },
    });
  }

  consume(id: string, userId: string, consumedAt: Date) {
    return this.database.emailVerificationChallenge.updateMany({
      where: { id, userId, consumedAt: null, revokedAt: null, expiresAt: { gt: consumedAt } },
      data: { consumedAt },
    });
  }
}
