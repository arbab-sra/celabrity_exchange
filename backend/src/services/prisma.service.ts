import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        // log: ["query", "error", "warn"],
      });

      console.log("✅ Prisma Client Connected");
    }

    return PrismaService.instance;
  }

  public static async disconnect() {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      console.log("❌ Prisma Client Disconnected");
    }
  }
}

export const prisma = PrismaService.getInstance();

// Graceful shutdown
process.on("beforeExit", async () => {
  await PrismaService.disconnect();
});
