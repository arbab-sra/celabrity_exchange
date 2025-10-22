import { Request, Response } from "express";
import { TransactionService } from "../services/transaction.service.js";
import dotenv from "dotenv";
dotenv.config();

const transactionService = new TransactionService();

export class TransactionController {

  /**
   * Prepare create market transaction (USER PAYS - NEW METHOD)
   * POST /api/transactions/prepare-create-market
   */
  async prepareCreateMarket(req: Request, res: Response) {
    try {
      const {
        userWallet,
        initialPrice,
        initialSupply,
        name,
        symbol,
        description,
        imageUrl,
      } = req.body;

      // Validation
      if (!userWallet || !initialPrice || !initialSupply || !name || !symbol) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: userWallet, initialPrice, initialSupply, name, symbol",
        });
      }

      if (initialPrice <= 0 || initialSupply <= 0) {
        return res.status(400).json({
          success: false,
          error: "initialPrice and initialSupply must be positive numbers",
        });
      }

      // Validate name and symbol length
      if (name.length > 32) {
        return res.status(400).json({
          success: false,
          error: "Token name must be 32 characters or less",
        });
      }

      if (symbol.length > 10) {
        return res.status(400).json({
          success: false,
          error: "Token symbol must be 10 characters or less",
        });
      }

      const initialPriceLamports = Math.floor(initialPrice);
      const initialSupplyAmount = Math.floor(initialSupply);

      const result = await transactionService.prepareCreateMarket(
        userWallet,
        initialPriceLamports,
        initialSupplyAmount,
        name,
        symbol,
        description || "",
        imageUrl || ""
      );

      res.json({
        success: true,
        data: result,
        message: "Market creation transaction prepared. Sign with your wallet.",
      });
    } catch (error: any) {
      console.error("Error preparing create market:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Confirm market creation after user signs
   * POST /api/transactions/confirm-create-market
   */
  async confirmCreateMarket(req: Request, res: Response) {
    try {
      const { signature, marketAddress, userWallet } = req.body;

      if (!signature || !marketAddress || !userWallet) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: signature, marketAddress, userWallet",
        });
      }

      const result = await transactionService.confirmCreateMarket(
        signature,
        marketAddress,
        userWallet
      );

      res.json({
        success: true,
        data: result,
        message: "Market creation confirmed",
      });
    } catch (error: any) {
      console.error("Error confirming market creation:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Buy tokens (server pays) - For testing/airdrops/premotions
   * POST /api/transactions/buy-tokens
   */
  async buyTokensServerPaid(req: Request, res: Response) {
    try {
      const { marketAddress, destinationWallet, amount } = req.body;

      if (!marketAddress || !destinationWallet || !amount) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: marketAddress, destinationWallet, amount",
        });
      }

      const result = await transactionService.buyTokensServerPaid(
        marketAddress,
        destinationWallet,
        Number(amount)
      );

      res.json({
        success: true,
        data: result,
        message: "Tokens purchased successfully (server paid)",
      });
    } catch (error: any) {
      console.error("Error buying tokens:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Prepare buy transaction (user pays) - PRODUCTION
   * POST /api/transactions/buy-tokens-user-pays
   */
  async buyTokensUserPays(req: Request, res: Response) {
    try {
      const { marketAddress, userWallet, amount } = req.body;

      if (!marketAddress || !userWallet || !amount) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: marketAddress, userWallet, amount",
        });
      }

      const result = await transactionService.prepareBuyTransaction(
        marketAddress,
        userWallet,
        Number(amount)
      );

      res.json({
        success: true,
        data: result,
        message: "Transaction prepared. Please sign with your wallet.",
      });
    } catch (error: any) {
      console.error("Error preparing buy transaction:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Prepare sell transaction
   * POST /api/transactions/sell-tokens
   */
  async prepareSellTransaction(req: Request, res: Response) {
    try {
      const { marketAddress, userWallet, amount, minReceive } = req.body;

      if (!marketAddress || !userWallet || !amount) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: marketAddress, userWallet, amount",
        });
      }

      const result = await transactionService.prepareSellTransaction(
        marketAddress,
        userWallet,
        Number(amount),
        minReceive ? Number(minReceive) : undefined
      );

      res.json({
        success: true,
        data: result,
        message: "Sell transaction prepared",
      });
    } catch (error: any) {
      console.error("Error preparing sell transaction:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Confirm buy transaction after user signs
   * POST /api/transactions/confirm-buy
   */
  async confirmBuyTransaction(req: Request, res: Response) {
    try {
      const { signature, marketAddress, userWallet, amount } = req.body;

      if (!signature || !marketAddress || !userWallet || !amount) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: signature, marketAddress, userWallet, amount",
        });
      }

      const result = await transactionService.confirmBuyTransaction(
        signature,
        marketAddress,
        userWallet,
        Number(amount)
      );

      res.json({
        success: true,
        data: result,
        message: "Buy transaction confirmed",
      });
    } catch (error: any) {
      console.error("Error confirming buy transaction:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Confirm sell transaction after user signs
   * POST /api/transactions/confirm-sell
   */
  async confirmSellTransaction(req: Request, res: Response) {
    try {
      const { signature, marketAddress, userWallet, amount } = req.body;

      if (!signature || !marketAddress || !userWallet || !amount) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: signature, marketAddress, userWallet, amount",
        });
      }

      const result = await transactionService.confirmSellTransaction(
        signature,
        marketAddress,
        userWallet,
        Number(amount)
      );

      res.json({
        success: true,
        data: result,
        message: "Sell transaction confirmed",
      });
    } catch (error: any) {
      console.error("Error confirming sell transaction:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Calculate price impact
   * POST /api/transactions/calculate-price
   */
  async calculatePrice(req: Request, res: Response) {
    try {
      const { currentPrice, amount, totalSupply, isBuy } = req.body;

      // Validation
      if (!currentPrice || !amount || !totalSupply || isBuy === undefined) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: currentPrice, amount, totalSupply, isBuy",
        });
      }

      const currentPriceNum = parseFloat(currentPrice);
      const amountNum = parseFloat(amount);
      const totalSupplyNum = parseFloat(totalSupply);

      if (isNaN(currentPriceNum) || isNaN(amountNum) || isNaN(totalSupplyNum)) {
        return res.status(400).json({
          success: false,
          error: "Invalid numeric values provided",
        });
      }

      if (currentPriceNum <= 0 || amountNum <= 0 || totalSupplyNum <= 0) {
        return res.status(400).json({
          success: false,
          error: "All values must be positive numbers",
        });
      }

      // Bonding curve formula
      const k = 0.000001;
      let newPrice: number;

      if (isBuy) {
        const newSupply = totalSupplyNum + amountNum;
        const supplyGrowthFactor = newSupply / totalSupplyNum;
        newPrice =
          currentPriceNum *
          (1 + (supplyGrowthFactor - 1) * (1 + k * newSupply));
      } else {
        const newSupply = totalSupplyNum - amountNum;

        if (newSupply <= 0) {
          return res.status(400).json({
            success: false,
            error: "Cannot sell more tokens than total supply",
          });
        }

        const supplyReductionFactor = newSupply / totalSupplyNum;
        newPrice =
          currentPriceNum * supplyReductionFactor * (1 - k * amountNum);
      }

      const minimumPrice = 1000;
      newPrice = Math.max(newPrice, minimumPrice);

      const priceChange = newPrice - currentPriceNum;
      const priceChangePercent = (priceChange / currentPriceNum) * 100;

      const averagePrice = (currentPriceNum + newPrice) / 2;
      const totalCost = averagePrice * amountNum;
      const platformFee = totalCost * 0.01;
      const totalWithFee = totalCost + platformFee;

      res.json({
        success: true,
        data: {
          currentPrice: currentPrice,
          currentPriceSOL: (currentPriceNum / 1e9).toFixed(9),
          newPrice: Math.floor(newPrice).toString(),
          newPriceSOL: (newPrice / 1e9).toFixed(9),
          priceChange: Math.floor(priceChange).toString(),
          priceChangeSOL: (priceChange / 1e9).toFixed(9),
          priceChangePercent: priceChangePercent.toFixed(4) + "%",
          priceImpact: Math.abs(priceChangePercent).toFixed(4) + "%",
          averagePrice: Math.floor(averagePrice).toString(),
          averagePriceSOL: (averagePrice / 1e9).toFixed(9),
          totalCost: Math.floor(totalCost).toString(),
          totalCostSOL: (totalCost / 1e9).toFixed(6),
          platformFee: Math.floor(platformFee).toString(),
          platformFeeSOL: (platformFee / 1e9).toFixed(6),
          totalWithFee: Math.floor(totalWithFee).toString(),
          totalWithFeeSOL: (totalWithFee / 1e9).toFixed(6),
          amount: amount,
          isBuy: isBuy,
          message: isBuy
            ? `Buying ${amount} tokens will increase price by ${Math.abs(
                priceChangePercent
              ).toFixed(2)}%`
            : `Selling ${amount} tokens will decrease price by ${Math.abs(
                priceChangePercent
              ).toFixed(2)}%`,
        },
      });
    } catch (error: any) {
      console.error("Error calculating price:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get server wallet info (for debugging)
   * GET /api/transactions/server-wallet
   */
  async getServerWallet(req: Request, res: Response) {
    try {
      const wallet = transactionService.getServerWallet();

      res.json({
        success: true,
        data: {
          publicKey: wallet.publicKey,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
