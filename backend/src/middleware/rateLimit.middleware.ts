import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();
// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Transaction rate limit (stricter)
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 transactions per minute
  message: {
    success: false,
    error: "Too many transactions, please slow down.",
  },
});

// Create market rate limit (very strict)
export const createMarketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 markets per hour
  message: {
    success: false,
    error: "Market creation limit reached. Please try again later.",
  },
});
