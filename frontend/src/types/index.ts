// Complete Market Type with all fields
export interface Market {
  // Core fields (from blockchain)
  publicKey: string
  owner: string
  mint: string
  escrow: string
  treasury: string
  currentPrice: string // Price in lamports
  totalSupply: string
  tradeCount: string

  // Metadata
  name: string
  symbol: string
  description?: string
  imageUrl?: string
  metadataUri?: string
  holderCount?: number
  rank?: number

  // Timestamps
  createdAt: string
  updatedAt: string

  // ✅ FIXED: Fee tracking (corrected spelling)
  totalCreatorFees?: string | bigint // ✅ FIXED from totalCreaterFees
  totalPlatformFees?: string | bigint
  circulatingSupply?: string | bigint

  // Calculated fields (from /stats endpoint)
  currentPriceSOL?: string // Human-readable SOL price
  marketCap?: string // Market cap in lamports
  marketCapSOL?: string // Market cap in SOL
  volume24h?: string // Volume in lamports
  volume24hSOL?: string // Volume in SOL
  priceChange24h?: string // Price change percentage
  high24h?: string // 24h high in lamports
  high24hSOL?: string // 24h high in SOL
  low24h?: string // 24h low in lamports
  low24hSOL?: string // 24h low in SOL
  averageTradeSize?: string
  lastTradeTime?: string
}

// Alternative: Separate base and extended types
export interface BaseMarket {
  publicKey: string
  owner: string
  mint: string
  escrow: string
  treasury: string
  currentPrice: string
  totalSupply: string
  tradeCount: string
  name: string
  symbol: string
  description?: string
  imageUrl?: string
  metadataUri?: string
  holderCount?: number
  createdAt: string
  updatedAt: string
  // ✅ ADDED: Fee fields to base market
  totalCreatorFees?: string | bigint
  totalPlatformFees?: string | bigint
  circulatingSupply?: string | bigint
}

export interface MarketWithStats extends BaseMarket {
  currentPriceSOL: string
  marketCap: string
  marketCapSOL: string
  volume24h: string
  volume24hSOL: string
  priceChange24h: string
  high24h: string
  high24hSOL: string
  low24h: string
  low24hSOL: string
  averageTradeSize: string
  lastTradeTime: string
}

// Transaction Type
export interface Transaction {
  signature: string
  type: 'BUY' | 'SELL' | 'CREATE_MARKET'
  userWallet: string
  amount: string
  pricePerToken: string
  pricePerTokenSOL?: string // Human-readable SOL
  totalValue: string
  totalValueSOL?: string // Human-readable SOL
  platformFee: string
  platformFeeSOL?: string // Human-readable SOL
  creatorFee?: string // ✅ NEW
  creatorFeeSOL?: string // ✅ NEW
  totalFee?: string // ✅ NEW
  totalFeeSOL?: string // ✅ NEW
  timestamp: number
  blockTime: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  slot?: number
}

// Holder Type
export interface Holder {
  rank: number
  walletAddress: string
  balance: string
  balanceFormatted: string
  percentage: string
  totalBought: string
  totalSold: string
  averageBuyPrice: string
  averageBuyPriceSOL?: string // Human-readable SOL
  currentValue: string
  currentValueSOL: string
  realizedPnL: string
  realizedPnLSOL: string
  unrealizedPnL: string
  unrealizedPnLSOL: string
  totalPnL: string
  totalPnLSOL: string
  firstPurchase: string
  lastActivity: string
}

// Portfolio Type
export interface Portfolio {
  market: Market
  balance: string
  balanceFormatted: string
  totalBought: string
  totalSold: string
  averageBuyPrice: string
  averageBuyPriceSOL: string
  currentValueSOL: string
  costBasis?: string
  totalPnLSOL: string
  totalPnLPercent: string
  unrealizedPnLSOL: string
  unrealizedPnLPercent?: string
  realizedPnLSOL: string
  firstPurchase?: string
  lastActivity?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  count: number
  page?: number
  limit?: number
  totalPages?: number
  totalCount?: number
}

// Platform Analytics
export interface PlatformAnalytics {
  overview: {
    totalVolumeSOL: string
    totalVolumeUSD: string
    totalMarkets: number
    totalTransactions: number
    totalFeesSOL: string
    totalFeesUSD: string
    activeUsers: number
    volume24hSOL: string
    trades24h: number
  }
  topMarkets: Market[]
  recentActivity?: {
    lastHourVolume: string
    lastHourTrades: number
    avgTradeSize: string
    largestTrade: string
  }
}

