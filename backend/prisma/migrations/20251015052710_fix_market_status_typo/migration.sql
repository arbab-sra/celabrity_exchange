/*
  Warnings:

  - The values [PANDING] on the enum `MarketStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MarketStatus_new" AS ENUM ('ACTIVE', 'PENDING', 'CLOSED');
ALTER TABLE "public"."Market" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Market" ALTER COLUMN "status" TYPE "MarketStatus_new" USING ("status"::text::"MarketStatus_new");
ALTER TYPE "MarketStatus" RENAME TO "MarketStatus_old";
ALTER TYPE "MarketStatus_new" RENAME TO "MarketStatus";
DROP TYPE "public"."MarketStatus_old";
ALTER TABLE "Market" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Market" ALTER COLUMN "status" SET DEFAULT 'PENDING';
