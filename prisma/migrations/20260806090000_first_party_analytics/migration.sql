-- First-party attribution, product funnel events and reliable conversion delivery.
CREATE TYPE "AnalyticsEventName" AS ENUM (
  'LANDING_VIEWED',
  'ACCESS_CLICKED',
  'REGISTRATION_STARTED',
  'EMAIL_CONFIRMED',
  'DASHBOARD_OPENED'
);

CREATE TYPE "ConversionDeliveryStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'RETRY',
  'DELIVERED',
  'SKIPPED',
  'EXHAUSTED'
);

CREATE TABLE "AnalyticsSession" (
  "id" UUID NOT NULL,
  "anonymousId" VARCHAR(64) NOT NULL,
  "userId" UUID,
  "keitaroSubId" VARCHAR(255),
  "firstTouch" JSONB NOT NULL,
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" UUID NOT NULL,
  "eventName" "AnalyticsEventName" NOT NULL,
  "analyticsSessionId" UUID,
  "userId" UUID,
  "authSessionId" UUID,
  "metadata" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotencyKey" VARCHAR(200) NOT NULL,
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversionDelivery" (
  "id" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "provider" VARCHAR(40) NOT NULL,
  "status" "ConversionDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "providerStatus" VARCHAR(80) NOT NULL,
  "transactionId" VARCHAR(200) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastErrorSafe" VARCHAR(500),
  "deliveredAt" TIMESTAMP(3),
  "providerTransactionId" VARCHAR(255),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConversionDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsSession_anonymousId_key" ON "AnalyticsSession"("anonymousId");
CREATE INDEX "AnalyticsSession_userId_createdAt_idx" ON "AnalyticsSession"("userId", "createdAt");
CREATE INDEX "AnalyticsSession_keitaroSubId_idx" ON "AnalyticsSession"("keitaroSubId");
CREATE INDEX "AnalyticsSession_createdAt_idx" ON "AnalyticsSession"("createdAt");

CREATE UNIQUE INDEX "AnalyticsEvent_idempotencyKey_key" ON "AnalyticsEvent"("idempotencyKey");
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");
CREATE INDEX "AnalyticsEvent_analyticsSessionId_occurredAt_idx" ON "AnalyticsEvent"("analyticsSessionId", "occurredAt");
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "AnalyticsEvent_authSessionId_eventName_idx" ON "AnalyticsEvent"("authSessionId", "eventName");

CREATE UNIQUE INDEX "ConversionDelivery_transactionId_key" ON "ConversionDelivery"("transactionId");
CREATE UNIQUE INDEX "ConversionDelivery_eventId_provider_key" ON "ConversionDelivery"("eventId", "provider");
CREATE INDEX "ConversionDelivery_status_nextAttemptAt_idx" ON "ConversionDelivery"("status", "nextAttemptAt");
CREATE INDEX "ConversionDelivery_createdAt_idx" ON "ConversionDelivery"("createdAt");

ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_analyticsSessionId_fkey"
  FOREIGN KEY ("analyticsSessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversionDelivery" ADD CONSTRAINT "ConversionDelivery_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "AnalyticsEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "AnalyticsEvent_append_only"
  BEFORE UPDATE OR DELETE ON "AnalyticsEvent"
  FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
