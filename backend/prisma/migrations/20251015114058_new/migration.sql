/*
  Warnings:

  - Made the column `totalCreatorFees` on table `Market` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Market" ALTER COLUMN "totalCreatorFees" SET NOT NULL;

-- AlterTable
ALTER TABLE "PlatformStats" ALTER COLUMN "totalFees" SET DEFAULT 0,
ALTER COLUMN "totalCreatorFees" SET DEFAULT 0,
ALTER COLUMN "totalPlatformFees" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "platformFee" SET DEFAULT 0,
ALTER COLUMN "totalFee" SET DEFAULT 0;
