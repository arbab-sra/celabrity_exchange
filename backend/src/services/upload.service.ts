
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
export class UploadService {
  private pinataApiKey = process.env.PINATA_API_KEY || "";
  private pinataSecretKey = process.env.PINATA_SECRET_KEY || "";

  async uploadMetadata(metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string; // Your Cloudinary CDN URL
  }): Promise<string> {
    try {
      if (!this.pinataApiKey || !this.pinataSecretKey) {
        console.warn("Pinata API keys not configured");
        return `https://example.com/metadata/${Date.now()}.json`;
      }

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
            "Content-Type": "application/json",
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;

      // Use public gateway or your dedicated gateway
      return `https://aquamarine-rainy-cat-794.mypinata.cloud/ipfs/${ipfsHash}`;
    } catch (error) {
      console.error("Failed to upload to Pinata:", error);
      throw error; // Better to throw for debugging during hackathon
    }
  }
}

