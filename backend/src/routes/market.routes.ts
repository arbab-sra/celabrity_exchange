import { Router } from "express";
import { MarketController } from "../controllers/market.controller.js";
import dotenv from "dotenv";
dotenv.config();
const router = Router();
const marketController = new MarketController();

// ==========================================
// EXISTING ROUTES
// ==========================================
router.get("/markets", marketController.getAllMarkets);
router.get("/markets/address/:address", marketController.getMarketByAddress);
router.get("/markets/mint/:mint", marketController.getMarketByMint);
router.get("/markets/owner/:owner", marketController.getMarketsByOwner);
router.get("/markets/:address/stats", marketController.getMarketStats);
router.get("/markets/:address/trades", marketController.getRecentTrades);
router.post("/calculate-price", marketController.calculatePrice);

// ==========================================
// NEW DYNAMIC DATA ROUTES (ADD THESE)
// ==========================================
router.get("/markets/:address/price-history", marketController.getPriceHistory);
router.get("/markets/:address/transactions", marketController.getTransactions);
router.get("/markets/:address/holders", marketController.getTopHolders);
router.get("/markets/:address/24h-stats", marketController.get24hStats);
router.get("/markets/:address/volume-chart", marketController.getVolumeChart);

// Portfolio & User
router.get("/portfolio/:wallet", marketController.getUserPortfolio);
router.get("/user/:wallet/activity", marketController.getUserActivity);
router.get("/user/:wallet/stats", marketController.getUserStats);

// Platform Analytics
router.get("/analytics/platform", marketController.getPlatformAnalytics);
router.get("/leaderboard", marketController.getLeaderboard);
router.get("/trending", marketController.getTrendingMarkets);
router.get("/search", marketController.searchMarkets);

export default router;
