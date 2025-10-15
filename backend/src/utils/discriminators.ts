import { createHash } from "crypto";
import dotenv from "dotenv";
dotenv.config();
export class Discriminators {
  static instruction(name: string): Buffer {
    const preimage = `global:${name}`;
    const hash = createHash("sha256").update(preimage).digest();
    return hash.slice(0, 8);
  }
}

export const DISCRIMINATORS = {
  createMarket: Discriminators.instruction("create_market"),
  buyTokens: Discriminators.instruction("buy_tokens"),
  sellTokens: Discriminators.instruction("sell_tokens"),
};

console.log("📝 Instruction Discriminators:");
console.log("create_market:", DISCRIMINATORS.createMarket);
console.log("buy_tokens:", DISCRIMINATORS.buyTokens);
console.log("sell_tokens:", DISCRIMINATORS.sellTokens);
