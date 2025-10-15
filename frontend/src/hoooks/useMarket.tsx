'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Market, Transaction, PricePoint, Holder, PricePointAPI ,VolumeDataAPI} from '@/types'

// ✅ Define missing types
interface VolumeData {
  timestamp: number
  volume: number
  volumeSOL?: string
  trades?: number
}

interface Stats24h {
  volumeSOL: string
  volume: string
  high24hSOL: string
  high24h: string
  low24hSOL: string
  low24h: string
  priceChangePercent: string
  uniqueTraders: number
  trades: number
}

interface UseMarketReturn {
  // Data
  market: Market | null
  transactions: Transaction[]
  priceHistory: PricePoint[]
  volumeData: VolumeData[]
  holders: Holder[]
  stats24h: Stats24h | null

  // State
  loading: boolean
  error: string | null

  // Actions
  refresh: () => Promise<void>
  refreshMarket: () => Promise<void>
  refreshTransactions: () => Promise<void>
  refreshPriceHistory: () => Promise<void>
  refreshHolders: () => Promise<void>
}

export function useMarket(marketAddress: string): UseMarketReturn {
  // Data State
  const [market, setMarket] = useState<Market | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [holders, setHolders] = useState<Holder[]>([])
  const [stats24h, setStats24h] = useState<Stats24h | null>(null)

  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load market data
   */
  const loadMarket = useCallback(async () => {
    if (!marketAddress) return

    try {
      const response = await api.getMarketStats(marketAddress)
      // ✅ Fix: setMarket expects Market, not transformed PricePoint[]
      setMarket(response.data)
      console.log('✅ Market loaded:', response.data)
    } catch (err) {
      console.error('❌ Error loading market:', err)
      throw new Error(`Failed to load market: ${err}`)
    }
  }, [marketAddress])

  /**
   * Load transactions
   */
  const loadTransactions = useCallback(async () => {
    if (!marketAddress) return

    try {
      const response = await api.getMarketTransactions(marketAddress, 50)
      setTransactions(response.data)
      console.log(`✅ Loaded ${response.data.length} transactions`)
    } catch (err) {
      console.error('❌ Error loading transactions:', err)
      // Don't throw, just log
    }
  }, [marketAddress])

  /**
   * Load price history with transformation
   */
  const loadPriceHistory = useCallback(async () => {
    if (!marketAddress) return

    try {
      const response = await api.getPriceHistory(marketAddress, 'ONE_DAY', 30)

      // ✅ Transform API response (strings) to chart format (numbers)
      const transformed: PricePoint[] = response.data.map((point: PricePointAPI) => ({
        timestamp: point.timestamp,
        price: parseFloat(point.price),
        volume: point.volume ? parseFloat(point.volume) : undefined,
        high: point.high ? parseFloat(point.high) : undefined,
        low: point.low ? parseFloat(point.low) : undefined,
      }))

      setPriceHistory(transformed)
      console.log(`✅ Loaded ${transformed.length} price points`)
    } catch (err) {
      console.error('❌ Error loading price history:', err)
      // Set empty array on error
      setPriceHistory([])
    }
  }, [marketAddress])

  /**
   * Load volume data
   */
  const loadVolumeData = useCallback(async () => {
    if (!marketAddress) return

    try {
      const response = await api.getVolumeChart(marketAddress, 'ONE_DAY', 30)

      // ✅ Transform if needed
      const transformed: VolumeData[] = response.data.map((point: VolumeDataAPI) => ({
        timestamp: point.timestamp,
        volume: typeof point.volume === 'string' ? parseFloat(point.volume) : point.volume,
        volumeSOL: point.volumeSOL,
        trades: point.trades,
      }))

      setVolumeData(transformed)
      console.log(`✅ Loaded ${transformed.length} volume points`)
    } catch (err) {
      console.error('❌ Error loading volume data:', err)
      setVolumeData([])
    }
  }, [marketAddress])

  /**
   * Load top holders
   */
  const loadHolders = useCallback(async () => {
    if (!marketAddress) return

    try {
      const response = await api.getTopHolders(marketAddress, 10)
      setHolders(response.data)
      console.log(`✅ Loaded ${response.data.length} holders`)
    } catch (err) {
      console.error('❌ Error loading holders:', err)
      setHolders([])
    }
  }, [marketAddress])

  /**
   * Load 24h statistics
   */
  const load24hStats = useCallback(async () => {
    if (!marketAddress) return

    try {
      const response = await api.get24hStats(marketAddress)
      setStats24h(response.data)
      console.log('✅ Loaded 24h stats:', response.data)
    } catch (err) {
      console.error('❌ Error loading 24h stats:', err)
      setStats24h(null)
    }
  }, [marketAddress])

  /**
   * Load all data
   */
  const loadAllData = useCallback(async () => {
    if (!marketAddress) {
      setError('Market address is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log(`🔄 Loading data for market: ${marketAddress}`)

      // Load all data in parallel
      await Promise.allSettled([
        loadMarket(),
        loadTransactions(),
        loadPriceHistory(),
        loadVolumeData(),
        loadHolders(),
        load24hStats(),
      ])

      console.log('✅ All market data loaded successfully')
    } catch (err) {
      console.error('❌ Error loading market data:', err)
      setError('Failed to load market data')
    } finally {
      setLoading(false)
    }
  }, [marketAddress, loadMarket, loadTransactions, loadPriceHistory, loadVolumeData, loadHolders, load24hStats])

  /**
   * Refresh only market data (lightweight)
   */
  const refreshMarket = useCallback(async () => {
    console.log('🔄 Refreshing market data...')
    try {
      await loadMarket()
    } catch (err) {
      console.error('❌ Refresh market failed:', err)
    }
  }, [loadMarket])

  /**
   * Refresh only transactions
   */
  const refreshTransactions = useCallback(async () => {
    console.log('🔄 Refreshing transactions...')
    try {
      await loadTransactions()
    } catch (err) {
      console.error('❌ Refresh transactions failed:', err)
    }
  }, [loadTransactions])

  /**
   * Refresh only price history
   */
  const refreshPriceHistory = useCallback(async () => {
    console.log('🔄 Refreshing price history...')
    try {
      await loadPriceHistory()
    } catch (err) {
      console.error('❌ Refresh price history failed:', err)
    }
  }, [loadPriceHistory])

  /**
   * Refresh only holders
   */
  const refreshHolders = useCallback(async () => {
    console.log('🔄 Refreshing holders...')
    try {
      await loadHolders()
    } catch (err) {
      console.error('❌ Refresh holders failed:', err)
    }
  }, [loadHolders])

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    console.log('🔄 Refreshing all market data...')
    await loadAllData()
  }, [loadAllData])

  // Initial load
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  return {
    // Data
    market,
    transactions,
    priceHistory,
    volumeData,
    holders,
    stats24h,

    // State
    loading,
    error,

    // Actions
    refresh,
    refreshMarket,
    refreshTransactions,
    refreshPriceHistory,
    refreshHolders,
  }
}
