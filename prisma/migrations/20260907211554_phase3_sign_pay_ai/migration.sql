-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('FULL', 'DEPOSIT', 'FIXED');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DRAWN', 'TYPED');

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "amountCents" INTEGER,
ADD COLUMN     "depositPercent" INTEGER,
ADD COLUMN     "followUpOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "paymentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "ProposalVersion" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "followUpOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Signature" ADD COLUMN     "signatureType" "SignatureType" NOT NULL DEFAULT 'TYPED',
ADD COLUMN     "versionId" TEXT;

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StripeEvent_type_processedAt_idx" ON "StripeEvent"("type", "processedAt");

-- CreateIndex
CREATE INDEX "Signature_versionId_idx" ON "Signature"("versionId");

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProposalVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
