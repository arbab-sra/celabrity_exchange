'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Market } from '@/types'

interface UseMarketsReturn {
  markets: Market[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useMarkets(): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMarkets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading all markets...')
      const response = await api.getAllMarkets()
      setMarkets(response.data)
      console.log(`✅ Loaded ${response.data.length} markets`)
    } catch (err:any) {
      console.error('❌ Error loading markets:', err)
      setError(err.message || 'Failed to load markets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMarkets()
  }, [loadMarkets])

  return {
    markets,
    loading,
    error,
    refresh: loadMarkets,
  }
}
