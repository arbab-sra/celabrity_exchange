import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller.js";
import {
  validateAddress,
  validatePositiveNumber,
  validateRequired,
  validateStringLength,
} from "../middleware/validation.middleware.js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const transactionController = new TransactionController();

// ==========================================
// MARKET CREATION
// ==========================================
/**
 * Prepare create market transaction (USER PAYS - PRODUCTION)
 * Returns partially signed transaction for user to sign
 */
router.post(
  "/prepare-create-market",
  validateAddress("userWallet"),
  validatePositiveNumber("initialPrice"),
  validatePositiveNumber("initialSupply"),
  validateRequired("name"),
  validateRequired("symbol"),
  validateStringLength("name", 32),
  validateStringLength("symbol", 10),
  transactionController.prepareCreateMarket
);

/**
 * Confirm market creation after user signs transaction
 */
router.post(
  "/confirm-create-market",
  validateAddress("marketAddress"),
  validateAddress("userWallet"),
  transactionController.confirmCreateMarket
);

// ==========================================
// BUY TRANSACTIONS
// ==========================================

/**
 * Buy tokens (server pays) - For testing/airdrops only
 */
router.post("/buy-tokens", transactionController.buyTokensServerPaid);

/**
 * Prepare buy transaction (USER PAYS - PRODUCTION)
 * Returns transaction for user to sign
 */
router.post(
  "/buy-tokens-user-pays",
  validateAddress("marketAddress"),
  validateAddress("userWallet"),
  validatePositiveNumber("amount"),
  transactionController.buyTokensUserPays
);

/**
 * Confirm buy transaction after user signs
 */
router.post("/confirm-buy", transactionController.confirmBuyTransaction);

// ==========================================
// SELL TRANSACTIONS
// ==========================================

/**
 * Prepare sell transaction (user signs and broadcasts)
 */
router.post("/sell-tokens", transactionController.prepareSellTransaction);

/**
 * Confirm sell transaction after user signs
 */
router.post("/confirm-sell", transactionController.confirmSellTransaction);

// ==========================================
// UTILITIES
// ==========================================

/**
 * Calculate price impact before trade
 */
router.post("/calculate-price", transactionController.calculatePrice);

/**
 * Get server wallet public key (for debugging)
 */
router.get("/server-wallet", transactionController.getServerWallet);

export default router;
