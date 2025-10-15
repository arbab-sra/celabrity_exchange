'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

interface TrendingMarket {
  publicKey: string
  name: string
  symbol: string
  imageUrl?: string
  currentPrice: string
  currentPriceSOL: string
  volume24h: number
  volume24hSOL: string
  trades24h: number
  holderCount: number
  trendingScore: number
}

interface UseTrendingReturn {
  trending: TrendingMarket[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTrending(limit: number = 10): UseTrendingReturn {
  const [trending, setTrending] = useState<TrendingMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrending = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading trending markets...')
      const response = await api.getTrendingMarkets(limit)
      setTrending(response.data)
      console.log(`✅ Loaded ${response.data.length} trending markets`)
    } catch (err:any) {
      console.error('❌ Error loading trending:', err)
      setError(err.message || 'Failed to load trending markets')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadTrending()
  }, [loadTrending])

  return {
    trending,
    loading,
    error,
    refresh: loadTrending,
  }
}
