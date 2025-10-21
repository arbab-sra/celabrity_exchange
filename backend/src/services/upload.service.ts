import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
export class UploadService {
  private nftStorageKey = process.env.NFT_STORAGE_API_KEY || "";
  
  async uploadMetadata(metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
  }): Promise<string> {
    try {
      if (!this.nftStorageKey) {
        // Return a mock URI if no API key
        return `https://example.com/metadata/${Date.now()}.json`;
      }

      const metadataJson = JSON.stringify(metadata);

      const response = await axios.post(
        "https://api.nft.storage/upload",
        metadataJson,
        {
          headers: {
            Authorization: `Bearer ${this.nftStorageKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      const ipfsHash = response.data.value.cid;
      return `https://ipfs.io/ipfs/${ipfsHash}`;
    } catch (error) {
      console.warn("Failed to upload to IPFS, using fallback URL");
      return `https://example.com/metadata/${Date.now()}.json`;
    }
  }
}
