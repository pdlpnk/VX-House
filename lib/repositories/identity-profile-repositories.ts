import "server-only";

import type {
  AccountStatus,
  LanguageCode,
  MarketCode,
  PartnerProfileStatus,
  ProductRole,
} from "@/lib/db/generated/client";
import type { DatabaseClient, Prisma } from "@/lib/db";

export const safeProfileSelect = {
  id: true,
  userId: true,
  productRole: true,
  preferredLanguage: true,
  contactVerificationStatus: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { email: true, displayName: true } },
  market: { select: { id: true, code: true, name: true, defaultLanguage: true, isActive: true } },
  playerProfile: { select: { id: true, participationStatus: true } },
  partnerProfile: { select: { id: true, status: true } },
} as const;

export type SafeProfileDTO = Prisma.UserProfileGetPayload<{ select: typeof safeProfileSelect }>;

export class PrismaIdentityUserRepository {
  constructor(private readonly database: DatabaseClient) {}

  findSafeById(userId: string) {
    return this.database.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, disabledAt: true, createdAt: true },
    });
  }

  findSafeByEmail(email: string) {
    return this.database.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, disabledAt: true, createdAt: true },
    });
  }

  create(input: { id: string; email: string; displayName: string; passwordHash: string; createdAt: Date }) {
    return this.database.user.create({
      data: { ...input, updatedAt: input.createdAt },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
  }
}

export class PrismaMarketRepository {
  constructor(private readonly database: DatabaseClient) {}

  listActive() {
    return this.database.market.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, defaultLanguage: true },
    });
  }

  findActiveByCode(code: MarketCode) {
    return this.database.market.findFirst({
      where: { code, isActive: true },
      select: { id: true, code: true, name: true, defaultLanguage: true },
    });
  }
}

export class PrismaUserProfileRepository {
  constructor(private readonly database: DatabaseClient) {}

  findByUserId(userId: string) {
    return this.database.userProfile.findUnique({ where: { userId }, select: safeProfileSelect });
  }

  create(input: {
    userId: string;
    productRole: ProductRole;
    marketId: string;
    preferredLanguage: LanguageCode;
    accountStatus?: AccountStatus;
  }) {
    return this.database.userProfile.create({ data: input, select: { id: true } });
  }

  updateLanguage(userId: string, preferredLanguage: LanguageCode) {
    return this.database.userProfile.update({
      where: { userId },
      data: { preferredLanguage },
      select: safeProfileSelect,
    });
  }

  changeMarket(userId: string, marketId: string) {
    return this.database.userProfile.update({
      where: { userId },
      data: { marketId },
      select: safeProfileSelect,
    });
  }

  markContactVerified(userId: string, verifiedAt: Date) {
    return this.database.userProfile.update({
      where: { userId },
      data: { contactVerificationStatus: "VERIFIED", contactVerifiedAt: verifiedAt },
      select: safeProfileSelect,
    });
  }

  setAccountStatus(userId: string, accountStatus: AccountStatus) {
    return this.database.userProfile.update({
      where: { userId },
      data: { accountStatus },
      select: safeProfileSelect,
    });
  }
}

export class PrismaPlayerProfileRepository {
  constructor(private readonly database: DatabaseClient) {}

  createPending(userProfileId: string) {
    return this.database.playerProfile.create({
      data: { userProfileId, participationStatus: "PENDING" },
      select: { id: true, participationStatus: true },
    });
  }
}

export class PrismaPartnerProfileRepository {
  constructor(private readonly database: DatabaseClient) {}

  createPending(userProfileId: string) {
    return this.database.partnerProfile.create({
      data: { userProfileId, status: "PENDING" satisfies PartnerProfileStatus },
      select: { id: true, status: true },
    });
  }
}

export class PrismaConsentDocumentRepository {
  constructor(private readonly database: DatabaseClient) {}

  listRequired() {
    return this.database.consentDocument.findMany({
      where: { isRequired: true },
      orderBy: { key: "asc" },
      select: { id: true, key: true, title: true },
    });
  }
}

export class PrismaConsentVersionRepository {
  constructor(private readonly database: DatabaseClient) {}

  listPublished(input: { marketId: string; language: LanguageCode; at: Date }) {
    return this.database.consentVersion.findMany({
      where: {
        marketId: input.marketId,
        language: input.language,
        publishedAt: { not: null, lte: input.at },
        effectiveFrom: { lte: input.at },
        OR: [{ retiredAt: null }, { retiredAt: { gt: input.at } }],
      },
      orderBy: [{ consentDocumentId: "asc" }, { version: "desc" }],
      select: {
        id: true,
        consentDocumentId: true,
        version: true,
        language: true,
        contentHash: true,
        publishedAt: true,
        effectiveFrom: true,
        consentDocument: { select: { key: true, title: true, isRequired: true } },
      },
    });
  }

  findPublishedById(input: { id: string; marketId: string; language: LanguageCode; at: Date }) {
    return this.database.consentVersion.findFirst({
      where: {
        id: input.id,
        marketId: input.marketId,
        language: input.language,
        publishedAt: { not: null, lte: input.at },
        effectiveFrom: { lte: input.at },
        OR: [{ retiredAt: null }, { retiredAt: { gt: input.at } }],
      },
      select: {
        id: true,
        consentDocumentId: true,
        version: true,
        language: true,
        consentDocument: { select: { key: true, title: true, isRequired: true } },
      },
    });
  }
}

export class PrismaUserConsentRepository {
  constructor(private readonly database: DatabaseClient) {}

  find(userId: string, consentVersionId: string) {
    return this.database.userConsent.findUnique({
      where: { userId_consentVersionId: { userId, consentVersionId } },
      select: { id: true, userId: true, consentVersionId: true, accepted: true, recordedAt: true },
    });
  }

  accept(input: { userId: string; consentVersionId: string; source: string; recordedAt: Date }) {
    return this.database.userConsent.create({
      data: { ...input, accepted: true },
      select: { id: true, userId: true, consentVersionId: true, accepted: true, recordedAt: true },
    });
  }

  listAcceptedVersionIds(userId: string, versionIds: readonly string[]) {
    return this.database.userConsent.findMany({
      where: { userId, consentVersionId: { in: [...versionIds] }, accepted: true, withdrawnAt: null },
      select: { consentVersionId: true },
    });
  }
}

export class PrismaIdempotencyRepository {
  constructor(private readonly database: DatabaseClient) {}

  find(operation: string, key: string) {
    return this.database.idempotencyRecord.findUnique({
      where: { operation_key: { operation, key } },
      select: { actorId: true, requestHash: true, resultType: true, resultId: true, createdAt: true },
    });
  }

  create(input: {
    operation: string;
    key: string;
    actorId: string;
    requestHash: string;
    resultType: string;
    resultId: string;
    createdAt: Date;
  }) {
    return this.database.idempotencyRecord.create({ data: input, select: { id: true } });
  }
}
