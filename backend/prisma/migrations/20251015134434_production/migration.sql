-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('ACTIVE', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'CREATE_MARKET');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "PriceInterval" AS ENUM ('ONE_MINUTE', 'FIVE_MINUTES', 'ONE_HOUR', 'ONE_DAY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRADE_EXECUTED', 'PRICE_ALERT', 'NEW_HOLDER', 'MARKET_CREATED', 'CREATOR_EARNINGS');

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "escrow" TEXT NOT NULL,
    "treasury" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "metadataUri" TEXT,
    "initialPrice" BIGINT NOT NULL,
    "initialSupply" BIGINT NOT NULL,
    "currentPrice" BIGINT NOT NULL,
    "totalSupply" BIGINT NOT NULL,
    "circulatingSupply" BIGINT NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "totalCreatorFees" BIGINT NOT NULL DEFAULT 0,
    "totalPlatformFees" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "MarketStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "userWallet" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "pricePerToken" BIGINT NOT NULL,
    "totalValue" BIGINT NOT NULL,
    "platformFee" BIGINT NOT NULL DEFAULT 0,
    "creatorFee" BIGINT NOT NULL DEFAULT 0,
    "totalFee" BIGINT NOT NULL DEFAULT 0,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "volume" BIGINT NOT NULL,
    "trades" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "interval" "PriceInterval" NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holder" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "balance" BIGINT NOT NULL,
    "totalBought" BIGINT NOT NULL DEFAULT 0,
    "totalSold" BIGINT NOT NULL DEFAULT 0,
    "averageBuyPrice" BIGINT NOT NULL DEFAULT 0,
    "realizedPnL" BIGINT NOT NULL DEFAULT 0,
    "firstPurchase" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" BIGINT NOT NULL DEFAULT 0,
    "marketsCreated" INTEGER NOT NULL DEFAULT 0,
    "totalEarningsAsCreator" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformStats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalMarkets" INTEGER NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "totalVolume" BIGINT NOT NULL,
    "totalPlatformFees" BIGINT NOT NULL DEFAULT 0,
    "totalCreatorFees" BIGINT NOT NULL DEFAULT 0,
    "totalFees" BIGINT NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL,
    "newUsers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_publicKey_key" ON "Market"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Market_mint_key" ON "Market"("mint");

-- CreateIndex
CREATE INDEX "Market_publicKey_idx" ON "Market"("publicKey");

-- CreateIndex
CREATE INDEX "Market_mint_idx" ON "Market"("mint");

-- CreateIndex
CREATE INDEX "Market_owner_idx" ON "Market"("owner");

-- CreateIndex
CREATE INDEX "Market_createdAt_idx" ON "Market"("createdAt");

-- CreateIndex
CREATE INDEX "Market_totalCreatorFees_idx" ON "Market"("totalCreatorFees");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_signature_key" ON "Transaction"("signature");

-- CreateIndex
CREATE INDEX "Transaction_signature_idx" ON "Transaction"("signature");

-- CreateIndex
CREATE INDEX "Transaction_marketId_idx" ON "Transaction"("marketId");

-- CreateIndex
CREATE INDEX "Transaction_userWallet_idx" ON "Transaction"("userWallet");

-- CreateIndex
CREATE INDEX "Transaction_blockTime_idx" ON "Transaction"("blockTime");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "PriceHistory_marketId_interval_timestamp_idx" ON "PriceHistory"("marketId", "interval", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_marketId_timestamp_interval_key" ON "PriceHistory"("marketId", "timestamp", "interval");

-- CreateIndex
CREATE INDEX "Holder_walletAddress_idx" ON "Holder"("walletAddress");

-- CreateIndex
CREATE INDEX "Holder_marketId_balance_idx" ON "Holder"("marketId", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "Holder_marketId_walletAddress_key" ON "Holder"("marketId", "walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_totalEarningsAsCreator_idx" ON "User"("totalEarningsAsCreator");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformStats_date_key" ON "PlatformStats"("date");

-- CreateIndex
CREATE INDEX "PlatformStats_date_idx" ON "PlatformStats"("date");

-- CreateIndex
CREATE INDEX "Notification_userWallet_read_idx" ON "Notification"("userWallet", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holder" ADD CONSTRAINT "Holder_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
