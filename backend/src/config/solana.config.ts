import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, Idl } from "@coral-xyz/anchor";
import * as borsh from "borsh";
import dotenv from 'dotenv'
dotenv.config()
export const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);
export const RPC_ENDPOINT =
  process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";

export const getConnection = (): Connection => {
  return new Connection(RPC_ENDPOINT, "confirmed");
};

// Market account discriminator (first 8 bytes)
export const MARKET_DISCRIMINATOR = Buffer.from([
  219, 190, 213, 55, 0, 227, 198, 154,
]);

// Define the Market account structure for Borsh deserialization
export class MarketAccount {
  owner: PublicKey;
  mint: PublicKey;
  escrow: PublicKey;
  treasury: PublicKey;
  currentPrice: bigint;
  totalSupply: bigint;
  tradeCount: bigint;

  constructor(fields: any) {
    this.owner = fields.owner;
    this.mint = fields.mint;
    this.escrow = fields.escrow;
    this.treasury = fields.treasury;
    this.currentPrice = fields.currentPrice;
    this.totalSupply = fields.totalSupply;
    this.tradeCount = fields.tradeCount;
  }

  static schema = new Map([
    [
      MarketAccount,
      {
        kind: "struct",
        fields: [
          ["owner", [32]],
          ["mint", [32]],
          ["escrow", [32]],
          ["treasury", [32]],
          ["currentPrice", "u64"],
          ["totalSupply", "u64"],
          ["tradeCount", "u64"],
        ],
      },
    ],
  ]);

  static deserialize(data: Buffer): MarketAccount {
    // Skip the 8-byte discriminator
    const accountData = data.slice(8);

    // Manual deserialization
    let offset = 0;

    const owner = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;

    const mint = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;

    const escrow = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;

    const treasury = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;

    const currentPrice = accountData.readBigUInt64LE(offset);
    offset += 8;

    const totalSupply = accountData.readBigUInt64LE(offset);
    offset += 8;

    const tradeCount = accountData.readBigUInt64LE(offset);

    return new MarketAccount({
      owner,
      mint,
      escrow,
      treasury,
      currentPrice,
      totalSupply,
      tradeCount,
    });
  }
}
