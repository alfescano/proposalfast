-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "Proposal" ADD COLUMN "commentsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill expiry from the existing valid-until date
UPDATE "Proposal" SET "expiresAt" = "validUntil" WHERE "validUntil" IS NOT NULL AND "expiresAt" IS NULL;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "notifyComment" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ProposalComment" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "versionId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalComment_proposalId_createdAt_idx" ON "ProposalComment"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "ProposalComment_versionId_idx" ON "ProposalComment"("versionId");

-- AddForeignKey
ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalComment" ADD CONSTRAINT "ProposalComment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProposalVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
