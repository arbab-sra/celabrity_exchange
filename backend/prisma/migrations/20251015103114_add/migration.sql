/*
  Warnings:

  - Added the required column `totalCreatorFees` to the `PlatformStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPlatformFees` to the `PlatformStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFee` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CREATOR_EARNINGS';

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "circulatingSupply" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalCreatorFees" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalPlatformFees" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PlatformStats" ADD COLUMN     "totalCreatorFees" BIGINT NOT NULL,
ADD COLUMN     "totalPlatformFees" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "creatorFee" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "totalFee" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalEarningsAsCreator" BIGINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Market_totalCreatorFees_idx" ON "Market"("totalCreatorFees");

-- CreateIndex
CREATE INDEX "User_totalEarningsAsCreator_idx" ON "User"("totalEarningsAsCreator");
