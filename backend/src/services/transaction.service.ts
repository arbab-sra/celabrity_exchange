import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { getConnection, PROGRAM_ID } from "../config/solana.config.js";
import { DISCRIMINATORS } from "../utils/discriminators.js";
import { UploadService } from "./upload.service.js";
import { prisma } from "./prisma.service.js";
import * as fs from "fs";
import dotenv from "dotenv";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
dotenv.config();
const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
let localKey: number[] | undefined;
try {
  localKey = require("./server-keypair.json");
} catch (e) {
  localKey = undefined;
}

export class TransactionService {
  private connection: Connection;
  private serverKeypair: Keypair;
  private uploadService: UploadService;
  private platformFeeWallet: PublicKey;

  constructor() {
    this.connection = getConnection();

    try {
      let secretKey: Uint8Array;
      const envKey = process.env.SERVER_PRIVATE_KEY;
      if (envKey) {
        console.log("📍 Loading keypair from environment variable");
        try {
          secretKey = bs58.decode(envKey);
          console.log("✅ Loaded base58 encoded keypair", secretKey);
        } catch (e) {
          // Try JSON array format
          const keyArray = JSON.parse(envKey);
          secretKey = Uint8Array.from(keyArray);
          console.log("✅ Loaded JSON array keypair");
        }
      } else if (localKey) {
        console.log("📍 Loading keypair from local file");
        secretKey = Uint8Array.from(localKey);
        console.log("✅ Loaded keypair from server-keypair.json");
      } else {
        throw new Error(
          "❌ No keypair found! Set SERVER_PRIVATE_KEY environment variable or create server-keypair.json"
        );
      }

      this.serverKeypair = Keypair.fromSecretKey(secretKey);
    } catch (error: any) {
      console.error("❌ Failed to load server keypair:", error.message);
      throw error;
    }

    this.platformFeeWallet = new PublicKey(
      process.env.PLATFORM_FEE_WALLET || this.serverKeypair.publicKey.toString()
    );

    this.uploadService = new UploadService();

    console.log("✅ Transaction Service initialized");
    console.log("📍 Server Wallet:", this.serverKeypair.publicKey.toString());
    console.log("💰 Platform Fee Wallet:", this.platformFeeWallet.toString());
    console.log("💰 Program ID:", PROGRAM_ID.toString());
  }

