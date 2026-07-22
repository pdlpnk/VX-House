-- Consent versions are market-specific. A concrete version is the unit of consent.
ALTER TABLE "ConsentVersion" ADD COLUMN "marketId" UUID NOT NULL;

DROP INDEX "ConsentVersion_consentDocumentId_version_language_key";
DROP INDEX "ConsentVersion_publishedAt_effectiveFrom_idx";

CREATE UNIQUE INDEX "ConsentVersion_consentDocumentId_marketId_version_language_key"
ON "ConsentVersion"("consentDocumentId", "marketId", "version", "language");

CREATE INDEX "ConsentVersion_marketId_language_publishedAt_effectiveFrom_idx"
ON "ConsentVersion"("marketId", "language", "publishedAt", "effectiveFrom");

ALTER TABLE "ConsentVersion"
ADD CONSTRAINT "ConsentVersion_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Durable idempotency receipts are written in the same transaction as mutations.
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "operation" VARCHAR(160) NOT NULL,
    "key" VARCHAR(160) NOT NULL,
    "actorId" UUID NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "resultType" VARCHAR(120) NOT NULL,
    "resultId" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdempotencyRecord_operation_key_key"
ON "IdempotencyRecord"("operation", "key");

CREATE INDEX "IdempotencyRecord_actorId_createdAt_idx"
ON "IdempotencyRecord"("actorId", "createdAt");

ALTER TABLE "IdempotencyRecord"
ADD CONSTRAINT "IdempotencyRecord_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "IdempotencyRecord"
ADD CONSTRAINT "IdempotencyRecord_request_hash_check"
CHECK ("requestHash" ~ '^[0-9a-f]{64}$');

-- Product role cannot be changed by an ordinary profile update.
CREATE OR REPLACE FUNCTION "prevent_user_profile_role_change"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."productRole" IS DISTINCT FROM OLD."productRole" THEN
        RAISE EXCEPTION 'UserProfile productRole is immutable';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "UserProfile_product_role_immutable"
BEFORE UPDATE OF "productRole" ON "UserProfile"
FOR EACH ROW
EXECUTE FUNCTION "prevent_user_profile_role_change"();

-- Role and subtype are validated at commit so parent and subtype can be created atomically.
CREATE OR REPLACE FUNCTION "enforce_user_profile_subtype"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    profile_id UUID;
    profile_role "ProductRole";
    player_count INTEGER;
    partner_count INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'UserProfile' THEN
        IF TG_OP = 'DELETE' THEN profile_id := OLD."id"; ELSE profile_id := NEW."id"; END IF;
    ELSE
        IF TG_OP = 'DELETE' THEN profile_id := OLD."userProfileId"; ELSE profile_id := NEW."userProfileId"; END IF;
    END IF;

    SELECT "productRole" INTO profile_role FROM "UserProfile" WHERE "id" = profile_id;
    IF profile_role IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(*) INTO player_count FROM "PlayerProfile" WHERE "userProfileId" = profile_id;
    SELECT COUNT(*) INTO partner_count FROM "PartnerProfile" WHERE "userProfileId" = profile_id;

    IF (profile_role = 'PLAYER' AND (player_count <> 1 OR partner_count <> 0))
       OR (profile_role = 'PARTNER' AND (partner_count <> 1 OR player_count <> 0)) THEN
        RAISE EXCEPTION 'UserProfile subtype does not match productRole';
    END IF;

    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "UserProfile_subtype_consistency"
AFTER INSERT OR UPDATE OR DELETE ON "UserProfile"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "enforce_user_profile_subtype"();

CREATE CONSTRAINT TRIGGER "PlayerProfile_subtype_consistency"
AFTER INSERT OR UPDATE OR DELETE ON "PlayerProfile"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "enforce_user_profile_subtype"();

CREATE CONSTRAINT TRIGGER "PartnerProfile_subtype_consistency"
AFTER INSERT OR UPDATE OR DELETE ON "PartnerProfile"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "enforce_user_profile_subtype"();

-- Consent history is immutable; withdrawal must be represented by a new future event/model.
CREATE TRIGGER "UserConsent_append_only"
BEFORE UPDATE OR DELETE ON "UserConsent"
FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
