import { Router } from "express";
import { prisma } from "../services/prisma.service.js";

const router = Router();

/**
 * Get creator earnings summary
 * GET /api/creator/:walletAddress/earnings
 */
router.get("/:walletAddress/earnings", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Get user creator stats
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    // Get markets created by user
    const markets = await prisma.market.findMany({
      where: { owner: walletAddress },
      select: {
        id: true,
        publicKey: true,
        name: true,
        symbol: true,
        totalCreatorFees: true,
        totalPlatformFees: true,
        tradeCount: true,
        createdAt: true,
      },
      orderBy: { totalCreatorFees: "desc" },
    });

    // Get recent fee transactions
    const recentFees = await prisma.transaction.findMany({
      where: {
        market: { owner: walletAddress },
        creatorFee: { gt: 0 },
      },
      select: {
        signature: true,
        type: true,
        creatorFee: true,
        platformFee: true,
        totalFee: true,
        blockTime: true,
        market: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: { blockTime: "desc" },
      take: 50,
    });

    const totalEarnings = user?.totalEarningsAsCreator || BigInt(0);

    res.json({
      success: true,
      data: {
        walletAddress,
        totalEarnings: totalEarnings.toString(),
        totalEarningsSOL: (Number(totalEarnings) / 1e9).toFixed(6),
        marketsCreated: markets.length,
        markets: markets.map((m) => ({
          id: m.id,
          publicKey: m.publicKey,
          name: m.name,
          symbol: m.symbol,
          // ✅ No null checks needed - always has default value
          totalCreatorFees: m.totalCreatorFees.toString(),
          totalCreatorFeesSOL: (Number(m.totalCreatorFees) / 1e9).toFixed(6),
          totalPlatformFees: m.totalPlatformFees.toString(),
          totalPlatformFeesSOL: (Number(m.totalPlatformFees) / 1e9).toFixed(6),
          tradeCount: m.tradeCount,
          createdAt: m.createdAt,
        })),
        recentFees: recentFees.map((f) => ({
          signature: f.signature,
          type: f.type,
          // ✅ No null checks needed
          creatorFee: f.creatorFee.toString(),
          creatorFeeSOL: (Number(f.creatorFee) / 1e9).toFixed(6),
          platformFee: f.platformFee.toString(),
          platformFeeSOL: (Number(f.platformFee) / 1e9).toFixed(6),
          totalFee: f.totalFee.toString(),
          totalFeeSOL: (Number(f.totalFee) / 1e9).toFixed(6),
          blockTime: f.blockTime,
          market: f.market,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching creator earnings:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get creator leaderboard
 * GET /api/creator/leaderboard
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const creators = await prisma.user.findMany({
      where: {
        totalEarningsAsCreator: { gt: 0 },
      },
      select: {
        walletAddress: true,
        username: true,
        avatar: true,
        totalEarningsAsCreator: true,
        marketsCreated: true,
      },
      orderBy: { totalEarningsAsCreator: "desc" },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: creators.map((c, index) => ({
        rank: index + 1,
        walletAddress: c.walletAddress,
        username: c.username,
        avatar: c.avatar,
        totalEarningsAsCreator: c.totalEarningsAsCreator.toString(),
        totalEarningsSOL: (Number(c.totalEarningsAsCreator) / 1e9).toFixed(6),
        marketsCreated: c.marketsCreated,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching creator leaderboard:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get platform-wide creator stats
 * GET /api/creator/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await prisma.user.aggregate({
      _sum: {
        totalEarningsAsCreator: true,
      },
      _count: {
        totalEarningsAsCreator: true,
      },
      where: {
        totalEarningsAsCreator: { gt: 0 },
      },
    });

    const totalMarkets = await prisma.market.count({
      where: {
        totalCreatorFees: { gt: 0 },
      },
    });

    res.json({
      success: true,
      data: {
        totalCreators: stats._count.totalEarningsAsCreator,
        totalEarningsAllCreators: (
          stats._sum.totalEarningsAsCreator || BigInt(0)
        ).toString(),
        totalEarningsAllCreatorsSOL: (
          Number(stats._sum.totalEarningsAsCreator || BigInt(0)) / 1e9
        ).toFixed(6),
        totalMarketsWithFees: totalMarkets,
      },
    });
  } catch (error: any) {
    console.error("Error fetching creator stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