export interface PricePointAPI {
  timestamp: number
  price: string
  priceSOL: string
  volume?: string
  volumeSOL?: string
  trades?: number
  high?: string
  low?: string
}

export interface VolumeDataAPI {
  timestamp: number
  volume: string | number
  volumeSOL?: string
  trades?: number
}

export interface PricePoint {
  timestamp: number
  price: number
  priceSOL?: string
  volume?: number
  volumeSOL?: string
  trades?: number
  high?: number
  low?: number
}

// API Request/Response Types
export interface PrepareCreateMarketRequest {
  userWallet: string
  initialPrice: number
  initialSupply: number
  name: string
  symbol: string
  description: string
  imageUrl: string
}

export interface PrepareCreateMarketResponse {
  success: boolean
  data: {
    transaction: string
    marketAddress: string
    mintAddress: string
    metadataUri: string
    estimatedCost: {
      creationFee: number
      rentCost: number
      totalSOL: number
    }
    instructions: string
  }
  message: string
}

export interface ConfirmCreateMarketRequest {
  signature: string
  marketAddress: string
  userWallet: string
}

export interface ConfirmCreateMarketResponse {
  success: boolean
  data: {
    success: boolean
    signature: string
    marketAddress: string
    explorerUrl: string
  }
  message: string
}

export interface PrepareBuyTransactionRequest {
  marketAddress: string
  userWallet: string
  amount: number
}

export interface PrepareBuyTransactionResponse {
  success: boolean
  data: {
    transaction: string
    buyer: string
    amount: number
    totalCost: number
    totalCostSOL: string
    platformFee: number
    platformFeeSOL: string
    creatorFee: number // ✅ NEW
    creatorFeeSOL: string // ✅ NEW
    totalFee?: number // ✅ NEW
    totalWithFees: number // ✅ RENAMED from totalWithFee
    totalWithFeesSOL: string
    needsTokenAccount: boolean
    userTokenAccount: string
    creatorWallet: string // ✅ NEW
    instructions: string
  }
  message: string
}

export interface PrepareSellTransactionRequest {
  marketAddress: string
  userWallet: string
  amount: number
  minReceive?: number
  minReceiveLamports?:number
}

export interface PrepareSellTransactionResponse {
  success: boolean
  data: {
    transaction: string
    seller: string
    amount: number
    estimatedReceive: number
    estimatedReceiveSOL: number
    platformFee: number
    platformFeeSOL: number
    creatorFee: number // ✅ NEW
    creatorFeeSOL: number // ✅ NEW
    totalFee: number // ✅ NEW
    userReceives: number
    userReceivesSOL: number
    minReceive: number
    minReceiveSOL: number
    creatorWallet: string // ✅ NEW
    instructions: string
  }
  message: string
}

export interface ConfirmBuyTransactionRequest {
  signature: string
  marketAddress: string
  userWallet: string
  amount: number
}

export interface ConfirmSellTransactionRequest {
  signature: string
  marketAddress: string
  userWallet: string
  amount: number
}

// ✅ NEW: Creator Earnings Types
export interface CreatorEarnings {
  walletAddress: string
  totalEarnings: string
  totalEarningsSOL: string
  marketsCreated: number
  markets: CreatorMarket[]
  recentFees: CreatorFee[]
}

export interface CreatorMarket {
  id: string
  publicKey: string
  name: string
  symbol: string
  totalCreatorFees: string
  totalCreatorFeesSOL: string
  totalPlatformFees: string
  totalPlatformFeesSOL: string
  tradeCount: number
  createdAt: string
}

export interface CreatorFee {
  signature: string
  type: 'BUY' | 'SELL'
  creatorFee: string
  creatorFeeSOL: string
  platformFee: string
  platformFeeSOL: string
  totalFee: string
  totalFeeSOL: string
  blockTime: string
  market: {
    name: string
    symbol: string
  }
}

export interface CreatorLeaderboard {
  rank: number
  walletAddress: string
  username?: string
  avatar?: string
  totalEarningsAsCreator: string
  totalEarningsSOL: string
  marketsCreated: number
}
