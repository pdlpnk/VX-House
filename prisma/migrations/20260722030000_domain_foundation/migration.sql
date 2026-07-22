-- CreateEnum
CREATE TYPE "ProductRole" AS ENUM ('PLAYER', 'PARTNER');

-- CreateEnum
CREATE TYPE "MarketCode" AS ENUM ('TR', 'AZ');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('RU', 'TR', 'AZ');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "PartnerProfileStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('TASK', 'INSTRUCTION', 'PROMOCODE', 'FORECAST', 'PERSONAL_CONDITION');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'PENDING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserTaskStatus" AS ENUM ('AVAILABLE', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_SUBMISSION', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'RESUBMISSION_REQUIRED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('CLARIFICATION_REQUIRED', 'RESUBMISSION_REQUIRED', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PointsEntryStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REVERSED');

-- CreateEnum
CREATE TYPE "RankCode" AS ENUM ('EXPLORER', 'NAVIGATOR', 'ATLAS', 'PRIME', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "RewardValueKind" AS ENUM ('MONETARY', 'NON_MONETARY');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('EXPECTED', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'AVAILABLE', 'PROVIDED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SupportConversationStatus" AS ENUM ('CREATED', 'ASSIGNED', 'WAITING_OPERATOR', 'WAITING_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportMessageAuthorType" AS ENUM ('USER', 'OPERATOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'UPHELD', 'PARTIALLY_UPHELD', 'DENIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ForecastPublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'SUPERSEDED', 'RETRACTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Market" (
    "id" UUID NOT NULL,
    "code" "MarketCode" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "defaultLanguage" "LanguageCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productRole" "ProductRole" NOT NULL,
    "marketId" UUID NOT NULL,
    "preferredLanguage" "LanguageCode" NOT NULL,
    "contactVerificationStatus" "ContactVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "contactVerifiedAt" TIMESTAMP(3),
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "accountStatusReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" UUID NOT NULL,
    "userProfileId" UUID NOT NULL,
    "participationStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerProfile" (
    "id" UUID NOT NULL,
    "userProfileId" UUID NOT NULL,
    "status" "PartnerProfileStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" VARCHAR(500),
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentDocument" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentVersion" (
    "id" UUID NOT NULL,
    "consentDocumentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "contentHash" VARCHAR(128) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "consentVersionId" UUID NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "source" VARCHAR(80) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerService" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "externalUrl" VARCHAR(2048),
    "transitionRule" TEXT,
    "legalNotice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerServiceMarket" (
    "partnerServiceId" UUID NOT NULL,
    "marketId" UUID NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "termsVersion" VARCHAR(80),
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),

    CONSTRAINT "PartnerServiceMarket_pkey" PRIMARY KEY ("partnerServiceId","marketId")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" UUID NOT NULL,
    "key" VARCHAR(140) NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "partnerServiceId" UUID,
    "instructionId" UUID,
    "forecastId" UUID,
    "nextStep" VARCHAR(500) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityAudience" (
    "opportunityId" UUID NOT NULL,
    "productRole" "ProductRole" NOT NULL,
    "marketId" UUID NOT NULL,

    CONSTRAINT "OpportunityAudience_pkey" PRIMARY KEY ("opportunityId","productRole","marketId")
);

-- CreateTable
CREATE TABLE "OpportunityEligibility" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "EligibilityStatus" NOT NULL,
    "reasonCode" VARCHAR(120) NOT NULL,
    "explanation" VARCHAR(500) NOT NULL,
    "policyVersion" VARCHAR(80) NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "OpportunityEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instruction" (
    "id" UUID NOT NULL,
    "key" VARCHAR(140) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructionVersion" (
    "id" UUID NOT NULL,
    "instructionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(240) NOT NULL,
    "summary" TEXT NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "contentHash" VARCHAR(128) NOT NULL,
    "createdById" UUID NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "supersedesId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructionStep" (
    "id" UUID NOT NULL,
    "instructionVersionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "warning" TEXT,
    "mediaReference" VARCHAR(500),

    CONSTRAINT "InstructionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructionAudience" (
    "instructionVersionId" UUID NOT NULL,
    "productRole" "ProductRole" NOT NULL,
    "marketId" UUID NOT NULL,

    CONSTRAINT "InstructionAudience_pkey" PRIMARY KEY ("instructionVersionId","productRole","marketId")
);

-- CreateTable
CREATE TABLE "TaskDefinition" (
    "id" UUID NOT NULL,
    "key" VARCHAR(140) NOT NULL,
    "opportunityId" UUID,
    "partnerServiceId" UUID,
    "responsibleManagerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskVersion" (
    "id" UUID NOT NULL,
    "taskDefinitionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(240) NOT NULL,
    "summary" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "limitations" JSONB NOT NULL,
    "resultRequirements" JSONB NOT NULL,
    "pointsRuleKey" VARCHAR(120),
    "possibleRewardDescription" TEXT,
    "instructionVersionId" UUID,
    "reviewWindowMinutes" INTEGER,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "completionDeadline" TIMESTAMP(3),
    "resubmissionPolicy" TEXT NOT NULL,
    "termsHash" VARCHAR(128) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskVersionAudience" (
    "taskVersionId" UUID NOT NULL,
    "productRole" "ProductRole" NOT NULL,
    "marketId" UUID NOT NULL,

    CONSTRAINT "TaskVersionAudience_pkey" PRIMARY KEY ("taskVersionId","productRole","marketId")
);

-- CreateTable
CREATE TABLE "UserTask" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskDefinitionId" UUID NOT NULL,
    "taskVersionId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "UserTaskStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assignmentKey" VARCHAR(160) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTaskStatusHistory" (
    "id" UUID NOT NULL,
    "userTaskId" UUID NOT NULL,
    "fromStatus" "UserTaskStatus",
    "toStatus" "UserTaskStatus" NOT NULL,
    "actorId" UUID,
    "reason" VARCHAR(500) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTaskStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" UUID NOT NULL,
    "userTaskId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVersion" (
    "id" UUID NOT NULL,
    "taskSubmissionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "contentHash" VARCHAR(128) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionReview" (
    "id" UUID NOT NULL,
    "submissionVersionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "reasonCode" VARCHAR(120) NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VXPointsLedgerEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userTaskId" UUID,
    "delta" INTEGER NOT NULL,
    "status" "PointsEntryStatus" NOT NULL,
    "sourceType" VARCHAR(100) NOT NULL,
    "sourceId" VARCHAR(160) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "ruleVersion" VARCHAR(80) NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "reversesEntryId" UUID,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VXPointsLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankDefinition" (
    "id" UUID NOT NULL,
    "code" "RankCode" NOT NULL,
    "scopeKey" VARCHAR(120) NOT NULL,
    "version" INTEGER NOT NULL,
    "productRole" "ProductRole",
    "marketId" UUID,
    "criteria" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRank" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rankDefinitionId" UUID NOT NULL,
    "previousRankId" UUID,
    "reason" VARCHAR(500) NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "assignedById" UUID,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "scoreBefore" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "sourceType" VARCHAR(100) NOT NULL,
    "sourceId" VARCHAR(160) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "ruleVersion" VARCHAR(80) NOT NULL,
    "isAppealable" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreSnapshot" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "lastEventId" UUID NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardType" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "valueKind" "RewardValueKind" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VXReward" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rewardTypeId" UUID NOT NULL,
    "userTaskId" UUID,
    "submissionReviewId" UUID,
    "status" "RewardStatus" NOT NULL DEFAULT 'EXPECTED',
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(19,4),
    "currency" CHAR(3),
    "nonMonetaryValue" JSONB,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "provisionDueAt" TIMESTAMP(3),
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VXReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardStatusHistory" (
    "id" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "fromStatus" "RewardStatus",
    "toStatus" "RewardStatus" NOT NULL,
    "actorId" UUID,
    "reason" VARCHAR(1000) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportConversation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'CREATED',
    "subject" VARCHAR(240) NOT NULL,
    "context" JSONB NOT NULL,
    "assignedToId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "authorType" "SupportMessageAuthorType" NOT NULL,
    "authorId" UUID,
    "bodyProtected" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportInternalNote" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "bodyProtected" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportStatusHistory" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "fromStatus" "SupportConversationStatus",
    "toStatus" "SupportConversationStatus" NOT NULL,
    "actorId" UUID,
    "reason" VARCHAR(500) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "conversationId" UUID,
    "submissionReviewId" UUID,
    "trustScoreEventId" UUID,
    "rewardId" UUID,
    "status" "AppealStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT NOT NULL,
    "decisionReason" TEXT,
    "reviewerId" UUID,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" UUID NOT NULL,
    "key" VARCHAR(140) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastVersion" (
    "id" UUID NOT NULL,
    "forecastId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "status" "ForecastPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL,
    "contentHash" VARCHAR(128) NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastAccessRule" (
    "id" UUID NOT NULL,
    "forecastVersionId" UUID NOT NULL,
    "productRole" "ProductRole" NOT NULL,
    "marketId" UUID NOT NULL,
    "minimumRank" "RankCode",
    "userId" UUID,
    "ruleVersion" VARCHAR(80) NOT NULL,

    CONSTRAINT "ForecastAccessRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promocode" (
    "id" UUID NOT NULL,
    "key" VARCHAR(140) NOT NULL,
    "partnerServiceId" UUID NOT NULL,
    "opportunityId" UUID,
    "marketId" UUID NOT NULL,
    "productRole" "ProductRole" NOT NULL,
    "codeProtected" JSONB NOT NULL,
    "codeFingerprint" VARCHAR(128) NOT NULL,
    "instructions" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promocode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(120) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    "relatedType" VARCHAR(100),
    "relatedId" VARCHAR(160),
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_productRole_marketId_accountStatus_idx" ON "UserProfile"("productRole", "marketId", "accountStatus");

-- CreateIndex
CREATE INDEX "UserProfile_contactVerificationStatus_idx" ON "UserProfile"("contactVerificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_userProfileId_key" ON "PlayerProfile"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProfile_userProfileId_key" ON "PartnerProfile"("userProfileId");

-- CreateIndex
CREATE INDEX "PartnerProfile_status_idx" ON "PartnerProfile"("status");

-- CreateIndex
CREATE INDEX "PartnerProfile_approvedById_idx" ON "PartnerProfile"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentDocument_key_key" ON "ConsentDocument"("key");

-- CreateIndex
CREATE INDEX "ConsentVersion_publishedAt_effectiveFrom_idx" ON "ConsentVersion"("publishedAt", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentVersion_consentDocumentId_version_language_key" ON "ConsentVersion"("consentDocumentId", "version", "language");

-- CreateIndex
CREATE INDEX "UserConsent_userId_recordedAt_idx" ON "UserConsent"("userId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_userId_consentVersionId_key" ON "UserConsent"("userId", "consentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerService_key_key" ON "PartnerService"("key");

-- CreateIndex
CREATE INDEX "PartnerServiceMarket_marketId_status_idx" ON "PartnerServiceMarket"("marketId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_key_key" ON "Opportunity"("key");

-- CreateIndex
CREATE INDEX "Opportunity_status_type_idx" ON "Opportunity"("status", "type");

-- CreateIndex
CREATE INDEX "Opportunity_partnerServiceId_status_idx" ON "Opportunity"("partnerServiceId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_instructionId_idx" ON "Opportunity"("instructionId");

-- CreateIndex
CREATE INDEX "Opportunity_forecastId_idx" ON "Opportunity"("forecastId");

-- CreateIndex
CREATE INDEX "OpportunityAudience_productRole_marketId_idx" ON "OpportunityAudience"("productRole", "marketId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityEligibility_idempotencyKey_key" ON "OpportunityEligibility"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OpportunityEligibility_userId_evaluatedAt_idx" ON "OpportunityEligibility"("userId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "OpportunityEligibility_opportunityId_status_evaluatedAt_idx" ON "OpportunityEligibility"("opportunityId", "status", "evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Instruction_key_key" ON "Instruction"("key");

-- CreateIndex
CREATE INDEX "InstructionVersion_status_publishedAt_idx" ON "InstructionVersion"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "InstructionVersion_createdById_idx" ON "InstructionVersion"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "InstructionVersion_instructionId_version_language_key" ON "InstructionVersion"("instructionId", "version", "language");

-- CreateIndex
CREATE UNIQUE INDEX "InstructionStep_instructionVersionId_position_key" ON "InstructionStep"("instructionVersionId", "position");

-- CreateIndex
CREATE INDEX "InstructionAudience_productRole_marketId_idx" ON "InstructionAudience"("productRole", "marketId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDefinition_key_key" ON "TaskDefinition"("key");

-- CreateIndex
CREATE INDEX "TaskDefinition_opportunityId_idx" ON "TaskDefinition"("opportunityId");

-- CreateIndex
CREATE INDEX "TaskDefinition_responsibleManagerId_idx" ON "TaskDefinition"("responsibleManagerId");

-- CreateIndex
CREATE INDEX "TaskVersion_status_publishedAt_idx" ON "TaskVersion"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "TaskVersion_instructionVersionId_idx" ON "TaskVersion"("instructionVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskVersion_taskDefinitionId_version_key" ON "TaskVersion"("taskDefinitionId", "version");

-- CreateIndex
CREATE INDEX "TaskVersionAudience_productRole_marketId_idx" ON "TaskVersionAudience"("productRole", "marketId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_assignmentKey_key" ON "UserTask"("assignmentKey");

-- CreateIndex
CREATE INDEX "UserTask_userId_status_createdAt_idx" ON "UserTask"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "UserTask_taskVersionId_idx" ON "UserTask"("taskVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_taskDefinitionId_attemptNumber_key" ON "UserTask"("userId", "taskDefinitionId", "attemptNumber");

-- CreateIndex
CREATE INDEX "UserTaskStatusHistory_userTaskId_occurredAt_idx" ON "UserTaskStatusHistory"("userTaskId", "occurredAt");

-- CreateIndex
CREATE INDEX "TaskSubmission_userTaskId_createdAt_idx" ON "TaskSubmission"("userTaskId", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionVersion_status_submittedAt_idx" ON "SubmissionVersion"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_taskSubmissionId_version_key" ON "SubmissionVersion"("taskSubmissionId", "version");

-- CreateIndex
CREATE INDEX "SubmissionReview_submissionVersionId_decidedAt_idx" ON "SubmissionReview"("submissionVersionId", "decidedAt");

-- CreateIndex
CREATE INDEX "SubmissionReview_reviewerId_decidedAt_idx" ON "SubmissionReview"("reviewerId", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VXPointsLedgerEntry_idempotencyKey_key" ON "VXPointsLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "VXPointsLedgerEntry_userId_occurredAt_idx" ON "VXPointsLedgerEntry"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "VXPointsLedgerEntry_sourceType_sourceId_idx" ON "VXPointsLedgerEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "VXPointsLedgerEntry_userTaskId_idx" ON "VXPointsLedgerEntry"("userTaskId");

-- CreateIndex
CREATE INDEX "RankDefinition_productRole_marketId_status_idx" ON "RankDefinition"("productRole", "marketId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RankDefinition_code_scopeKey_version_key" ON "RankDefinition"("code", "scopeKey", "version");

-- CreateIndex
CREATE UNIQUE INDEX "UserRank_idempotencyKey_key" ON "UserRank"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UserRank_userId_assignedAt_idx" ON "UserRank"("userId", "assignedAt");

-- CreateIndex
CREATE INDEX "UserRank_rankDefinitionId_idx" ON "UserRank"("rankDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScoreEvent_idempotencyKey_key" ON "TrustScoreEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TrustScoreEvent_userId_occurredAt_idx" ON "TrustScoreEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "TrustScoreEvent_sourceType_sourceId_idx" ON "TrustScoreEvent"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScoreSnapshot_userId_key" ON "TrustScoreSnapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScoreSnapshot_lastEventId_key" ON "TrustScoreSnapshot"("lastEventId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardType_key_key" ON "RewardType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "VXReward_idempotencyKey_key" ON "VXReward"("idempotencyKey");

-- CreateIndex
CREATE INDEX "VXReward_userId_status_createdAt_idx" ON "VXReward"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "VXReward_userTaskId_idx" ON "VXReward"("userTaskId");

-- CreateIndex
CREATE INDEX "VXReward_submissionReviewId_idx" ON "VXReward"("submissionReviewId");

-- CreateIndex
CREATE INDEX "RewardStatusHistory_rewardId_occurredAt_idx" ON "RewardStatusHistory"("rewardId", "occurredAt");

-- CreateIndex
CREATE INDEX "SupportConversation_userId_updatedAt_idx" ON "SupportConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportConversation_assignedToId_status_priority_idx" ON "SupportConversation"("assignedToId", "status", "priority");

-- CreateIndex
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportInternalNote_conversationId_createdAt_idx" ON "SupportInternalNote"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportStatusHistory_conversationId_occurredAt_idx" ON "SupportStatusHistory"("conversationId", "occurredAt");

-- CreateIndex
CREATE INDEX "Appeal_userId_status_createdAt_idx" ON "Appeal"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Appeal_reviewerId_status_idx" ON "Appeal"("reviewerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_key_key" ON "Forecast"("key");

-- CreateIndex
CREATE INDEX "ForecastVersion_status_validFrom_validUntil_idx" ON "ForecastVersion"("status", "validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastVersion_forecastId_version_language_key" ON "ForecastVersion"("forecastId", "version", "language");

-- CreateIndex
CREATE INDEX "ForecastAccessRule_productRole_marketId_minimumRank_idx" ON "ForecastAccessRule"("productRole", "marketId", "minimumRank");

-- CreateIndex
CREATE INDEX "ForecastAccessRule_userId_idx" ON "ForecastAccessRule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Promocode_key_key" ON "Promocode"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Promocode_codeFingerprint_key" ON "Promocode"("codeFingerprint");

-- CreateIndex
CREATE INDEX "Promocode_productRole_marketId_status_idx" ON "Promocode"("productRole", "marketId", "status");

-- CreateIndex
CREATE INDEX "Promocode_partnerServiceId_status_idx" ON "Promocode"("partnerServiceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_scheduledAt_status_idx" ON "Notification"("scheduledAt", "status");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentVersion" ADD CONSTRAINT "ConsentVersion_consentDocumentId_fkey" FOREIGN KEY ("consentDocumentId") REFERENCES "ConsentDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_consentVersionId_fkey" FOREIGN KEY ("consentVersionId") REFERENCES "ConsentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerServiceMarket" ADD CONSTRAINT "PartnerServiceMarket_partnerServiceId_fkey" FOREIGN KEY ("partnerServiceId") REFERENCES "PartnerService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerServiceMarket" ADD CONSTRAINT "PartnerServiceMarket_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_partnerServiceId_fkey" FOREIGN KEY ("partnerServiceId") REFERENCES "PartnerService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAudience" ADD CONSTRAINT "OpportunityAudience_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAudience" ADD CONSTRAINT "OpportunityAudience_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityEligibility" ADD CONSTRAINT "OpportunityEligibility_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityEligibility" ADD CONSTRAINT "OpportunityEligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionVersion" ADD CONSTRAINT "InstructionVersion_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionVersion" ADD CONSTRAINT "InstructionVersion_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "InstructionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionStep" ADD CONSTRAINT "InstructionStep_instructionVersionId_fkey" FOREIGN KEY ("instructionVersionId") REFERENCES "InstructionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionAudience" ADD CONSTRAINT "InstructionAudience_instructionVersionId_fkey" FOREIGN KEY ("instructionVersionId") REFERENCES "InstructionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionAudience" ADD CONSTRAINT "InstructionAudience_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_partnerServiceId_fkey" FOREIGN KEY ("partnerServiceId") REFERENCES "PartnerService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_responsibleManagerId_fkey" FOREIGN KEY ("responsibleManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskVersion" ADD CONSTRAINT "TaskVersion_taskDefinitionId_fkey" FOREIGN KEY ("taskDefinitionId") REFERENCES "TaskDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskVersion" ADD CONSTRAINT "TaskVersion_instructionVersionId_fkey" FOREIGN KEY ("instructionVersionId") REFERENCES "InstructionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskVersionAudience" ADD CONSTRAINT "TaskVersionAudience_taskVersionId_fkey" FOREIGN KEY ("taskVersionId") REFERENCES "TaskVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskVersionAudience" ADD CONSTRAINT "TaskVersionAudience_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_taskDefinitionId_fkey" FOREIGN KEY ("taskDefinitionId") REFERENCES "TaskDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_taskVersionId_fkey" FOREIGN KEY ("taskVersionId") REFERENCES "TaskVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTaskStatusHistory" ADD CONSTRAINT "UserTaskStatusHistory_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "UserTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "UserTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_taskSubmissionId_fkey" FOREIGN KEY ("taskSubmissionId") REFERENCES "TaskSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXPointsLedgerEntry" ADD CONSTRAINT "VXPointsLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXPointsLedgerEntry" ADD CONSTRAINT "VXPointsLedgerEntry_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "UserTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXPointsLedgerEntry" ADD CONSTRAINT "VXPointsLedgerEntry_reversesEntryId_fkey" FOREIGN KEY ("reversesEntryId") REFERENCES "VXPointsLedgerEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankDefinition" ADD CONSTRAINT "RankDefinition_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRank" ADD CONSTRAINT "UserRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRank" ADD CONSTRAINT "UserRank_rankDefinitionId_fkey" FOREIGN KEY ("rankDefinitionId") REFERENCES "RankDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRank" ADD CONSTRAINT "UserRank_previousRankId_fkey" FOREIGN KEY ("previousRankId") REFERENCES "UserRank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreEvent" ADD CONSTRAINT "TrustScoreEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreSnapshot" ADD CONSTRAINT "TrustScoreSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreSnapshot" ADD CONSTRAINT "TrustScoreSnapshot_lastEventId_fkey" FOREIGN KEY ("lastEventId") REFERENCES "TrustScoreEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXReward" ADD CONSTRAINT "VXReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXReward" ADD CONSTRAINT "VXReward_rewardTypeId_fkey" FOREIGN KEY ("rewardTypeId") REFERENCES "RewardType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXReward" ADD CONSTRAINT "VXReward_userTaskId_fkey" FOREIGN KEY ("userTaskId") REFERENCES "UserTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VXReward" ADD CONSTRAINT "VXReward_submissionReviewId_fkey" FOREIGN KEY ("submissionReviewId") REFERENCES "SubmissionReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardStatusHistory" ADD CONSTRAINT "RewardStatusHistory_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "VXReward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportInternalNote" ADD CONSTRAINT "SupportInternalNote_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportInternalNote" ADD CONSTRAINT "SupportInternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportStatusHistory" ADD CONSTRAINT "SupportStatusHistory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_submissionReviewId_fkey" FOREIGN KEY ("submissionReviewId") REFERENCES "SubmissionReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_trustScoreEventId_fkey" FOREIGN KEY ("trustScoreEventId") REFERENCES "TrustScoreEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "VXReward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastVersion" ADD CONSTRAINT "ForecastVersion_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAccessRule" ADD CONSTRAINT "ForecastAccessRule_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAccessRule" ADD CONSTRAINT "ForecastAccessRule_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_partnerServiceId_fkey" FOREIGN KEY ("partnerServiceId") REFERENCES "PartnerService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DomainIntegrityChecks
ALTER TABLE "ConsentVersion"
    ADD CONSTRAINT "ConsentVersion_version_positive_check" CHECK ("version" > 0);

ALTER TABLE "InstructionVersion"
    ADD CONSTRAINT "InstructionVersion_version_positive_check" CHECK ("version" > 0);

ALTER TABLE "InstructionStep"
    ADD CONSTRAINT "InstructionStep_position_non_negative_check" CHECK ("position" >= 0);

ALTER TABLE "TaskVersion"
    ADD CONSTRAINT "TaskVersion_version_positive_check" CHECK ("version" > 0),
    ADD CONSTRAINT "TaskVersion_review_window_positive_check" CHECK ("reviewWindowMinutes" IS NULL OR "reviewWindowMinutes" > 0),
    ADD CONSTRAINT "TaskVersion_availability_check" CHECK ("availableUntil" IS NULL OR "availableFrom" IS NULL OR "availableUntil" > "availableFrom");

ALTER TABLE "UserTask"
    ADD CONSTRAINT "UserTask_attempt_positive_check" CHECK ("attemptNumber" > 0);

ALTER TABLE "SubmissionVersion"
    ADD CONSTRAINT "SubmissionVersion_version_positive_check" CHECK ("version" > 0);

ALTER TABLE "VXPointsLedgerEntry"
    ADD CONSTRAINT "VXPointsLedgerEntry_delta_non_zero_check" CHECK ("delta" <> 0),
    ADD CONSTRAINT "VXPointsLedgerEntry_reversal_check" CHECK (
        ("status" = 'REVERSED' AND "reversesEntryId" IS NOT NULL)
        OR ("status" <> 'REVERSED' AND "reversesEntryId" IS NULL)
    );

ALTER TABLE "RankDefinition"
    ADD CONSTRAINT "RankDefinition_version_positive_check" CHECK ("version" > 0),
    ADD CONSTRAINT "RankDefinition_effective_window_check" CHECK ("effectiveUntil" IS NULL OR "effectiveFrom" IS NULL OR "effectiveUntil" > "effectiveFrom");

ALTER TABLE "TrustScoreEvent"
    ADD CONSTRAINT "TrustScoreEvent_score_range_check" CHECK (
        "scoreBefore" BETWEEN 0 AND 100
        AND "scoreAfter" BETWEEN 0 AND 100
        AND "scoreAfter" = "scoreBefore" + "delta"
    );

ALTER TABLE "TrustScoreSnapshot"
    ADD CONSTRAINT "TrustScoreSnapshot_score_range_check" CHECK ("score" BETWEEN 0 AND 100);

ALTER TABLE "VXReward"
    ADD CONSTRAINT "VXReward_money_currency_check" CHECK (
        ("amount" IS NULL AND "currency" IS NULL)
        OR ("amount" IS NOT NULL AND "currency" ~ '^[A-Z]{3}$')
    ),
    ADD CONSTRAINT "VXReward_validity_check" CHECK ("validUntil" IS NULL OR "validFrom" IS NULL OR "validUntil" > "validFrom");

ALTER TABLE "SupportMessage"
    ADD CONSTRAINT "SupportMessage_author_check" CHECK (
        ("authorType" = 'SYSTEM' AND "authorId" IS NULL)
        OR ("authorType" <> 'SYSTEM' AND "authorId" IS NOT NULL)
    );

ALTER TABLE "Appeal"
    ADD CONSTRAINT "Appeal_target_check" CHECK (
        num_nonnulls("submissionReviewId", "trustScoreEventId", "rewardId") >= 1
    );

ALTER TABLE "ForecastVersion"
    ADD CONSTRAINT "ForecastVersion_version_positive_check" CHECK ("version" > 0),
    ADD CONSTRAINT "ForecastVersion_validity_check" CHECK ("validUntil" > "validFrom");

ALTER TABLE "Promocode"
    ADD CONSTRAINT "Promocode_validity_check" CHECK ("validUntil" > "validFrom");

-- Accepted tasks must reference a version of the same task definition.
CREATE OR REPLACE FUNCTION "enforce_user_task_version_definition"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "TaskVersion"
        WHERE "id" = NEW."taskVersionId"
          AND "taskDefinitionId" = NEW."taskDefinitionId"
    ) THEN
        RAISE EXCEPTION 'UserTask taskVersionId does not belong to taskDefinitionId';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "UserTask_version_definition_consistency"
BEFORE INSERT OR UPDATE OF "taskVersionId", "taskDefinitionId" ON "UserTask"
FOR EACH ROW
EXECUTE FUNCTION "enforce_user_task_version_definition"();

-- AppendOnlyDomainHistory
CREATE OR REPLACE FUNCTION "prevent_domain_history_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION protect_append_only(table_name regclass)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"()',
        table_name::text || '_append_only',
        table_name
    );
END;
$$;

SELECT protect_append_only('"OpportunityEligibility"');
SELECT protect_append_only('"UserTaskStatusHistory"');
SELECT protect_append_only('"SubmissionReview"');
SELECT protect_append_only('"VXPointsLedgerEntry"');
SELECT protect_append_only('"UserRank"');
SELECT protect_append_only('"TrustScoreEvent"');
SELECT protect_append_only('"RewardStatusHistory"');
SELECT protect_append_only('"SupportMessage"');
SELECT protect_append_only('"SupportInternalNote"');
SELECT protect_append_only('"SupportStatusHistory"');

DROP FUNCTION protect_append_only(regclass);
