-- Functional Integration Module 2: instruction sections and one append-only
-- submission aggregate per user task.
CREATE TABLE "InstructionSection" (
    "id" UUID NOT NULL,
    "instructionVersionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "body" TEXT NOT NULL,
    CONSTRAINT "InstructionSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstructionSection_instructionVersionId_position_key"
    ON "InstructionSection"("instructionVersionId", "position");

CREATE UNIQUE INDEX "TaskSubmission_userTaskId_key"
    ON "TaskSubmission"("userTaskId");

ALTER TABLE "InstructionSection"
    ADD CONSTRAINT "InstructionSection_instructionVersionId_fkey"
    FOREIGN KEY ("instructionVersionId") REFERENCES "InstructionVersion"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstructionSection"
    ADD CONSTRAINT "InstructionSection_position_positive_check" CHECK ("position" > 0);

CREATE TRIGGER "InstructionSection_append_only"
BEFORE UPDATE OR DELETE ON "InstructionSection"
FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();

CREATE TRIGGER "SubmissionVersion_append_only"
BEFORE UPDATE OR DELETE ON "SubmissionVersion"
FOR EACH ROW EXECUTE FUNCTION "prevent_domain_history_mutation"();
