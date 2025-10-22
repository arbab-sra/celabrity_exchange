import { Request, Response } from "express";
import { MarketService } from "../services/market.service.js";
import { dbMarketService } from "../services/database-market.service.js";
import dotenv from "dotenv";
dotenv.config();
const marketService = new MarketService();

export class MarketController {
  // ==========================================
  // EXISTING ROUTES (Updated to use DB)
  // ==========================================

  async getAllMarkets(req: Request, res: Response) {
    try {
      // Use database service instead of blockchain
      const markets = await dbMarketService.getAllMarkets();

      res.json({
        success: true,
        data: markets,
        count: markets.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMarketByAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;

      // Get from blockchain (always fresh)
      const market = await marketService.getMarketByAddress(address);

      res.json({
        success: true,
        data: market,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMarketByMint(req: Request, res: Response) {
    try {
      const { mint } = req.params;
      const market = await marketService.getMarketByMint(mint);

      res.json({
        success: true,
        data: market,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMarketsByOwner(req: Request, res: Response) {
    try {
      const { owner } = req.params;
      const markets = await marketService.getMarketsByOwner(owner);

      res.json({
        success: true,
        data: markets,
        count: markets.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMarketStats(req: Request, res: Response) {
    try {
      const { address } = req.params;

      // Get basic stats from blockchain
      const stats = await marketService.getMarketStats(address);

      // Enhance with database stats
      const dbStats = await dbMarketService.get24hVolume(address);

      res.json({
        success: true,
        data: {
          ...stats,
          volume24h: dbStats.volume,
          volume24hSOL: (Number(dbStats.volume) / 1e9).toFixed(4),
          trades24h: dbStats.trades,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getRecentTrades(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get from blockchain (for backward compatibility)
      const trades = await marketService.getRecentTrades(address, limit);

      res.json({
        success: true,
        data: trades,
        count: trades.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async calculatePrice(req: Request, res: Response) {
    try {
      const { currentPrice, amount, totalSupply, isBuy } = req.body;

      const newPrice = marketService.calculatePrice(
        currentPrice,
        amount,
        totalSupply,
        isBuy
      );

      const priceChange =
        ((parseFloat(newPrice) - parseFloat(currentPrice)) /
          parseFloat(currentPrice)) *
        100;

      res.json({
        success: true,
        data: {
          newPrice,
          priceImpact: priceChange.toFixed(2) + "%",
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/markets/:address/price-history
   * Get historical price data for charts
   */
  async getPriceHistory(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const interval = (req.query.interval as string) || "ONE_DAY";
      const limit = parseInt(req.query.limit as string) || 30;

      // Validate interval
      const validIntervals = [
        "ONE_MINUTE",
        "FIVE_MINUTES",
        "ONE_HOUR",
        "ONE_DAY",
      ];
      if (!validIntervals.includes(interval)) {
        return res.status(400).json({
          success: false,
          error: `Invalid interval. Must be one of: ${validIntervals.join(
            ", "
          )}`,
        });
      }

      const history = await dbMarketService.getPriceHistory(
        address,
        interval,
        limit
      );

      res.json({
        success: true,
        data: history,
        count: history.length,
        interval: interval,
        meta: {
          oldest: history[0]?.timestamp,
          newest: history[history.length - 1]?.timestamp,
        },
      });
    } catch (error: any) {
      console.error("Error fetching price history:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/markets/:address/transactions
   * Get detailed transaction history for a market
   */
  async getTransactions(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string; // Optional filter: BUY, SELL

      const transactions = await dbMarketService.getMarketTransactions(
        address,
        limit
      );

      // Filter by type if specified
      let filteredTxs = transactions;
      if (type && ["BUY", "SELL"].includes(type)) {
        filteredTxs = transactions.filter((tx) => tx.type === type);
      }

      res.json({
        success: true,
        data: filteredTxs,
        count: filteredTxs.length,
        filters: {
          type: type || "all",
          limit,
        },
      });
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/markets/:address/holders
   * Get top token holders for a market
   */
  async getTopHolders(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const holders = await dbMarketService.getTopHolders(address, limit);

      // Calculate percentages
      const totalSupply = holders.reduce(
        (sum, h) => sum + Number(h.balance),
        0
      );

      const holdersWithPercentage = holders.map((holder, index) => ({
        rank: index + 1,
        walletAddress: holder.walletAddress,
        balance: holder.balance.toString(),
        percentage:
          totalSupply > 0
            ? ((Number(holder.balance) / totalSupply) * 100).toFixed(2) + "%"
            : "0%",
        totalBought: holder.totalBought.toString(),
        totalSold: holder.totalSold.toString(),
        firstPurchase: holder.firstPurchase,
        lastActivity: holder.lastActivity,
      }));

      res.json({
        success: true,
        data: holdersWithPercentage,
        count: holdersWithPercentage.length,
        meta: {
          totalHolders: await dbMarketService.getTotalHolderCount(address),
          displayedHolders: holdersWithPercentage.length,
        },
      });
    } catch (error: any) {
      console.error("Error fetching holders:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/markets/:address/24h-stats
   * Get 24-hour statistics for a market
   */
  async get24hStats(req: Request, res: Response) {
    try {
      const { address } = req.params;

      const stats = await dbMarketService.get24hStats(address);

      res.json({
        success: true,
        data: {
          volume24h: stats.volume,
          volume24hSOL: (Number(stats.volume) / 1e9).toFixed(4),
          trades24h: stats.trades,
          priceChange24h: stats.priceChange,
          priceChangePercent24h: stats.priceChangePercent,
          high24h: stats.high24h,
          high24hSOL: (Number(stats.high24h) / 1e9).toFixed(6),
          low24h: stats.low24h,
          low24hSOL: (Number(stats.low24h) / 1e9).toFixed(6),
          uniqueTraders24h: stats.uniqueTraders,
        },
      });
    } catch (error: any) {
      console.error("Error fetching 24h stats:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/portfolio/:wallet
   * Get user's complete portfolio
   */
  async getUserPortfolio(req: Request, res: Response) {
    try {
      const { wallet } = req.params;

      const portfolio = await dbMarketService.getUserPortfolio(wallet);

      // Calculate total portfolio value
      let totalValue = 0n;
      let totalPnL = 0n;

      for (const holding of portfolio) {
        totalValue += BigInt(holding.currentValue);
        totalPnL += BigInt(holding.unrealizedPnL) + BigInt(holding.realizedPnL);
      }

      res.json({
        success: true,
        data: {
          walletAddress: wallet,
          holdings: portfolio,
          summary: {
            totalHoldings: portfolio.length,
            totalValue: totalValue.toString(),
            totalValueSOL: (Number(totalValue) / 1e9).toFixed(4),
            totalPnL: totalPnL.toString(),
            totalPnLSOL: (Number(totalPnL) / 1e9).toFixed(4),
            totalPnLPercent:
              totalValue > 0n
                ? ((Number(totalPnL) / Number(totalValue)) * 100).toFixed(2) +
                  "%"
                : "0%",
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/analytics/platform
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(req: Request, res: Response) {
    try {
      const analytics = await dbMarketService.getPlatformAnalytics();

      // Get top markets
      const topMarkets = await dbMarketService.getTopMarketsByVolume(10);

      // Get recent activity
      const recentActivity = await dbMarketService.getRecentPlatformActivity(
        20
      );

      res.json({
        success: true,
        data: {
          overview: {
            totalMarkets: analytics.totalMarkets,
            totalTransactions: analytics.totalTransactions,
            totalVolume: analytics.totalVolume,
            totalVolumeSOL: (Number(analytics.totalVolume) / 1e9).toFixed(2),
            activeUsers: analytics.activeUsers,
            totalFees: analytics.totalFees,
            totalFeesSOL: (Number(analytics.totalFees) / 1e9).toFixed(2),
          },
          topMarkets: topMarkets,
          recentActivity: recentActivity,
        },
      });
    } catch (error: any) {
      console.error("Error fetching platform analytics:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/markets/:address/volume-chart
   * Get volume data for volume chart
   */
  async getVolumeChart(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const interval = (req.query.interval as string) || "ONE_DAY";
      const limit = parseInt(req.query.limit as string) || 30;

      const volumeData = await dbMarketService.getVolumeData(
        address,
        interval,
        limit
      );

      res.json({
        success: true,
        data: volumeData,
        count: volumeData.length,
      });
    } catch (error: any) {
      console.error("Error fetching volume chart:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/leaderboard
   * Get market leaderboard ranked by various metrics
   */
  async getLeaderboard(req: Request, res: Response) {
    try {
      const sortBy = (req.query.sortBy as string) || "marketCap"; // marketCap, volume, trades, holders
      const limit = parseInt(req.query.limit as string) || 20;

      const leaderboard = await dbMarketService.getLeaderboard(sortBy, limit);

      res.json({
        success: true,
        data: leaderboard,
        count: leaderboard.length,
        sortedBy: sortBy,
      });
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/search
   * Search markets by name, symbol, or address
   */
  async searchMarkets(req: Request, res: Response) {
    try {
      const query = req.query.q as string;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters",
        });
      }

      const results = await dbMarketService.searchMarkets(query);

      res.json({
        success: true,
        data: results,
        count: results.length,
        query: query,
      });
    } catch (error: any) {
      console.error("Error searching markets:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/trending
   * Get trending markets (most active in last 24h)
   */
  async getTrendingMarkets(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const trending = await dbMarketService.getTrendingMarkets(limit);

      res.json({
        success: true,
        data: trending,
        count: trending.length,
      });
    } catch (error: any) {
      console.error("Error fetching trending markets:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/user/:wallet/activity
   * Get user's complete trading activity
   */
  async getUserActivity(req: Request, res: Response) {
    try {
      const { wallet } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = req.query.type as string; // Optional: BUY, SELL

      const activity = await dbMarketService.getUserActivity(
        wallet,
        limit,
        type
      );

      res.json({
        success: true,
        data: activity,
        count: activity.length,
        filters: {
          type: type || "all",
          limit,
        },
      });
    } catch (error: any) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/user/:wallet/stats
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const { wallet } = req.params;

      const stats = await dbMarketService.getUserStats(wallet);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
