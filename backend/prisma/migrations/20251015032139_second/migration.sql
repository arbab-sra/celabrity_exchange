-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('ACTIVE', 'PANDING', 'CLOSED');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "status" "MarketStatus" NOT NULL DEFAULT 'PANDING';
