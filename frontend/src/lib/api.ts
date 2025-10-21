import axios from 'axios'
import type {
  PrepareCreateMarketRequest,
  PrepareCreateMarketResponse,
  ConfirmCreateMarketRequest,
  ConfirmCreateMarketResponse,
  ConfirmBuyTransactionRequest,
  ConfirmSellTransactionRequest,
  PrepareSellTransactionRequest,
} from '@/types/index'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data)

      // Enhanced error messages
      const errorMsg = error.response.data.error || 'An error occurred'

      if (errorMsg.includes('insufficient')) {
        throw new Error('Insufficient balance. Please check your wallet.')
      } else if (errorMsg.includes('simulation failed')) {
        throw new Error('Transaction failed. Please try again.')
      } else if (errorMsg.includes('User rejected')) {
        throw new Error('Transaction cancelled by user')
      }

      throw new Error(errorMsg)
    } else if (error.request) {
      console.error('Network Error:', error.request)
      throw new Error('Network error. Please check your connection.')
    } else {
      console.error('Error:', error.message)
      throw error
    }
  },
)

export const api = {
  // ==========================================
  // MARKET ENDPOINTS
  // ==========================================

  /**
   * Get all markets
   */
  getAllMarkets: async () => {
    const response = await apiClient.get('/api/markets')
    return response.data
  },

  /**
   * Get market by address
   */
  getMarketByAddress: async (address: string) => {
    const response = await apiClient.get(`/api/markets/address/${address}`)
    return response.data
  },

  /**
   * Get market statistics (enhanced)
   */
  getMarketStats: async (address: string) => {
    const response = await apiClient.get(`/api/markets/${address}/stats`)
    return response.data
  },

  /**
   * Get market by mint address
   */
  getMarketByMint: async (mint: string) => {
    const response = await apiClient.get(`/api/markets/mint/${mint}`)
    return response.data
  },

  /**
   * Get markets by owner
   */
  getMarketsByOwner: async (owner: string) => {
    const response = await apiClient.get(`/api/markets/owner/${owner}`)
    return response.data
  },

  // ==========================================
  // PRICE & VOLUME DATA
  // ==========================================

  /**
   * Get price history for charts
   */
  getPriceHistory: async (
    address: string,
    interval: 'ONE_MINUTE' | 'FIVE_MINUTES' | 'ONE_HOUR' | 'ONE_DAY' = 'ONE_DAY',
    limit: number = 30,
  ) => {
    const response = await apiClient.get(`/api/markets/${address}/price-history`, { params: { interval, limit } })
    return response.data
  },

  /**
   * Get volume chart data
   */
  getVolumeChart: async (
    address: string,
    interval: 'ONE_MINUTE' | 'FIVE_MINUTES' | 'ONE_HOUR' | 'ONE_DAY' = 'ONE_DAY',
    limit: number = 30,
  ) => {
    const response = await apiClient.get(`/api/markets/${address}/volume-chart`, { params: { interval, limit } })
    return response.data
  },

  /**
   * Get 24h statistics
   */
  get24hStats: async (address: string) => {
    const response = await apiClient.get(`/api/markets/${address}/24h-stats`)
    return response.data
  },

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  /**
   * Get market transactions
   */
  getMarketTransactions: async (address: string, limit: number = 20, type?: 'BUY' | 'SELL') => {
    const response = await apiClient.get(`/api/markets/${address}/transactions`, { params: { limit, type } })
    return response.data
  },

  /**
   * Get recent trades (legacy support)
   */
  getRecentTrades: async (address: string, limit: number = 10) => {
    const response = await apiClient.get(`/api/markets/${address}/trades`, {
      params: { limit },
    })
    return response.data
  },

  // ==========================================
  // HOLDERS
  // ==========================================

  /**
   * Get top holders
   */
  getTopHolders: async (address: string, limit: number = 10) => {
    const response = await apiClient.get(`/api/markets/${address}/holders`, {
      params: { limit },
    })
    return response.data
  },

  // ==========================================
  // MARKET CREATION
  // ==========================================

  /**
   * Prepare market creation transaction (USER PAYS - RECOMMENDED)
   * Returns partially signed transaction for user to sign
   */
  prepareCreateMarket: async (data: PrepareCreateMarketRequest): Promise<PrepareCreateMarketResponse> => {
    const response = await apiClient.post('/api/transactions/prepare-create-market', data)
    return response.data
  },

  /**
   * Confirm market creation after user signs transaction
   */
  confirmCreateMarket: async (data: ConfirmCreateMarketRequest): Promise<ConfirmCreateMarketResponse> => {
    const response = await apiClient.post('/api/transactions/confirm-create-market', data)
    return response.data
  },

  // ==========================================
  // BUY TRANSACTIONS
  // ==========================================

  /**
   * Prepare buy transaction (user pays)
   */
  prepareBuyTransaction: async (data: { marketAddress: string; userWallet: string; amount: number }) => {
    const response = await apiClient.post('/api/transactions/buy-tokens-user-pays', data)
    return response.data
  },
  

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Calculate price impact
   */
  calculatePrice: async (data: { currentPrice: string; amount: string; totalSupply: string; isBuy: boolean }) => {
    const response = await apiClient.post('/api/transactions/calculate-price', data)
    return response.data
  },

  // ==========================================
  // USER PORTFOLIO
  // ==========================================

  /**
   * Get user portfolio
   */
  getUserPortfolio: async (walletAddress: string) => {
    const response = await apiClient.get(`/api/portfolio/${walletAddress}`)
    return response.data
  },

  /**
   * Get user activity/transaction history
   */
  getUserActivity: async (walletAddress: string, limit: number = 50, type?: 'BUY' | 'SELL') => {
    const response = await apiClient.get(`/api/user/${walletAddress}/activity`, { params: { limit, type } })
    return response.data
  },

  /**
   * Get user statistics
   */
  getUserStats: async (walletAddress: string) => {
    const response = await apiClient.get(`/api/user/${walletAddress}/stats`)
    return response.data
  },

  // ==========================================
  // PLATFORM ANALYTICS
  // ==========================================

  /**
   * Get platform analytics
   */
  getPlatformAnalytics: async () => {
    const response = await apiClient.get('/api/analytics/platform')
    return response.data
  },

  /**
   * Get leaderboard
   */
  getLeaderboard: async (
    sortBy: 'marketCap' | 'volume' | 'trades' | 'holders' | 'newest' = 'marketCap',
    limit: number = 20,
  ) => {
    const response = await apiClient.get('/api/leaderboard', {
      params: { sortBy, limit },
    })
    return response.data
  },

  /**
   * Get trending markets
   */
  getTrendingMarkets: async (limit: number = 10) => {
    const response = await apiClient.get('/api/trending', {
      params: { limit },
    })
    return response.data
  },

  /**
   * Search markets
   */
  searchMarkets: async (query: string) => {
    const response = await apiClient.get('/api/search', {
      params: { q: query },
    })
    return response.data
  },
  

  
  /**
   * Get creator earnings
   */
  getCreatorEarnings: async (walletAddress: string) => {
    const response = await apiClient.get(`/api/creator/${walletAddress}/earnings`)
    return response.data
  },

  /**
   * Get creator leaderboard
   */
  getCreatorLeaderboard: async (limit: number = 20) => {
    const response = await apiClient.get('/api/creator/leaderboard', {
      params: { limit },
    })
    return response.data
  },

  /**
   * Get creator stats
   */
  getCreatorStats: async () => {
    const response = await apiClient.get('/api/creator/stats')
    return response.data
  },

  /**
   * Prepare sell transaction
   */
  prepareSellTransaction: async (data: PrepareSellTransactionRequest) => {
    const response = await apiClient.post('/api/transactions/sell-tokens', data)
    return response.data
  },

  /**
   * Confirm sell transaction
   */
  confirmSellTransaction: async (data: ConfirmSellTransactionRequest) => {
    const response = await apiClient.post('/api/transactions/confirm-sell', data)
    return response.data
  },

  /**
   * Confirm buy transaction
   */
  confirmBuyTransaction: async (data: ConfirmBuyTransactionRequest) => {
    const response = await apiClient.post('/api/transactions/confirm-buy', data)
    return response.data
  },
}

export default api
