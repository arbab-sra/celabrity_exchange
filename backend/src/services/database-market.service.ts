import { prisma } from "./prisma.service.js";
import { Prisma } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
/**
 * DatabaseMarketService
 * Handles all database operations for markets, transactions, holders, and analytics
 */
export class DatabaseMarketService {
  /**
   * Get all markets from database with holder counts
   */
  async getAllMarkets() {
    try {
      const markets = await prisma.market.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              holders: { where: { balance: { gt: 0 } } },
              transactions: true,
            },
          },
        },
      });

      return markets.map((m) => ({
        publicKey: m.publicKey,
        owner: m.owner,
        mint: m.mint,
        escrow: m.escrow,
        treasury: m.treasury,
        currentPrice: m.currentPrice.toString(),
        totalSupply: m.totalSupply.toString(),
        tradeCount: m.tradeCount.toString(),
        name: m.name,
        symbol: m.symbol,
        description: m.description,
        imageUrl: m.imageUrl,
        uri: m.metadataUri,
        holderCount: m._count.holders,
        transactionCount: m._count.transactions,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error("Error in getAllMarkets:", error);
      throw new Error("Failed to fetch markets from database");
    }
  }

  /**
   * Get market by public key address
   */
  async getMarketByAddress(address: string) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: address },
        include: {
          _count: {
            select: {
              holders: { where: { balance: { gt: 0 } } },
              transactions: true,
            },
          },
        },
      });

      if (!market) {
        throw new Error("Market not found");
      }

      return {
        publicKey: market.publicKey,
        owner: market.owner,
        mint: market.mint,
        escrow: market.escrow,
        treasury: market.treasury,
        currentPrice: market.currentPrice.toString(),
        totalSupply: market.totalSupply.toString(),
        tradeCount: market.tradeCount.toString(),
        name: market.name,
        symbol: market.symbol,
        description: market.description,
        imageUrl: market.imageUrl,
        uri: market.metadataUri,
        holderCount: market._count.holders,
        transactionCount: market._count.transactions,
        createdAt: market.createdAt.toISOString(),
      };
    } catch (error) {
      console.error("Error in getMarketByAddress:", error);
      throw error;
    }
  }

  /**
   * Get market by mint address
   */
  async getMarketByMint(mintAddress: string) {
    try {
      const market = await prisma.market.findUnique({
        where: { mint: mintAddress },
      });

      if (!market) {
        throw new Error("Market not found");
      }

      return this.getMarketByAddress(market.publicKey);
    } catch (error) {
      console.error("Error in getMarketByMint:", error);
      throw error;
    }
  }

  /**
   * Create new market in database
   */
  async createMarket(marketData: {
    publicKey: string;
    owner: string;
    mint: string;
    escrow: string;
    treasury: string;
    initialPrice: bigint;
    initialSupply: bigint;
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
    metadataUri?: string;
  }) {
    try {
      const market = await prisma.market.create({
        data: {
          publicKey: marketData.publicKey,
          owner: marketData.owner,
          mint: marketData.mint,
          escrow: marketData.escrow,
          treasury: marketData.treasury,
          initialPrice: marketData.initialPrice,
          initialSupply: marketData.initialSupply,
          currentPrice: marketData.initialPrice,
          totalSupply: marketData.initialSupply,
          name: marketData.name,
          symbol: marketData.symbol,
          description: marketData.description,
          imageUrl: marketData.imageUrl,
          metadataUri: marketData.metadataUri,
        },
      });

      console.log("✅ Market created in database:", market.publicKey);
      return market;
    } catch (error) {
      console.error("Error in createMarket:", error);
      throw new Error("Failed to create market in database");
    }
  }

  /**
   * Update market price and trade count
   */
  async updateMarketStats(marketAddress: string, newPrice: bigint) {
    try {
      await prisma.market.update({
        where: { publicKey: marketAddress },
        data: {
          currentPrice: newPrice,
          tradeCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error in updateMarketStats:", error);
      throw error;
    }
  }

  /**
   * Get historical price data for charts
   */
  async getPriceHistory(
    marketAddress: string,
    interval: string = "ONE_DAY",
    limit: number = 30
  ) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true },
      });

      if (!market) {
        return [];
      }

      const history = await prisma.priceHistory.findMany({
        where: {
          marketId: market.id,
          interval: interval as any,
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return history
        .map((h) => ({
          timestamp: Math.floor(h.timestamp.getTime() / 1000),
          price: Number(h.price) / 1e9, // Convert to SOL
          volume: Number(h.volume),
          trades: h.trades,
        }))
        .reverse();
    } catch (error) {
      console.error("Error in getPriceHistory:", error);
      throw new Error("Failed to fetch price history");
    }
  }

  /**
   * Save price history snapshot
   */
  async savePriceHistory(
    marketId: string,
    price: bigint,
    volume: bigint,
    trades: number,
    interval: string = "ONE_MINUTE"
  ) {
    try {
      // Round timestamp based on interval
      let roundedTime: Date;
      const now = new Date();

      switch (interval) {
        case "ONE_MINUTE":
          roundedTime = new Date(Math.floor(now.getTime() / 60000) * 60000);
          break;
        case "FIVE_MINUTES":
          roundedTime = new Date(Math.floor(now.getTime() / 300000) * 300000);
          break;
        case "ONE_HOUR":
          roundedTime = new Date(Math.floor(now.getTime() / 3600000) * 3600000);
          break;
        case "ONE_DAY":
          roundedTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        default:
          roundedTime = now;
      }

      await prisma.priceHistory.upsert({
        where: {
          marketId_timestamp_interval: {
            marketId,
            timestamp: roundedTime,
            interval: interval as any,
          },
        },
        create: {
          marketId,
          price,
          volume,
          trades,
          timestamp: roundedTime,
          interval: interval as any,
        },
        update: {
          price,
          volume: { increment: volume },
          trades: { increment: trades },
        },
      });
    } catch (error) {
      console.error("Error in savePriceHistory:", error);
    }
  }

  /**
   * Get detailed transaction history for a market
   */
  async getMarketTransactions(marketAddress: string, limit: number = 20) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true },
      });

      if (!market) {
        return [];
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          marketId: market.id,
          status: "CONFIRMED",
        },
        orderBy: { blockTime: "desc" },
        take: limit,
      });

      return transactions.map((tx) => ({
        signature: tx.signature,
        type: tx.type,
        userWallet: tx.userWallet,
        amount: tx.amount.toString(),
        pricePerToken: tx.pricePerToken.toString(),
        pricePerTokenSOL: (Number(tx.pricePerToken) / 1e9).toFixed(6),
        totalValue: tx.totalValue.toString(),
        totalValueSOL: (Number(tx.totalValue) / 1e9).toFixed(4),
        platformFee: tx.platformFee.toString(),
        platformFeeSOL: (Number(tx.platformFee) / 1e9).toFixed(6),
        status: tx.status,
        timestamp: Math.floor(tx.blockTime.getTime() / 1000),
        blockTime: tx.blockTime.toISOString(),
      }));
    } catch (error) {
      console.error("Error in getMarketTransactions:", error);
      throw new Error("Failed to fetch market transactions");
    }
  }

  /**
   * Save transaction to database
   */
  async saveTransaction(txData: {
    signature: string;
    marketId: string;
    type: "BUY" | "SELL" | "CREATE_MARKET";
    userWallet: string;
    amount: bigint;
    pricePerToken: bigint;
    totalValue: bigint;
    platformFee: bigint;
    creatorFee?: bigint; // ✅ NEW: Optional for backward compatibility
    totalFee?: bigint; // ✅ NEW: Optional, will be calculated if not provided
    blockTime: Date;
    status?: "PENDING" | "CONFIRMED" | "FAILED";
    error?: string;
  }) {
    try {
      // ✅ Calculate totalFee if not provided
      const creatorFee = txData.creatorFee || BigInt(0);
      const totalFee = txData.totalFee || txData.platformFee + creatorFee;

      const transaction = await prisma.transaction.create({
        data: {
          signature: txData.signature,
          marketId: txData.marketId,
          type: txData.type,
          userWallet: txData.userWallet,
          amount: txData.amount,
          pricePerToken: txData.pricePerToken,
          totalValue: txData.totalValue,
          platformFee: txData.platformFee,
          creatorFee: creatorFee, // ✅ NEW
          totalFee: totalFee, // ✅ NEW
          blockTime: txData.blockTime,
          status: txData.status || "CONFIRMED",
          error: txData.error,
        },
      });

      console.log("✅ Transaction saved:", transaction.signature);
      console.log("  Platform Fee:", transaction.platformFee.toString());
      console.log("  Creator Fee:", transaction.creatorFee.toString());
      console.log("  Total Fee:", transaction.totalFee.toString());

      return transaction;
    } catch (error) {
      console.error("Error in saveTransaction:", error);
      throw new Error("Failed to save transaction");
    }
  }

  /**
   * Get top token holders
   */
  async getTopHolders(marketAddress: string, limit: number = 10) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true, totalSupply: true },
      });

      if (!market) {
        return [];
      }

      const holders = await prisma.holder.findMany({
        where: {
          marketId: market.id,
          balance: { gt: 0 },
        },
        orderBy: { balance: "desc" },
        take: limit,
      });

      return holders.map((holder, index) => ({
        rank: index + 1,
        walletAddress: holder.walletAddress,
        balance: holder.balance.toString(),
        percentage:
          ((Number(holder.balance) / Number(market.totalSupply)) * 100).toFixed(
            2
          ) + "%",
        totalBought: holder.totalBought.toString(),
        totalSold: holder.totalSold.toString(),
        averageBuyPrice: holder.averageBuyPrice.toString(),
        averageBuyPriceSOL: (Number(holder.averageBuyPrice) / 1e9).toFixed(6),
        realizedPnL: holder.realizedPnL.toString(),
        realizedPnLSOL: (Number(holder.realizedPnL) / 1e9).toFixed(4),
        firstPurchase: holder.firstPurchase.toISOString(),
        lastActivity: holder.lastActivity.toISOString(),
      }));
    } catch (error) {
      console.error("Error in getTopHolders:", error);
      throw new Error("Failed to fetch top holders");
    }
  }

  /**
   * Update or create holder record
   */
  async updateHolder(
    marketId: string,
    walletAddress: string,
    type: "BUY" | "SELL",
    amount: bigint,
    pricePerToken: bigint
  ) {
    try {
      const holder = await prisma.holder.upsert({
        where: {
          marketId_walletAddress: {
            marketId,
            walletAddress,
          },
        },
        create: {
          marketId,
          walletAddress,
          balance: type === "BUY" ? amount : BigInt(0),
          totalBought: type === "BUY" ? amount : BigInt(0),
          totalSold: type === "SELL" ? amount : BigInt(0),
          averageBuyPrice: type === "BUY" ? pricePerToken : BigInt(0),
          firstPurchase: new Date(),
          lastActivity: new Date(),
        },
        update: {
          balance:
            type === "BUY" ? { increment: amount } : { decrement: amount },
          totalBought: type === "BUY" ? { increment: amount } : undefined,
          totalSold: type === "SELL" ? { increment: amount } : undefined,
          lastActivity: new Date(),
        },
      });

      // Calculate new average buy price for buys
      if (type === "BUY" && holder) {
        const totalCost =
          holder.averageBuyPrice * (holder.balance - amount) +
          pricePerToken * amount;
        const newAverage = totalCost / holder.balance;

        await prisma.holder.update({
          where: { id: holder.id },
          data: { averageBuyPrice: newAverage },
        });
      }

      // Calculate realized P&L for sells
      if (type === "SELL" && holder) {
        const profit = (pricePerToken - holder.averageBuyPrice) * amount;
        await prisma.holder.update({
          where: { id: holder.id },
          data: { realizedPnL: { increment: profit } },
        });
      }

      return holder;
    } catch (error) {
      console.error("Error in updateHolder:", error);
      throw error;
    }
  }

  /**
   * Get total holder count
   */
  async getTotalHolderCount(marketAddress: string): Promise<number> {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true },
      });

      if (!market) return 0;

      return await prisma.holder.count({
        where: {
          marketId: market.id,
          balance: { gt: 0 },
        },
      });
    } catch (error) {
      console.error("Error in getTotalHolderCount:", error);
      return 0;
    }
  }

  /**
   * Get 24h statistics for a market
   */
  async get24hStats(marketAddress: string) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true, currentPrice: true },
      });

      if (!market) {
        throw new Error("Market not found");
      }

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get all transactions from last 24h
      const transactions = await prisma.transaction.findMany({
        where: {
          marketId: market.id,
          blockTime: { gte: yesterday },
          status: "CONFIRMED",
        },
        select: {
          totalValue: true,
          pricePerToken: true,
          userWallet: true,
        },
      });

      // Calculate statistics
      let totalVolume = BigInt(0);
      let highPrice = BigInt(0);
      let lowPrice = market.currentPrice;
      const uniqueTraders = new Set<string>();

      for (const tx of transactions) {
        totalVolume += tx.totalValue;
        if (tx.pricePerToken > highPrice) highPrice = tx.pricePerToken;
        if (tx.pricePerToken < lowPrice) lowPrice = tx.pricePerToken;
        uniqueTraders.add(tx.userWallet);
      }

      // Get price 24h ago
      const priceHistory = await prisma.priceHistory.findFirst({
        where: {
          marketId: market.id,
          timestamp: { gte: yesterday },
          interval: "ONE_HOUR",
        },
        orderBy: { timestamp: "asc" },
      });

      const price24hAgo = priceHistory?.price || market.currentPrice;
      const priceChange = market.currentPrice - price24hAgo;
      const priceChangePercent =
        price24hAgo > BigInt(0)
          ? ((Number(priceChange) / Number(price24hAgo)) * 100).toFixed(2) + "%"
          : "0%";

      return {
        volume: totalVolume.toString(),
        volumeSOL: (Number(totalVolume) / 1e9).toFixed(2),
        trades: transactions.length,
        priceChange: priceChange.toString(),
        priceChangeSOL: (Number(priceChange) / 1e9).toFixed(6),
        priceChangePercent,
        high24h: highPrice.toString(),
        high24hSOL: (Number(highPrice) / 1e9).toFixed(6),
        low24h: lowPrice.toString(),
        low24hSOL: (Number(lowPrice) / 1e9).toFixed(6),
        uniqueTraders: uniqueTraders.size,
      };
    } catch (error) {
      console.error("Error in get24hStats:", error);
      throw new Error("Failed to fetch 24h statistics");
    }
  }

  /**
   * Get 24h volume only
   */
  async get24hVolume(marketAddress: string) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true },
      });

      if (!market) {
        return { volume: "0", trades: 0 };
      }

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await prisma.transaction.aggregate({
        where: {
          marketId: market.id,
          blockTime: { gte: yesterday },
          status: "CONFIRMED",
        },
        _sum: {
          totalValue: true,
        },
        _count: true,
      });

      return {
        volume: result._sum.totalValue?.toString() || "0",
        trades: result._count,
      };
    } catch (error) {
      console.error("Error in get24hVolume:", error);
      return { volume: "0", trades: 0 };
    }
  }

  /**
   * Get volume data for charts
   */
  async getVolumeData(marketAddress: string, interval: string, limit: number) {
    try {
      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
        select: { id: true },
      });

      if (!market) return [];

      const volumeData = await prisma.priceHistory.findMany({
        where: {
          marketId: market.id,
          interval: interval as any,
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });

      return volumeData
        .map((v) => ({
          timestamp: Math.floor(v.timestamp.getTime() / 1000),
          volume: Number(v.volume),
          volumeSOL: (Number(v.volume) / 1e9).toFixed(2),
          trades: v.trades,
        }))
        .reverse();
    } catch (error) {
      console.error("Error in getVolumeData:", error);
      return [];
    }
  }

  /**
   * Get user's complete portfolio
   */
  async getUserPortfolio(walletAddress: string) {
    try {
      const holdings = await prisma.holder.findMany({
        where: {
          walletAddress,
          balance: { gt: 0 },
        },
        include: {
          market: true,
        },
      });

      return holdings.map((h) => {
        const currentValue = h.balance * h.market.currentPrice;
        const costBasis = h.balance * h.averageBuyPrice;
        const unrealizedPnL = currentValue - costBasis;
        const totalPnL = unrealizedPnL + h.realizedPnL;

        return {
          market: {
            publicKey: h.market.publicKey,
            name: h.market.name,
            symbol: h.market.symbol,
            mint: h.market.mint,
            currentPrice: h.market.currentPrice.toString(),
            currentPriceSOL: (Number(h.market.currentPrice) / 1e9).toFixed(6),
          },
          balance: h.balance.toString(),
          balanceFormatted: Number(h.balance).toLocaleString(),
          totalBought: h.totalBought.toString(),
          totalSold: h.totalSold.toString(),
          averageBuyPrice: h.averageBuyPrice.toString(),
          averageBuyPriceSOL: (Number(h.averageBuyPrice) / 1e9).toFixed(6),
          currentValue: currentValue.toString(),
          currentValueSOL: (Number(currentValue) / 1e9).toFixed(4),
          costBasis: costBasis.toString(),
          costBasisSOL: (Number(costBasis) / 1e9).toFixed(4),
          unrealizedPnL: unrealizedPnL.toString(),
          unrealizedPnLSOL: (Number(unrealizedPnL) / 1e9).toFixed(4),
          unrealizedPnLPercent:
            costBasis > BigInt(0)
              ? ((Number(unrealizedPnL) / Number(costBasis)) * 100).toFixed(2) +
                "%"
              : "0%",
          realizedPnL: h.realizedPnL.toString(),
          realizedPnLSOL: (Number(h.realizedPnL) / 1e9).toFixed(4),
          totalPnL: totalPnL.toString(),
          totalPnLSOL: (Number(totalPnL) / 1e9).toFixed(4),
          firstPurchase: h.firstPurchase.toISOString(),
          lastActivity: h.lastActivity.toISOString(),
        };
      });
    } catch (error) {
      console.error("Error in getUserPortfolio:", error);
      throw new Error("Failed to fetch user portfolio");
    }
  }

  /**
   * Get user's trading activity
   */
  async getUserActivity(walletAddress: string, limit: number, type?: string) {
    try {
      const where: any = {
        userWallet: walletAddress,
        status: "CONFIRMED",
      };

      if (type && ["BUY", "SELL"].includes(type)) {
        where.type = type;
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { blockTime: "desc" },
        take: limit,
        include: {
          market: {
            select: {
              name: true,
              symbol: true,
              publicKey: true,
            },
          },
        },
      });

      return transactions.map((tx) => ({
        signature: tx.signature,
        type: tx.type,
        amount: tx.amount.toString(),
        amountFormatted: Number(tx.amount).toLocaleString(),
        pricePerToken: tx.pricePerToken.toString(),
        pricePerTokenSOL: (Number(tx.pricePerToken) / 1e9).toFixed(6),
        totalValue: tx.totalValue.toString(),
        totalValueSOL: (Number(tx.totalValue) / 1e9).toFixed(4),
        platformFee: tx.platformFee.toString(),
        platformFeeSOL: (Number(tx.platformFee) / 1e9).toFixed(6),
        market: {
          name: tx.market.name,
          symbol: tx.market.symbol,
          address: tx.market.publicKey,
        },
        timestamp: Math.floor(tx.blockTime.getTime() / 1000),
        blockTime: tx.blockTime.toISOString(),
        explorerUrl: `https://solscan.io/tx/${tx.signature}?cluster=devnet`,
      }));
    } catch (error) {
      console.error("Error in getUserActivity:", error);
      throw new Error("Failed to fetch user activity");
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(walletAddress: string) {
    try {
      const [
        totalTransactions,
        buyCount,
        sellCount,
        volumeResult,
        holdingsCount,
      ] = await Promise.all([
        prisma.transaction.count({
          where: { userWallet: walletAddress, status: "CONFIRMED" },
        }),
        prisma.transaction.count({
          where: {
            userWallet: walletAddress,
            type: "BUY",
            status: "CONFIRMED",
          },
        }),
        prisma.transaction.count({
          where: {
            userWallet: walletAddress,
            type: "SELL",
            status: "CONFIRMED",
          },
        }),
        prisma.transaction.aggregate({
          where: { userWallet: walletAddress, status: "CONFIRMED" },
          _sum: { totalValue: true, platformFee: true },
        }),
        prisma.holder.count({
          where: { walletAddress, balance: { gt: 0 } },
        }),
      ]);

      const totalVolume = volumeResult._sum.totalValue || BigInt(0);
      const totalFeesPaid = volumeResult._sum.platformFee || BigInt(0);

      // Get first transaction date
      const firstTx = await prisma.transaction.findFirst({
        where: { userWallet: walletAddress, status: "CONFIRMED" },
        orderBy: { blockTime: "asc" },
        select: { blockTime: true },
      });

      // Calculate total P&L
      const holdings = await prisma.holder.findMany({
        where: { walletAddress },
        select: { realizedPnL: true },
      });

      const totalRealizedPnL = holdings.reduce(
        (sum, h) => sum + h.realizedPnL,
        BigInt(0)
      );

      return {
        walletAddress,
        totalTransactions,
        buyCount,
        sellCount,
        totalVolume: totalVolume.toString(),
        totalVolumeSOL: (Number(totalVolume) / 1e9).toFixed(2),
        totalFeesPaid: totalFeesPaid.toString(),
        totalFeesPaidSOL: (Number(totalFeesPaid) / 1e9).toFixed(4),
        totalRealizedPnL: totalRealizedPnL.toString(),
        totalRealizedPnLSOL: (Number(totalRealizedPnL) / 1e9).toFixed(4),
        currentHoldings: holdingsCount,
        memberSince:
          firstTx?.blockTime.toISOString() || new Date().toISOString(),
        daysSinceMember: firstTx
          ? Math.floor(
              (Date.now() - firstTx.blockTime.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0,
      };
    } catch (error) {
      console.error("Error in getUserStats:", error);
      throw new Error("Failed to fetch user statistics");
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics() {
    try {
      const [
        totalMarkets,
        totalTransactions,
        volumeResult,
        activeUsers,
        totalHolders,
        totalFees,
      ] = await Promise.all([
        prisma.market.count(),
        prisma.transaction.count({ where: { status: "CONFIRMED" } }),
        prisma.transaction.aggregate({
          where: { status: "CONFIRMED" },
          _sum: { totalValue: true, platformFee: true },
        }),
        prisma.transaction.findMany({
          where: { status: "CONFIRMED" },
          select: { userWallet: true },
          distinct: ["userWallet"],
        }),
        prisma.holder.count({ where: { balance: { gt: 0 } } }),
        prisma.transaction.aggregate({
          where: { status: "CONFIRMED" },
          _sum: { platformFee: true },
        }),
      ]);

      const totalVolume = volumeResult._sum.totalValue || BigInt(0);
      const platformRevenue = totalFees._sum.platformFee || BigInt(0);

      // Get 24h stats
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const stats24h = await prisma.transaction.aggregate({
        where: {
          blockTime: { gte: yesterday },
          status: "CONFIRMED",
        },
        _sum: { totalValue: true },
        _count: true,
      });

      return {
        totalMarkets,
        totalTransactions,
        totalVolume: totalVolume.toString(),
        totalVolumeSOL: (Number(totalVolume) / 1e9).toFixed(2),
        totalVolumeUSD: ((Number(totalVolume) / 1e9) * 200).toFixed(2), // Assuming $200/SOL
        activeUsers: activeUsers.length,
        totalHolders,
        totalFees: platformRevenue.toString(),
        totalFeesSOL: (Number(platformRevenue) / 1e9).toFixed(4),
        totalFeesUSD: ((Number(platformRevenue) / 1e9) * 200).toFixed(2),
        volume24h: stats24h._sum.totalValue?.toString() || "0",
        volume24hSOL: (Number(stats24h._sum.totalValue || 0) / 1e9).toFixed(2),
        trades24h: stats24h._count,
      };
    } catch (error) {
      console.error("Error in getPlatformAnalytics:", error);
      throw new Error("Failed to fetch platform analytics");
    }
  }

  /**
   * Get top markets by volume
   */
  async getTopMarketsByVolume(limit: number = 10) {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const markets = await prisma.market.findMany({
        include: {
          transactions: {
            where: {
              blockTime: { gte: yesterday },
              status: "CONFIRMED",
            },
            select: {
              totalValue: true,
            },
          },
          _count: {
            select: { holders: { where: { balance: { gt: 0 } } } },
          },
        },
      });

      const marketsWithVolume = markets.map((m) => {
        const volume24h = m.transactions.reduce(
          (sum, tx) => sum + Number(tx.totalValue),
          0
        );

        return {
          publicKey: m.publicKey,
          name: m.name,
          symbol: m.symbol,
          currentPrice: m.currentPrice.toString(),
          currentPriceSOL: (Number(m.currentPrice) / 1e9).toFixed(6),
          volume24h,
          volume24hSOL: (volume24h / 1e9).toFixed(2),
          holderCount: m._count.holders,
          tradeCount: m.tradeCount,
        };
      });

      return marketsWithVolume
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, limit);
    } catch (error) {
      console.error("Error in getTopMarketsByVolume:", error);
      return [];
    }
  }

  /**
   * Get recent platform activity
   */
  async getRecentPlatformActivity(limit: number = 20) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          status: "CONFIRMED",
        },
        orderBy: { blockTime: "desc" },
        take: limit,
        include: {
          market: {
            select: {
              name: true,
              symbol: true,
              publicKey: true,
            },
          },
        },
      });

      return transactions.map((tx) => ({
        signature: tx.signature,
        type: tx.type,
        userWallet: tx.userWallet,
        amount: tx.amount.toString(),
        totalValue: tx.totalValue.toString(),
        totalValueSOL: (Number(tx.totalValue) / 1e9).toFixed(4),
        market: {
          name: tx.market.name,
          symbol: tx.market.symbol,
          address: tx.market.publicKey,
        },
        timestamp: Math.floor(tx.blockTime.getTime() / 1000),
      }));
    } catch (error) {
      console.error("Error in getRecentPlatformActivity:", error);
      return [];
    }
  }

  /**
   * Get market leaderboard
   */
  async getLeaderboard(sortBy: string, limit: number) {
    try {
      const markets = await prisma.market.findMany({
        include: {
          _count: {
            select: {
              holders: { where: { balance: { gt: 0 } } },
              transactions: { where: { status: "CONFIRMED" } },
            },
          },
        },
      });

      const leaderboard = markets.map((m, index) => {
        const marketCap = Number(m.currentPrice) * Number(m.totalSupply);

        return {
          rank: index + 1,
          publicKey: m.publicKey,
          name: m.name,
          symbol: m.symbol,
          imageUrl: m.imageUrl,
          currentPrice: m.currentPrice.toString(),
          currentPriceSOL: (Number(m.currentPrice) / 1e9).toFixed(6),
          marketCap: marketCap,
          marketCapSOL: (marketCap / 1e9).toFixed(2),
          tradeCount: m.tradeCount,
          holderCount: m._count.holders,
          transactionCount: m._count.transactions,
          createdAt: m.createdAt.toISOString(),
        };
      });

      // Sort based on criteria
      switch (sortBy) {
        case "volume":
          leaderboard.sort((a, b) => b.transactionCount - a.transactionCount);
          break;
        case "trades":
          leaderboard.sort((a, b) => b.tradeCount - a.tradeCount);
          break;
        case "holders":
          leaderboard.sort((a, b) => b.holderCount - a.holderCount);
          break;
        case "newest":
          leaderboard.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "marketCap":
        default:
          leaderboard.sort((a, b) => b.marketCap - a.marketCap);
      }

      // Update ranks
      return leaderboard.slice(0, limit).map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
    } catch (error) {
      console.error("Error in getLeaderboard:", error);
      return [];
    }
  }

  /**
   * Get trending markets
   */
  async getTrendingMarkets(limit: number) {
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const markets = await prisma.market.findMany({
        where: {
          transactions: {
            some: {
              blockTime: { gte: last24h },
              status: "CONFIRMED",
            },
          },
        },
        include: {
          transactions: {
            where: {
              blockTime: { gte: last24h },
              status: "CONFIRMED",
            },
          },
          _count: {
            select: { holders: { where: { balance: { gt: 0 } } } },
          },
        },
      });

      const trending = markets.map((m) => {
        const volume24h = m.transactions.reduce(
          (sum, tx) => sum + Number(tx.totalValue),
          0
        );
        const trades24h = m.transactions.length;

        // Trending score: weighted combination of trades and volume
        const trendingScore = trades24h * 100 + volume24h / 1e7;

        return {
          publicKey: m.publicKey,
          name: m.name,
          symbol: m.symbol,
          imageUrl: m.imageUrl,
          currentPrice: m.currentPrice.toString(),
          currentPriceSOL: (Number(m.currentPrice) / 1e9).toFixed(6),
          volume24h,
          volume24hSOL: (volume24h / 1e9).toFixed(2),
          trades24h,
          holderCount: m._count.holders,
          trendingScore,
        };
      });

      return trending
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);
    } catch (error) {
      console.error("Error in getTrendingMarkets:", error);
      return [];
    }
  }

  /**
   * Search markets
   */
  async searchMarkets(query: string) {
    try {
      const markets = await prisma.market.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { symbol: { contains: query, mode: "insensitive" } },
            { publicKey: { contains: query } },
            { mint: { contains: query } },
          ],
        },
        include: {
          _count: {
            select: { holders: { where: { balance: { gt: 0 } } } },
          },
        },
        take: 20,
      });

      return markets.map((m) => ({
        publicKey: m.publicKey,
        name: m.name,
        symbol: m.symbol,
        mint: m.mint,
        imageUrl: m.imageUrl,
        currentPrice: m.currentPrice.toString(),
        currentPriceSOL: (Number(m.currentPrice) / 1e9).toFixed(6),
        holderCount: m._count.holders,
        tradeCount: m.tradeCount,
      }));
    } catch (error) {
      console.error("Error in searchMarkets:", error);
      return [];
    }
  }
}

// Export singleton instance
export const dbMarketService = new DatabaseMarketService();
