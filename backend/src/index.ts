import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import marketRoutes from "../src/routes/market.routes.js";
import transactionRoutes from "../src/routes/transaction.routes.js";
import { indexer } from "../src/services/indexer.service.js";
import { prisma } from "../src/services/prisma.service.js";
// import {
//   apiLimiter,
//   transactionLimiter,
//   createMarketLimiter,
// } from "./middleware/rateLimit.middleware";
import { requestLogger } from "../src/middleware/logger.middleware.js";
import { getConnection } from "../src/config/solana.config.js";
import creatorRoutes from "./routes/creator.routes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check routes
app.get("/", (req, res) => {
  res.json({
    message: "Celebrity Exchange API",
    status: "running",
    version: "1.0.0",
  });
});

app.get("/health", async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Solana connection
    const connection = getConnection();
    const blockHeight = await connection.getBlockHeight();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        solana: "connected",
        blockHeight: blockHeight,
      },
      version: process.env.npm_package_version || "1.0.0",
    });
  } catch (error: any) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API Routes
app.use("/api", marketRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/creator", creatorRoutes);
// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// ✅ Only start server in development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, async () => {
    console.log(`🚀 Celebrity Exchange Backend running on port ${PORT}`);
    console.log(`📊 Market API: http://localhost:${PORT}/api`);
    console.log(
      `💰 Transaction API: http://localhost:${PORT}/api/transactions`
    );
    console.log(`🏥 Health: http://localhost:${PORT}/health`);

    // ✅ Start blockchain indexer in development
    // if (process.env.INDEXER_ENABLED === "true") {
    //   await indexer.start();
    // }
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    indexer.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
} 
export default app;
