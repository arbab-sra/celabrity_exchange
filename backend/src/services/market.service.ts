import { PublicKey, GetProgramAccountsFilter } from "@solana/web3.js";
import {
  getConnection,
  PROGRAM_ID,
  MARKET_DISCRIMINATOR,
  MarketAccount,
} from "../config/solana.config.js";
import bs58 from "bs58";
import dotenv from "dotenv";
dotenv.config();
export class MarketService {
  private connection = getConnection();

  private parseMarketAccount(data: Buffer, publicKey: PublicKey) {
    const market = MarketAccount.deserialize(data);
    return {
      publicKey: publicKey.toString(),
      owner: market.owner.toString(),
      mint: market.mint.toString(),
      escrow: market.escrow.toString(),
      treasury: market.treasury.toString(),
      currentPrice: market.currentPrice.toString(),
      totalSupply: market.totalSupply.toString(),
      tradeCount: market.tradeCount.toString(),
    };
  }

  async getAllMarkets() {
    try {
      const filters: GetProgramAccountsFilter[] = [
        {
          memcmp: {
            offset: 0,
            bytes: bs58.encode(MARKET_DISCRIMINATOR),
          },
        },
      ];

      const accounts = await this.connection.getProgramAccounts(PROGRAM_ID, {
        filters,
      });

      return accounts.map((account) =>
        this.parseMarketAccount(account.account.data, account.pubkey)
      );
    } catch (error) {
      throw new Error(`Failed to fetch markets: ${error}`);
    }
  }

  async getMarketByAddress(marketAddress: string) {
    try {
      const marketPubkey = new PublicKey(marketAddress);
      const accountInfo = await this.connection.getAccountInfo(marketPubkey);

      if (!accountInfo) {
        throw new Error("Market account not found");
      }

      return this.parseMarketAccount(accountInfo.data, marketPubkey);
    } catch (error) {
      throw new Error(`Market not found: ${error}`);
    }
  }

  async getMarketByMint(mintAddress: string) {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), mintPubkey.toBuffer()],
        PROGRAM_ID
      );

      return await this.getMarketByAddress(marketPDA.toString());
    } catch (error) {
      throw new Error(`Failed to find market by mint: ${error}`);
    }
  }

  async getMarketsByOwner(ownerAddress: string) {
    try {
      const ownerPubkey = new PublicKey(ownerAddress);

      const filters: GetProgramAccountsFilter[] = [
        {
          memcmp: {
            offset: 0,
            bytes: bs58.encode(MARKET_DISCRIMINATOR),
          },
        },
        {
          memcmp: {
            offset: 8,
            bytes: ownerPubkey.toBase58(),
          },
        },
      ];

      const accounts = await this.connection.getProgramAccounts(PROGRAM_ID, {
        filters,
      });

      return accounts.map((account) =>
        this.parseMarketAccount(account.account.data, account.pubkey)
      );
    } catch (error) {
      throw new Error(`Failed to fetch markets by owner: ${error}`);
    }
  }

  async getMarketStats(marketAddress: string) {
    try {
      const market = await this.getMarketByAddress(marketAddress);
      const currentPrice = BigInt(market.currentPrice);
      const totalSupply = BigInt(market.totalSupply);
      const tradeCount = BigInt(market.tradeCount);

      const marketCap = currentPrice * totalSupply;
      const avgTradeSize = tradeCount > 0n ? totalSupply / tradeCount : 0n;

      return {
        ...market,
        marketCap: marketCap.toString(),
        averageTradeSize: avgTradeSize.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to calculate market stats: ${error}`);
    }
  }

  async getRecentTrades(marketAddress: string, limit: number = 10) {
    try {
      const marketPubkey = new PublicKey(marketAddress);

      const signatures = await this.connection.getSignaturesForAddress(
        marketPubkey,
        { limit }
      );

      const trades = [];
      for (const sig of signatures) {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx && tx.meta) {
          trades.push({
            signature: sig.signature,
            timestamp: tx.blockTime,
            success: tx.meta.err === null,
            fee: tx.meta.fee,
          });
        }
      }

      return trades;
    } catch (error) {
      throw new Error(`Failed to fetch recent trades: ${error}`);
    }
  }

  calculatePrice(
    currentPrice: string,
    amount: string,
    totalSupply: string,
    isBuy: boolean
  ): string {
    const k = 0.000001; // Curve parameter
    const price = Number(currentPrice);
    const amt = Number(amount);
    const supply = Number(totalSupply);

    let newPrice: number;
    if (isBuy) {
      const newSupply = supply + amt;
      const growthFactor = newSupply / supply;
      newPrice = price * (1 + (growthFactor - 1) * (1 + k * newSupply));
    } else {
      const newSupply = supply - amt;
      const reductionFactor = newSupply / supply;
      newPrice = price * reductionFactor * (1 - k * amt);
    }

    return Math.floor(Math.max(newPrice, 1000)).toString();
  }
  calculateMarketCap(currentPrice: string, totalSupply: string): string {
    const price = BigInt(currentPrice);
    const supply = BigInt(totalSupply);
    return (price * supply).toString();
  }
}
