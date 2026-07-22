-- Functional Integration Module 3: versioned economy policy.
-- Values remain configuration; this migration does not seed production rules.
CREATE TABLE "EconomyPolicy" (
    "id" UUID NOT NULL,
    "scopeKey" VARCHAR(120) NOT NULL,
    "version" INTEGER NOT NULL,
    "productRole" "ProductRole",
    "marketId" UUID,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "startingTrustScore" INTEGER NOT NULL,
    "pointsRules" JSONB NOT NULL,
    "trustRules" JSONB NOT NULL,
    "trustZones" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomyPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EconomyPolicy_startingTrustScore_check" CHECK ("startingTrustScore" BETWEEN 0 AND 100),
    CONSTRAINT "EconomyPolicy_version_positive_check" CHECK ("version" > 0)
);

CREATE UNIQUE INDEX "EconomyPolicy_scopeKey_version_key" ON "EconomyPolicy"("scopeKey", "version");
CREATE INDEX "EconomyPolicy_productRole_marketId_status_effectiveFrom_idx" ON "EconomyPolicy"("productRole", "marketId", "status", "effectiveFrom");

ALTER TABLE "EconomyPolicy"
    ADD CONSTRAINT "EconomyPolicy_marketId_fkey"
    FOREIGN KEY ("marketId") REFERENCES "Market"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- A published policy is immutable. Corrections are released as a new version.
CREATE OR REPLACE FUNCTION "prevent_published_economy_policy_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."status" = 'PUBLISHED' THEN
        RAISE EXCEPTION 'Published EconomyPolicy is immutable';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "EconomyPolicy_published_immutable"
BEFORE UPDATE OR DELETE ON "EconomyPolicy"
FOR EACH ROW EXECUTE FUNCTION "prevent_published_economy_policy_mutation"();