  private serializeU64(value: number | bigint): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(value));
    return buffer;
  }

  private serializeString(str: string): Buffer {
    const stringBytes = Buffer.from(str, "utf8");
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(stringBytes.length);
    return Buffer.concat([lengthBuffer, stringBytes]);
  }

  private getMetadataPDA(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );
  }

  private async updateHolderInDb(
    marketId: string,
    walletAddress: string,
    type: "BUY" | "SELL",
    amount: number,
    pricePerToken: number
  ) {
    try {
      console.log("📊 Updating holder:", {
        marketId,
        walletAddress,
        type,
        amount,
        pricePerToken,
      });

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
          balance: type === "BUY" ? BigInt(amount) : BigInt(0),
          totalBought: type === "BUY" ? BigInt(amount) : BigInt(0),
          totalSold: type === "SELL" ? BigInt(amount) : BigInt(0),
          averageBuyPrice: type === "BUY" ? BigInt(pricePerToken) : BigInt(0),
          firstPurchase: new Date(),
          lastActivity: new Date(),
        },
        update: {
          balance:
            type === "BUY"
              ? { increment: BigInt(amount) }
              : { decrement: BigInt(amount) },
          totalBought:
            type === "BUY" ? { increment: BigInt(amount) } : undefined,
          totalSold:
            type === "SELL" ? { increment: BigInt(amount) } : undefined,
          lastActivity: new Date(),
        },
      });

      console.log("✅ Holder updated:", {
        walletAddress,
        type,
        newBalance: holder.balance.toString(),
        totalBought: holder.totalBought.toString(),
        totalSold: holder.totalSold.toString(),
      });

      // Update average buy price for buys
      if (type === "BUY" && holder) {
        const totalCost =
          holder.averageBuyPrice * (holder.balance - BigInt(amount)) +
          BigInt(pricePerToken) * BigInt(amount);
        const newAverage =
          holder.balance > BigInt(0) ? totalCost / holder.balance : BigInt(0);

        await prisma.holder.update({
          where: { id: holder.id },
          data: { averageBuyPrice: newAverage },
        });

        console.log("✅ Average buy price updated:", newAverage.toString());
      }

      // Calculate realized P&L for sells
      if (type === "SELL" && holder) {
        const profit =
          (BigInt(pricePerToken) - holder.averageBuyPrice) * BigInt(amount);

        await prisma.holder.update({
          where: { id: holder.id },
          data: { realizedPnL: { increment: profit } },
        });

        console.log("✅ Realized P&L updated:", {
          profit: profit.toString(),
          newRealizedPnL: (holder.realizedPnL + profit).toString(),
        });
      }

      // ✅ NEW: Delete holder record if balance is zero or negative
      if (holder.balance <= BigInt(0)) {
        console.log("🗑️ Removing holder with zero balance:", walletAddress);

        await prisma.holder.delete({
          where: { id: holder.id },
        });

        console.log("✅ Holder removed from database (zero balance)");
      }

      console.log("✅ Holder update complete");
    } catch (error) {
      console.error("❌ Error updating holder:", error);
      throw error; // ✅ Throw error to stop transaction confirmation
    }
  }

  private async updatePriceHistoryInDb(
    marketId: string,
    pricePerToken: number,
    amount: number,
    timestamp: Date
  ) {
    try {
      // Update for multiple intervals
      const intervals = ["ONE_MINUTE", "FIVE_MINUTES", "ONE_HOUR", "ONE_DAY"];

      for (const interval of intervals) {
        let roundedTime: Date;
        const ts = timestamp.getTime();

        switch (interval) {
          case "ONE_MINUTE":
            roundedTime = new Date(Math.floor(ts / 60000) * 60000);
            break;
          case "FIVE_MINUTES":
            roundedTime = new Date(Math.floor(ts / 300000) * 300000);
            break;
          case "ONE_HOUR":
            roundedTime = new Date(Math.floor(ts / 3600000) * 3600000);
            break;
          case "ONE_DAY":
            roundedTime = new Date(
              timestamp.getFullYear(),
              timestamp.getMonth(),
              timestamp.getDate()
            );
            break;
          default:
            roundedTime = timestamp;
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
            price: BigInt(pricePerToken),
            volume: BigInt(amount),
            trades: 1,
            timestamp: roundedTime,
            interval: interval as any,
          },
          update: {
            price: BigInt(pricePerToken),
            volume: { increment: BigInt(amount) },
            trades: { increment: 1 },
          },
        });
      }

      console.log("✅ Price history updated in database");
    } catch (error) {
      console.error("❌ Error updating price history:", error);
    }
  }

  private calculateBondingCurvePrice(circulatingSupply: number): number {
    const BASE_PRICE = 1_000_000; // 0.001 SOL in lamports
    const K_FACTOR = 5;
    const SCALE_FACTOR = 10_000;

    if (circulatingSupply === 0) {
      return BASE_PRICE;
    }

    // ✅ CRITICAL FIX: Use integer division like Rust (no floating point)
    const exponent = Math.floor((circulatingSupply * K_FACTOR) / SCALE_FACTOR);

    let price: number;

    if (exponent < 10) {
      // ✅ Match Rust exactly: integer arithmetic only
      const multiplier =
        10000 +
        exponent * 10000 +
        Math.floor((exponent * exponent * 5000) / 10000);
      price = Math.floor((BASE_PRICE * multiplier) / 10000);
    } else {
      // ✅ Use same power calculation as Rust
      const cappedExponent = Math.min(exponent, 20);
      price = Math.floor(BASE_PRICE * Math.pow(2, cappedExponent));
    }

    const finalPrice = Math.max(price, BASE_PRICE);

    // ✅ Add logging for debugging
    console.log(`🔢 Price calculation for supply ${circulatingSupply}:`, {
      exponent,
      price,
      finalPrice,
    });

    return finalPrice;
  }

  private calculateBuyCost(fromSupply: number, toSupply: number): number {
    let totalCost = 0;

    for (let i = fromSupply; i < toSupply; i++) {
      const price = this.calculateBondingCurvePrice(i);
      totalCost += price;
    }

    return Math.floor(totalCost);
  }

  private calculateSellValue(fromSupply: number, toSupply: number): number {
    return this.calculateBuyCost(toSupply, fromSupply);
  }

  private async saveTransactionToDb(
    signature: string,
    marketAddress: string,
    type: "BUY" | "SELL" | "CREATE_MARKET",
    userWallet: string,
    amount: number,
    pricePerToken: number,
    totalCost: number,
    platformFee: number,
    creatorFee: number = 0 // ✅ NEW parameter
  ) {
    try {
      console.log("💾 Saving transaction to database:", signature);

      const market = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
      });

      if (!market) {
        console.log("⚠️ Market not found in database:", marketAddress);
        return;
      }

      const totalFee = platformFee + creatorFee;

      // Save transaction
      await prisma.transaction.create({
        data: {
          signature,
          marketId: market.id,
          type,
          userWallet,
          amount: BigInt(amount),
          pricePerToken: BigInt(pricePerToken),
          totalValue: BigInt(totalCost),
          platformFee: BigInt(platformFee),
          creatorFee: BigInt(creatorFee), // ✅ NEW
          totalFee: BigInt(totalFee), // ✅ NEW
          status: "CONFIRMED",
          blockTime: new Date(),
        },
      });

      console.log("✅ Transaction saved:", {
        type,
        totalValue: totalCost,
        platformFee,
        creatorFee,
        totalFee,
      });
      // Update holder balance
      if (type === "BUY" || type === "SELL") {
        await this.updateHolderInDb(
          market.id,
          userWallet,
          type,
          amount,
          pricePerToken
        );
      }

      // ✅ NEW: Update market fee totals
      await prisma.market.update({
        where: { id: market.id },
        data: {
          currentPrice: BigInt(pricePerToken),
          tradeCount: { increment: 1 },
          totalPlatformFees: { increment: BigInt(platformFee) },
          totalCreatorFees: { increment: BigInt(creatorFee) },
          updatedAt: new Date(),
        },
      });

      // ✅ NEW: Update creator earnings in User table
      if (creatorFee > 0) {
        await prisma.user.upsert({
          where: { walletAddress: market.owner },
          create: {
            walletAddress: market.owner,
            totalEarningsAsCreator: BigInt(creatorFee),
            marketsCreated: 1,
          },
          update: {
            totalEarningsAsCreator: { increment: BigInt(creatorFee) },
          },
        });
      }

      // Update price history
      await this.updatePriceHistoryInDb(
        market.id,
        pricePerToken,
        amount,
        new Date()
      );
    } catch (error) {
      console.error("❌ Error saving transaction to database:", error);
    }
  }
  async prepareBuyTransaction(
    marketAddress: string,
    userWallet: string,
    amount: number
  ) {
    try {
      console.log("\n🛒 Preparing Buy Transaction (User Pays)...");
      console.log("📍 Market:", marketAddress);
      console.log("👤 User:", userWallet);
      console.log("🔢 Amount:", amount);

      const marketPubkey = new PublicKey(marketAddress);
      const userPubkey = new PublicKey(userWallet);

      // Get market from database
      const marketDb = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
      });

      if (!marketDb) {
        throw new Error("Market not found in database");
      }

      // Get market account info
      const marketAccountInfo = await this.connection.getAccountInfo(
        marketPubkey
      );
      if (!marketAccountInfo) {
        throw new Error("Market not found on-chain");
      }

      const data = marketAccountInfo.data;
      const mintPubkey = new PublicKey(data.slice(40, 72));
      const currentPrice = data.readBigUInt64LE(136);
      const circulatingSupply = Number(marketDb.circulatingSupply);

      console.log("📊 Current State:");
      console.log("  Circulating Supply:", circulatingSupply);
      console.log("  Current Price:", Number(currentPrice), "lamports");

      // ✅ Calculate cost using bonding curve
      const totalCost = this.calculateBuyCost(
        circulatingSupply,
        circulatingSupply + amount
      );

      // Calculate fees (1% total)
      const totalFee = Math.floor(totalCost * 0.01);
      const platformFee = Math.floor(totalFee * 0.7); // 70%
      const creatorFee = Math.floor(totalFee * 0.3); // 30%
      const totalWithFees = totalCost + totalFee;

      console.log("💰 Bonding Curve Calculation:");
      console.log("  Total Cost:", totalCost, "lamports");
      console.log("  Total Fee (1%):", totalFee, "lamports");
      console.log("  Platform Fee (70%):", platformFee, "lamports");
      console.log("  Creator Fee (30%):", creatorFee, "lamports");
      console.log("  Total with Fees:", totalWithFees, "lamports");

      // Derive PDAs
      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), marketPubkey.toBuffer()],
        PROGRAM_ID
      );

      const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), marketPubkey.toBuffer()],
        PROGRAM_ID
      );

      const escrowTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        escrowAuthority,
        true
      );

      const userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        userPubkey
      );

      // Check if user token account exists
      const userTokenAccountInfo = await this.connection.getAccountInfo(
        userTokenAccount
      );
      const needsTokenAccount = !userTokenAccountInfo;

      const transaction = new Transaction();

      // Create token account if needed
      if (needsTokenAccount) {
        console.log("🔨 Adding instruction to create user token account");
        const createAtaIx = createAssociatedTokenAccountInstruction(
          userPubkey,
          userTokenAccount,
          userPubkey,
          mintPubkey
        );
        transaction.add(createAtaIx);
      }

      // Build buy instruction
      const discriminator = DISCRIMINATORS.buyTokens;
      const instructionData = Buffer.concat([
        discriminator,
        this.serializeU64(amount),
      ]);

      // ✅ NEW: Add creator wallet to accounts
      const creatorWallet = new PublicKey(marketDb.owner);

      const keys = [
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: marketPubkey, isSigner: false, isWritable: true },
        { pubkey: escrowAuthority, isSigner: false, isWritable: false },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: this.platformFeeWallet, isSigner: false, isWritable: true },
        { pubkey: creatorWallet, isSigner: false, isWritable: true }, // ✅ NEW
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const instruction = new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash(
        "finalized"
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;

      const serializedTx = transaction
        .serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        })
        .toString("base64");

      console.log("✅ Buy transaction prepared");

      return {
        transaction: serializedTx,
        buyer: userWallet,
        amount: amount,
        totalCost: totalCost,
        totalCostSOL: (totalCost / 1e9).toFixed(6),
        totalFee: totalFee,
        platformFee: platformFee,
        platformFeeSOL: (platformFee / 1e9).toFixed(6),
        creatorFee: creatorFee,
        creatorFeeSOL: (creatorFee / 1e9).toFixed(6),
        totalWithFees: totalWithFees,
        totalWithFeesSOL: (totalWithFees / 1e9).toFixed(6),
        needsTokenAccount: needsTokenAccount,
        userTokenAccount: userTokenAccount.toString(),
        creatorWallet: marketDb.owner,
        instructions:
          "Sign this transaction with your wallet to complete the purchase.",
      };
    } catch (error: any) {
      console.error("❌ Prepare buy transaction error:", error);
      throw new Error(`Failed to prepare buy transaction: ${error.message}`);
    }
  }
  async prepareCreateMarket(
    userWallet: string,
    initialPriceLamports: number,
    initialSupply: number,
    name: string,
    symbol: string,
    description: string,
    imageUrl: string
  ) {
    try {
      console.log("\n🔨 Preparing Create Market Transaction (User Pays)...");
      console.log("👤 User Wallet:", userWallet);

      const userPubkey = new PublicKey(userWallet);

      // Upload metadata first
      console.log("📤 Uploading metadata to IPFS...");
      const metadataUri = await this.uploadService.uploadMetadata({
        name,
        symbol,
        description,
        image: imageUrl,
      });
      console.log("✅ Metadata URI:", metadataUri);

      // Generate mint keypair on server
      const mintKeypair = Keypair.generate();
      console.log("🔑 Mint Address:", mintKeypair.publicKey.toString());

      // Derive PDAs
      const [mintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint-authority")],
        PROGRAM_ID
      );

      const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), mintKeypair.publicKey.toBuffer()],
        PROGRAM_ID
      );

      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), marketPDA.toBuffer()],
        PROGRAM_ID
      );

      const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), marketPDA.toBuffer()],
        PROGRAM_ID
      );

      const escrowTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        escrowAuthority,
        true
      );

      const [metadataPDA] = this.getMetadataPDA(mintKeypair.publicKey);

      // Build instruction data
      const discriminator = DISCRIMINATORS.createMarket;
      const instructionData = Buffer.concat([
        discriminator,
        this.serializeU64(initialPriceLamports),
        this.serializeU64(initialSupply),
        this.serializeString(name),
        this.serializeString(symbol),
        this.serializeString(metadataUri),
      ]);

      // Build instruction with USER as first account (fee payer)
      const keys = [
        {
          pubkey: userPubkey, // ✅ USER PAYS
          isSigner: true,
          isWritable: true,
        },
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: mintAuthority, isSigner: false, isWritable: false },
        { pubkey: marketPDA, isSigner: false, isWritable: true },
        { pubkey: escrowAuthority, isSigner: false, isWritable: false },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: metadataPDA, isSigner: false, isWritable: true },
        { pubkey: this.platformFeeWallet, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ];

      const instruction = new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey; // ✅ USER IS FEE PAYER

      // ✅ SERVER PARTIALLY SIGNS WITH MINT KEYPAIR
      transaction.partialSign(mintKeypair);

      // ✅ SERIALIZE WITHOUT REQUIRING ALL SIGNATURES
      const serializedTx = transaction
        .serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        })
        .toString("base64");

      console.log("✅ Create market transaction prepared");
      console.log("💰 User will pay creation fee: 0.1 SOL");
      console.log("💰 Plus account rent: ~0.007 SOL");

      // Save pending market to database (optional)
      try {
        await prisma.market.create({
          data: {
            publicKey: marketPDA.toString(),
            owner: userWallet, // ✅ USER IS OWNER NOW
            mint: mintKeypair.publicKey.toString(),
            escrow: escrowTokenAccount.toString(),
            treasury: treasury.toString(),
            initialPrice: BigInt(initialPriceLamports),
            initialSupply: BigInt(initialSupply),
            currentPrice: BigInt(initialPriceLamports),
            totalSupply: BigInt(initialSupply),
            name,
            symbol,
            description,
            imageUrl,
            metadataUri,
            // Add a status field: PENDING
          },
        });
      } catch (dbError) {
        console.log("⚠️ Market will be saved after confirmation");
      }

      return {
        transaction: serializedTx,
        marketAddress: marketPDA.toString(),
        mintAddress: mintKeypair.publicKey.toString(),
        metadataUri,
        estimatedCost: {
          creationFee: 0.1,
          rentCost: 0.007,
          totalSOL: 0.107,
        },
        instructions:
          "Sign this transaction with your wallet to create the market.",
      };
    } catch (error: any) {
      console.error("❌ Prepare create market error:", error);
      throw new Error(`Failed to prepare market creation: ${error.message}`);
    }
  }

  async buyTokensServerPaid(
    marketAddress: string,
    destinationWallet: string,
    amount: number
  ) {
    try {
      console.log("\n🛒 Buying Tokens...");
      console.log("📍 Market:", marketAddress);
      console.log("👤 Destination:", destinationWallet);
      console.log("🔢 Amount:", amount);

      const marketPubkey = new PublicKey(marketAddress);
      const destinationPubkey = new PublicKey(destinationWallet);

      const marketAccountInfo = await this.connection.getAccountInfo(
        marketPubkey
      );
      if (!marketAccountInfo) {
        throw new Error("Market not found");
      }

      const mintPubkey = new PublicKey(marketAccountInfo.data.slice(40, 72));
      const currentPriceData = marketAccountInfo.data.readBigUInt64LE(136);
      console.log("🪙 Mint:", mintPubkey.toString());
      console.log("💰 Current Price:", Number(currentPriceData), "lamports");

      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), marketPubkey.toBuffer()],
        PROGRAM_ID
      );

      const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), marketPubkey.toBuffer()],
        PROGRAM_ID
      );

      const escrowTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        escrowAuthority,
        true
      );

      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        destinationPubkey
      );

      const destAccountInfo = await this.connection.getAccountInfo(
        destinationTokenAccount
      );
      if (!destAccountInfo) {
        console.log("🔨 Creating destination token account...");
        const createAtaIx = createAssociatedTokenAccountInstruction(
          this.serverKeypair.publicKey,
          destinationTokenAccount,
          destinationPubkey,
          mintPubkey
        );

        const createTx = new Transaction().add(createAtaIx);
        const { blockhash } = await this.connection.getLatestBlockhash(
          "finalized"
        );
        createTx.recentBlockhash = blockhash;
        createTx.feePayer = this.serverKeypair.publicKey;
        createTx.sign(this.serverKeypair);

        const createSig = await this.connection.sendRawTransaction(
          createTx.serialize()
        );
        await this.connection.confirmTransaction(createSig, "finalized");
        console.log("✅ Token account created");
      }

      const discriminator = DISCRIMINATORS.buyTokens;
      const instructionData = Buffer.concat([
        discriminator,
        this.serializeU64(amount),
      ]);

      const keys = [
        {
          pubkey: this.serverKeypair.publicKey,
          isSigner: true,
          isWritable: true,
        },
        { pubkey: marketPubkey, isSigner: false, isWritable: true },
        { pubkey: escrowAuthority, isSigner: false, isWritable: false },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: destinationTokenAccount, isSigner: false, isWritable: true },
        { pubkey: this.platformFeeWallet, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const instruction = new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.serverKeypair.publicKey;
      transaction.sign(this.serverKeypair);

      console.log("📤 Sending buy transaction...");

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        { skipPreflight: false, preflightCommitment: "finalized" }
      );

      console.log("⏳ Confirming transaction...");

      await this.connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "finalized"
      );

      console.log("✅ Tokens purchased successfully!");

      // Calculate costs
      const totalCost = Number(currentPriceData) * amount;
      const platformFee = Math.floor(totalCost * 0.01);

      // ✅ SAVE BUY TRANSACTION TO DATABASE
      await this.saveTransactionToDb(
        signature,
        marketAddress,
        "BUY",
        destinationWallet,
        amount,
        Number(currentPriceData),
        totalCost,
        platformFee
      );

      return {
        signature,
        destinationWallet,
        amount,
        platformFee: "1%",
        tokenAccount: destinationTokenAccount.toString(),
        explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
      };
    } catch (error: any) {
      console.error("❌ Buy tokens error:", error);

      if (error.logs) {
        console.error("📋 Transaction Logs:");
        error.logs.forEach((log: string) => console.error("  ", log));
      }

      throw new Error(`Failed to buy tokens: ${error.message}`);
    }
  }

  async confirmSellTransaction(
    signature: string,
    marketAddress: string,
    userWallet: string,
    amount: number
  ) {
    try {
      console.log("\n⏳ Confirming sell transaction...");
      console.log("📝 Signature:", signature);
      console.log("📍 Market:", marketAddress);
      console.log("👤 Wallet:", userWallet);
      console.log("🔢 Amount:", amount);

      // Wait for confirmation with 'confirmed' commitment (best practice)
      await this.connection.confirmTransaction(signature, "confirmed");
      console.log("✅ Transaction confirmed on-chain");

      // Get transaction to extract details
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta || tx.meta.err) {
        throw new Error("Transaction failed or not found");
      }

      // ✅ Get market from database for circulating supply
      const marketDb = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
      });

      if (!marketDb) {
        throw new Error("Market not found in database");
      }

      // ✅ Use database circulating supply for calculation
      const circulatingSupply = Number(marketDb.circulatingSupply);

      console.log("📊 Market state before sell:");
      console.log("  Circulating Supply:", circulatingSupply);

      // ✅ CRITICAL FIX: Calculate sell value using bonding curve
      const totalValue = this.calculateSellValue(
        circulatingSupply,
        circulatingSupply - amount
      );

      // ✅ Calculate new price after sell (supply decreased)
      const currentPrice = this.calculateBondingCurvePrice(
        circulatingSupply - amount
      );

      // ✅ Calculate fees with 70/30 split
      const totalFee = Math.floor(totalValue * 0.01);
      const platformFee = Math.floor(totalFee * 0.7); // 70%
      const creatorFee = totalFee - platformFee; // 30% (avoid rounding issues)

      console.log("💰 Sell transaction details:");
      console.log(
        "  Total Value:",
        totalValue,
        "lamports",
        `(${(totalValue / 1e9).toFixed(6)} SOL)`
      );
      console.log(
        "  New Price:",
        currentPrice,
        "lamports",
        `(${(currentPrice / 1e9).toFixed(6)} SOL)`
      );
      console.log("  Total Fee (1%):", totalFee, "lamports");
      console.log("  Platform Fee (70%):", platformFee, "lamports");
      console.log("  Creator Fee (30%):", creatorFee, "lamports");
      console.log("  User Received:", totalValue - totalFee, "lamports");

      // ✅ CRITICAL: Update circulating supply in database (this was missing!)
      await prisma.market.update({
        where: { publicKey: marketAddress },
        data: {
          circulatingSupply: { decrement: BigInt(amount) }, // Decrease supply
          currentPrice: BigInt(currentPrice), // Update to new price
          updatedAt: new Date(),
        },
      });

      console.log("✅ Market updated:");
      console.log("  New Circulating Supply:", circulatingSupply - amount);
      console.log("  New Current Price:", currentPrice);

      // ✅ Save sell transaction with fee split
      await this.saveTransactionToDb(
        signature,
        marketAddress,
        "SELL",
        userWallet,
        amount,
        currentPrice,
        totalValue,
        platformFee,
        creatorFee // ✅ CRITICAL: Pass creator fee
      );

      console.log("✅ Sell transaction confirmed and saved to database");

      return {
        success: true,
        signature,
        amount,
        totalValue,
        totalValueSOL: (totalValue / 1e9).toFixed(6),
        platformFee,
        creatorFee,
        userReceived: totalValue - totalFee,
        userReceivedSOL: ((totalValue - totalFee) / 1e9).toFixed(6),
        newCirculatingSupply: circulatingSupply - amount,
        newPrice: currentPrice,
        message: "Sell transaction confirmed and saved to database",
      };
    } catch (error: any) {
      console.error("❌ Error confirming sell transaction:", error);
      throw error;
    }
  }

  async prepareSellTransaction(
    marketAddress: string,
    userWallet: string,
    amount: number,
    minReceiveLamports?: number
  ) {
    try {
      console.log("\n💸 Preparing Sell Transaction...");
      console.log("📍 Market:", marketAddress);
      console.log("👤 User:", userWallet);
      console.log("🔢 Amount:", amount);
      console.log("💵 Min Receive Override:", minReceiveLamports || "AUTO");

      const marketPubkey = new PublicKey(marketAddress);
      const userPubkey = new PublicKey(userWallet);

      // Get market from database
      const marketDb = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
      });

      if (!marketDb) {
        throw new Error("Market not found in database");
      }

      // Get market account info from blockchain
      const marketAccountInfo = await this.connection.getAccountInfo(
        marketPubkey
      );
      if (!marketAccountInfo) {
        throw new Error("Market not found on-chain");
      }

      // ✅ CRITICAL: Extract mint pubkey from account data
      const data = marketAccountInfo.data;
      const mintPubkey = new PublicKey(data.slice(40, 72)); // Extract mint address

      // ✅ Get LIVE on-chain circulating supply (position 168 in account data)
      const onChainCirculatingSupply = Number(data.readBigUInt64LE(168));
      const circulatingSupply =
        onChainCirculatingSupply || Number(marketDb.circulatingSupply);

      console.log("📊 Current State:");
      console.log("  Mint:", mintPubkey.toString());
      console.log(
        "  DB Circulating Supply:",
        Number(marketDb.circulatingSupply)
      );
      console.log("  On-Chain Circulating Supply:", onChainCirculatingSupply);
      console.log("  Using for calculation:", circulatingSupply);

      // ✅ Validate sell amount
      if (amount > circulatingSupply) {
        throw new Error(
          `Cannot sell ${amount} tokens. Only ${circulatingSupply} in circulation.`
        );
      }

      // ✅ Calculate sell value using bonding curve (matches Rust)
      const totalValue = this.calculateSellValue(
        circulatingSupply,
        circulatingSupply - amount
      );

      const totalFee = Math.floor(totalValue * 0.01);
      const platformFee = Math.floor(totalFee * 0.7);
      const creatorFee = totalFee - platformFee; // ✅ Ensure no rounding issues
      const userReceives = totalValue - totalFee;

      // ✅ CRITICAL: Use provided minReceiveLamports OR calculate with safety margin
      const minReceive =
        minReceiveLamports !== undefined
          ? minReceiveLamports
          : Math.floor(userReceives * 0.8); // 20% default safety margin

      console.log("💰 Bonding Curve Calculation:");
      console.log(
        "  Total Value:",
        totalValue,
        "lamports",
        `(${(totalValue / 1e9).toFixed(6)} SOL)`
      );
      console.log("  Total Fee (1%):", totalFee, "lamports");
      console.log("  Platform Fee (70%):", platformFee, "lamports");
      console.log("  Creator Fee (30%):", creatorFee, "lamports");
      console.log(
        "  User Receives:",
        userReceives,
        "lamports",
        `(${(userReceives / 1e9).toFixed(6)} SOL)`
      );
      console.log(
        "  Min Receive:",
        minReceive,
        "lamports",
        `(${(minReceive / 1e9).toFixed(6)} SOL)`
      );
      console.log(
        "  Safety Margin:",
        ((1 - minReceive / userReceives) * 100).toFixed(2) + "%"
      );

      // Derive PDAs
      const [escrowAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), marketPubkey.toBuffer()],
        PROGRAM_ID
      );

      const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), marketPubkey.toBuffer()],
        PROGRAM_ID
      );

      // Get token accounts
      const escrowTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        escrowAuthority,
        true
      );

      const userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        userPubkey
      );

      // Build sell instruction
      const discriminator = DISCRIMINATORS.sellTokens;
      const instructionData = Buffer.concat([
        discriminator,
        this.serializeU64(amount),
        this.serializeU64(minReceive), // ✅ Use calculated minReceive
      ]);

      // ✅ Get creator wallet
      const creatorWallet = new PublicKey(marketDb.owner);

      const keys = [
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: marketPubkey, isSigner: false, isWritable: true },
        { pubkey: escrowAuthority, isSigner: false, isWritable: false },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: this.platformFeeWallet, isSigner: false, isWritable: true },
        { pubkey: creatorWallet, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const instruction = new TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      const transaction = new Transaction().add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash(
        "finalized"
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;

      // Serialize transaction
      const serializedTx = transaction
        .serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        })
        .toString("base64");

      console.log("✅ Sell transaction prepared successfully");

      return {
        transaction: serializedTx,
        seller: userWallet,
        amount: amount,
        estimatedReceive: totalValue,
        estimatedReceiveSOL: totalValue / 1e9,
        totalFee: totalFee,
        platformFee: platformFee,
        platformFeeSOL: platformFee / 1e9,
        creatorFee: creatorFee,
        creatorFeeSOL: creatorFee / 1e9,
        userReceives: userReceives,
        userReceivesSOL: userReceives / 1e9,
        minReceive: minReceive,
        minReceiveSOL: minReceive / 1e9,
        circulatingSupply: circulatingSupply,
        creatorWallet: marketDb.owner,
        instructions:
          "User must sign this transaction with their wallet and broadcast it.",
      };
    } catch (error: any) {
      console.error("❌ Prepare sell transaction error:", error);
      throw new Error(`Failed to prepare sell transaction: ${error.message}`);
    }
  }

  async confirmBuyTransaction(
    signature: string,
    marketAddress: string,
    userWallet: string,
    amount: number
  ) {
    try {
      console.log("⏳ Confirming buy transaction:", signature);

      await this.connection.confirmTransaction(signature, "confirmed");

      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta || tx.meta.err) {
        throw new Error("Transaction failed or not found");
      }

      // Get market from database for circulating supply
      const marketDb = await prisma.market.findUnique({
        where: { publicKey: marketAddress },
      });

      if (!marketDb) {
        throw new Error("Market not found");
      }

      const circulatingSupply = Number(marketDb.circulatingSupply);

      // Calculate cost using bonding curve
      const totalCost = this.calculateBuyCost(
        circulatingSupply,
        circulatingSupply + amount
      );

      const currentPrice = Math.floor(
        this.calculateBondingCurvePrice(circulatingSupply + amount)
      );

      const totalFee = Math.floor(totalCost * 0.01);
      const platformFee = Math.floor(totalFee * 0.7);
      const creatorFee = Math.floor(totalFee * 0.3);

      // ✅ Update circulating supply
      await prisma.market.update({
        where: { publicKey: marketAddress },
        data: {
          circulatingSupply: { increment: BigInt(amount) },
          currentPrice: BigInt(currentPrice),
        },
      });

      // Save with fee split
      await this.saveTransactionToDb(
        signature,
        marketAddress,
        "BUY",
        userWallet,
        amount,
        currentPrice,
        totalCost,
        platformFee,
        creatorFee // ✅ NEW
      );

      console.log("✅ Buy transaction confirmed and saved");

      return {
        success: true,
        signature,
        message: "Buy transaction confirmed and saved to database",
      };
    } catch (error: any) {
      console.error("❌ Error confirming buy transaction:", error);
      throw error;
    }
  }

  getServerWallet() {
    return {
      publicKey: this.serverKeypair.publicKey.toString(),
      keypair: this.serverKeypair,
    };
  }
  async confirmCreateMarket(
    signature: string,
    marketAddress: string,
    userWallet: string
  ) {
    try {
      console.log("⏳ Confirming market creation:", signature);

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, "confirmed");

      // Get transaction details
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta || tx.meta.err) {
        throw new Error("Market creation failed or not found");
      }

      // Update market status in database
      await prisma.market.update({
        where: { publicKey: marketAddress },
        data: {
          status: "ACTIVE", // Update from PENDING
          createdAt: new Date(),
        },
      });

      // Save transaction
      await this.saveTransactionToDb(
        signature,
        marketAddress,
        "CREATE_MARKET",
        userWallet,
        0,
        0,
        0,
        100_000_000 // 0.1 SOL fee
      );

      console.log("✅ Market creation confirmed");

      return {
        success: true,
        signature,
        marketAddress,
        explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
      };
    } catch (error: any) {
      console.error("❌ Error confirming market creation:", error);
      throw error;
    }
  }
}
