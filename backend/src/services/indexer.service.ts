import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection, PROGRAM_ID } from "../config/solana.config.js";
import { prisma } from "./prisma.service.js";
import { dbMarketService } from "./database-market.service.js";
import dotenv from "dotenv";
dotenv.config();

export class BlockchainIndexer {
  private connection: Connection;
  private isRunning = false;
  private lastProcessedSlot = 0;
  private processedSignatures = new Set<string>();

  constructor() {
    this.connection = getConnection();
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🔄 Blockchain Indexer Started");

    // Load last processed slot
    await this.loadLastSlot();

    // Start indexing loop
    this.indexLoop();
  }

  private async loadLastSlot() {
    this.lastProcessedSlot = await this.connection.getSlot();
    console.log("📍 Starting from slot:", this.lastProcessedSlot);
  }

  private async indexLoop() {
    while (this.isRunning) {
      try {
        await this.indexNewTransactions();
        await this.sleep(10000); // Check every 10 seconds
      } catch (error) {
        console.error("❌ Indexer error:", error);
        await this.sleep(20000); // Wait longer on error
      }
    }
  }

  private async indexNewTransactions() {
    try {
      // Get signatures for our program
      const signatures = await this.connection.getSignaturesForAddress(
        PROGRAM_ID,
        { limit: 50 }
      );

      console.log(`📡 Found ${signatures.length} signatures to process`);

      for (const sigInfo of signatures) {
        // Skip if already processed in this session
        if (this.processedSignatures.has(sigInfo.signature)) {
          continue;
        }

        // Skip if already in database
        const existing = await prisma.transaction.findUnique({
          where: { signature: sigInfo.signature },
        });

        if (existing) {
          this.processedSignatures.add(sigInfo.signature);
          continue;
        }

        // Process new transaction
        await this.processTransaction(
          sigInfo.signature,
          sigInfo.blockTime || null
        );
        this.processedSignatures.add(sigInfo.signature);

        // Small delay to avoid rate limiting
        await this.sleep(100);
      }
    } catch (error) {
      console.error("❌ Error in indexNewTransactions:", error);
    }
  }

  private async processTransaction(
    signature: string,
    blockTime: number | null
  ) {
    try {
      console.log("🔍 Processing transaction:", signature);

      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (!tx || !tx.meta) {
        console.log("⚠️ Transaction not found or has no metadata:", signature);
        return;
      }

      // Check if transaction failed
      if (tx.meta.err) {
        console.log("❌ Transaction failed:", signature);
        return;
      }

      // Parse instruction data
      const instructions = tx.transaction.message.instructions;
      if (!instructions || instructions.length === 0) {
        console.log("⚠️ No instructions found:", signature);
        return;
      }

      // Find our program's instruction
      const programInstruction = instructions.find((ix: any) => {
        const programId = ix.programId || ix.program;
        return programId && programId.toString() === PROGRAM_ID.toString();
      });

      if (!programInstruction) {
        console.log("⚠️ No instruction from our program:", signature);
        return;
      }

      // Parse accounts from instruction
      const accounts = (programInstruction as any).accounts || [];
      if (accounts.length < 6) {
        console.log("⚠️ Not enough accounts in instruction:", signature);
        return;
      }

      // Extract account addresses
      const userWallet = accounts[0]?.toString();
      const marketAddress = accounts[1]?.toString();

      if (!userWallet || !marketAddress) {
        console.log("⚠️ Missing wallet or market address:", signature);
        return;
      }

      // Find market in database
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
      });

      if (!market) {
        console.log("⚠️ Market not found in database:", marketAddress);
        // This might be a create_market transaction, skip for now
        return;
      }

      // Determine transaction type from pre/post token balances
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      let transactionType: "BUY" | "SELL" = "BUY";
      let amount = BigInt(0);

      // Compare token balances to determine buy/sell and amount
      for (const postBalance of postTokenBalances) {
        const preBalance = preTokenBalances.find(
          (pre: any) => pre.accountIndex === postBalance.accountIndex
        );

        if (postBalance.mint === market.mint) {
          const postAmount = BigInt(postBalance.uiTokenAmount.amount);
          const preAmount = preBalance
            ? BigInt(preBalance.uiTokenAmount.amount)
            : BigInt(0);
          const diff = postAmount - preAmount;

          if (diff > 0) {
            // User received tokens = BUY
            transactionType = "BUY";
            amount = diff;
          } else if (diff < 0) {
            // User sent tokens = SELL
            transactionType = "SELL";
            amount = -diff; // Make positive
          }
          break;
        }
      }

      if (amount === BigInt(0)) {
        console.log("⚠️ Could not determine transaction amount:", signature);
        return;
      }

