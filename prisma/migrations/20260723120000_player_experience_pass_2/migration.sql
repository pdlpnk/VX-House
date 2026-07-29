ALTER TABLE "TaskDefinition"
ADD COLUMN "sequenceOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "TaskDefinition_sequenceOrder_idx"
ON "TaskDefinition"("sequenceOrder");

CREATE TABLE "SupportAttachment" (
  "id" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "fileName" VARCHAR(240) NOT NULL,
  "mediaType" VARCHAR(120) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "contentProtected" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportAttachment_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "SupportMessage"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "SupportAttachment_messageId_createdAt_idx"
ON "SupportAttachment"("messageId", "createdAt");
