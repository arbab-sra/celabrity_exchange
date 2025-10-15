'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

interface LeaderboardMarket {
  rank: number
  publicKey: string
  name: string
  symbol: string
  currentPrice: string
  currentPriceSOL: string
  marketCap: number
  marketCapSOL: string
  tradeCount: number
  holderCount: number
}

interface UseLeaderboardReturn {
  markets: LeaderboardMarket[]
  loading: boolean
  error: string | null
  sortBy: string
  setSortBy: (sortBy: 'marketCap' | 'volume' | 'trades' | 'holders') => void
  refresh: () => Promise<void>
}

export function useLeaderboard(
  initialSortBy: 'marketCap' | 'volume' | 'trades' | 'holders' = 'marketCap',
  limit: number = 20,
): UseLeaderboardReturn {
  const [markets, setMarkets] = useState<LeaderboardMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState(initialSortBy)

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`🔄 Loading leaderboard sorted by: ${sortBy}`)
      const response = await api.getLeaderboard(sortBy, limit)
      setMarkets(response.data)
      console.log(`✅ Loaded ${response.data.length} markets`)
    } catch (err:any) {
      console.error('❌ Error loading leaderboard:', err)
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [sortBy, limit])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  return {
    markets,
    loading,
    error,
    sortBy,
    setSortBy,
    refresh: loadLeaderboard,
  }
}