      // Calculate values based on current market price
      const pricePerToken = market.currentPrice;
      const totalValue = amount * pricePerToken;

      // ✅ NEW: Calculate fee split (70/30)
      const totalFeeAmount = totalValue / BigInt(100); // 1%
      const platformFee = (totalFeeAmount * BigInt(70)) / BigInt(100); // 70%
      const creatorFee = (totalFeeAmount * BigInt(30)) / BigInt(100); // 30%

      console.log("💰 Fee breakdown:", {
        totalFeeAmount: totalFeeAmount.toString(),
        platformFee: platformFee.toString(),
        creatorFee: creatorFee.toString(),
      });

      // Prepare transaction data
      const txData = {
        signature,
        marketId: market.id,
        type: transactionType,
        userWallet,
        amount,
        pricePerToken,
        totalValue,
        platformFee,
        creatorFee, // ✅ NEW
        totalFee: totalFeeAmount, // ✅ NEW
        blockTime: blockTime ? new Date(blockTime * 1000) : new Date(),
        status: "CONFIRMED" as const,
      };

      // Save transaction
      await this.saveTransaction(txData);

      console.log(`✅ Indexed ${transactionType} transaction:`, signature);
    } catch (error: any) {
      console.error("❌ Error processing tx:", signature, error.message);
    }
  }

  // ✅ UPDATED: Include creatorFee and totalFee
  private async saveTransaction(data: {
    signature: string;
    marketId: string;
    type: "BUY" | "SELL";
    userWallet: string;
    amount: bigint;
    pricePerToken: bigint;
    totalValue: bigint;
    platformFee: bigint;
    creatorFee: bigint; // ✅ NEW
    totalFee: bigint; // ✅ NEW
    blockTime: Date;
    status: "PENDING" | "CONFIRMED" | "FAILED";
  }) {
    try {
      // Validate data before saving
      if (!data.amount || data.amount <= BigInt(0)) {
        console.log("⚠️ Invalid amount, skipping transaction:", data.signature);
        return;
      }

      if (!data.pricePerToken || data.pricePerToken <= BigInt(0)) {
        console.log("⚠️ Invalid price, skipping transaction:", data.signature);
        return;
      }

      // Save transaction to database
      const transaction = await prisma.transaction.create({
        data: {
          signature: data.signature,
          marketId: data.marketId,
          type: data.type,
          userWallet: data.userWallet,
          amount: data.amount,
          pricePerToken: data.pricePerToken,
          totalValue: data.totalValue,
          platformFee: data.platformFee,
          creatorFee: data.creatorFee, // ✅ NEW
          totalFee: data.totalFee, // ✅ NEW
          blockTime: data.blockTime,
          status: data.status,
        },
      });

      console.log("💾 Transaction saved to database:", transaction.signature);
      console.log("  Platform Fee:", transaction.platformFee.toString());
      console.log("  Creator Fee:", transaction.creatorFee.toString());
      console.log("  Total Fee:", transaction.totalFee.toString());

      // Update market stats (including fee totals)
      await this.updateMarketStats(
        data.marketId,
        data.pricePerToken,
        data.platformFee,
        data.creatorFee
      );

      // Update holder balance
      await this.updateHolderBalance(data);

      // Update price history
      await this.updatePriceHistory(data);

      // ✅ NEW: Update creator earnings in User table
      await this.updateCreatorEarnings(data.marketId, data.creatorFee);
    } catch (error: any) {
      console.error("❌ Error saving transaction:", error.message);
      throw error;
    }
  }

  // ✅ UPDATED: Include fee tracking
  private async updateMarketStats(
    marketId: string,
    newPrice: bigint,
    platformFee: bigint,
    creatorFee: bigint
  ) {
    try {
      await prisma.market.update({
        where: { id: marketId },
        data: {
          currentPrice: newPrice,
          tradeCount: { increment: 1 },
          totalPlatformFees: { increment: platformFee }, // ✅ NEW
          totalCreatorFees: { increment: creatorFee }, // ✅ NEW
          updatedAt: new Date(),
        },
      });

      console.log("✅ Market stats updated with fees");
    } catch (error) {
      console.error("❌ Error updating market stats:", error);
    }
  }

  // ✅ NEW: Update creator earnings
  private async updateCreatorEarnings(marketId: string, creatorFee: bigint) {
    try {
      if (creatorFee <= BigInt(0)) return;

      const market = await prisma.market.findUnique({
        where: { id: marketId },
        select: { owner: true },
      });

      if (!market) return;

      // Update or create user with earnings
      await prisma.user.upsert({
        where: { walletAddress: market.owner },
        create: {
          walletAddress: market.owner,
          totalEarningsAsCreator: creatorFee,
          marketsCreated: 1,
        },
        update: {
          totalEarningsAsCreator: { increment: creatorFee },
        },
      });

      console.log("✅ Creator earnings updated:", {
        creator: market.owner,
        amount: creatorFee.toString(),
      });
    } catch (error) {
      console.error("❌ Error updating creator earnings:", error);
    }
  }

  private async updateHolderBalance(data: {
    marketId: string;
    userWallet: string;
    type: "BUY" | "SELL";
    amount: bigint;
    pricePerToken: bigint;
  }) {
    try {
      const holder = await prisma.holder.upsert({
        where: {
          marketId_walletAddress: {
            marketId: data.marketId,
            walletAddress: data.userWallet,
          },
        },
        create: {
          marketId: data.marketId,
          walletAddress: data.userWallet,
          balance: data.type === "BUY" ? data.amount : BigInt(0),
          totalBought: data.type === "BUY" ? data.amount : BigInt(0),
          totalSold: data.type === "SELL" ? data.amount : BigInt(0),
          averageBuyPrice: data.type === "BUY" ? data.pricePerToken : BigInt(0),
          firstPurchase: new Date(),
          lastActivity: new Date(),
        },
        update: {
          balance:
            data.type === "BUY"
              ? { increment: data.amount }
              : { decrement: data.amount },
          totalBought:
            data.type === "BUY" ? { increment: data.amount } : undefined,
          totalSold:
            data.type === "SELL" ? { increment: data.amount } : undefined,
          lastActivity: new Date(),
        },
      });

      // Update average buy price for buys
      if (data.type === "BUY" && holder) {
        const totalCost =
          holder.averageBuyPrice * (holder.balance - data.amount) +
          data.pricePerToken * data.amount;
        const newAverage =
          holder.balance > BigInt(0) ? totalCost / holder.balance : BigInt(0);

        await prisma.holder.update({
          where: { id: holder.id },
          data: { averageBuyPrice: newAverage },
        });
      }

      // Calculate realized P&L for sells
      if (data.type === "SELL" && holder) {
        const profit =
          (data.pricePerToken - holder.averageBuyPrice) * data.amount;
        await prisma.holder.update({
          where: { id: holder.id },
          data: { realizedPnL: { increment: profit } },
        });
      }

      // ✅ NEW: Delete holder if balance is zero
      const updatedHolder = await prisma.holder.findUnique({
        where: { id: holder.id },
      });

      if (updatedHolder && updatedHolder.balance <= BigInt(0)) {
        console.log("🗑️ Removing holder with zero balance:", data.userWallet);
        await prisma.holder.delete({
          where: { id: holder.id },
        });
      }
    } catch (error) {
      console.error("❌ Error updating holder:", error);
    }
  }

  private async updatePriceHistory(data: {
    marketId: string;
    pricePerToken: bigint;
    amount: bigint;
    blockTime: Date;
  }) {
    try {
      // Update for multiple intervals
      const intervals = ["ONE_MINUTE", "FIVE_MINUTES", "ONE_HOUR", "ONE_DAY"];

      for (const interval of intervals) {
        let roundedTime: Date;
        const timestamp = data.blockTime.getTime();

        switch (interval) {
          case "ONE_MINUTE":
            roundedTime = new Date(Math.floor(timestamp / 60000) * 60000);
            break;
          case "FIVE_MINUTES":
            roundedTime = new Date(Math.floor(timestamp / 300000) * 300000);
            break;
          case "ONE_HOUR":
            roundedTime = new Date(Math.floor(timestamp / 3600000) * 3600000);
            break;
          case "ONE_DAY":
            roundedTime = new Date(
              data.blockTime.getFullYear(),
              data.blockTime.getMonth(),
              data.blockTime.getDate()
            );
            break;
          default:
            roundedTime = data.blockTime;
        }

        await prisma.priceHistory.upsert({
          where: {
            marketId_timestamp_interval: {
              marketId: data.marketId,
              timestamp: roundedTime,
              interval: interval as any,
            },
          },
          create: {
            marketId: data.marketId,
            price: data.pricePerToken,
            volume: data.amount,
            trades: 1,
            timestamp: roundedTime,
            interval: interval as any,
          },
          update: {
            price: data.pricePerToken, // Update to latest price
            volume: { increment: data.amount },
            trades: { increment: 1 },
          },
        });
      }
    } catch (error) {
      console.error("❌ Error updating price history:", error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log("🛑 Blockchain Indexer Stopped");
  }
}

// Export singleton instance
export const indexer = new BlockchainIndexer();
