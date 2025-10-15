'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { api } from '@/lib/api'
import { Portfolio } from '@/types'

interface UsePortfolioReturn {
  portfolio: Portfolio[]
  totalValueSOL: number
  totalPnLSOL: number
  totalPnLPercent: string
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePortfolio(): UsePortfolioReturn {
  const { publicKey } = useWallet()
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])
  const [totalValueSOL, setTotalValueSOL] = useState(0)
  const [totalPnLSOL, setTotalPnLSOL] = useState(0)
  const [totalPnLPercent, setTotalPnLPercent] = useState('0%')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPortfolio = useCallback(async () => {
    if (!publicKey) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading portfolio for:', publicKey.toString())
      const response = await api.getUserPortfolio(publicKey.toString())

      setPortfolio(response.data.holdings)
      setTotalValueSOL(parseFloat(response.data.summary.totalValueSOL))
      setTotalPnLSOL(parseFloat(response.data.summary.totalPnLSOL))
      setTotalPnLPercent(response.data.summary.totalPnLPercent)

      console.log(`✅ Loaded ${response.data.holdings.length} holdings`)
    } catch (err:any) {
      console.error('❌ Error loading portfolio:', err)
      setError(err.message || 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  return {
    portfolio,
    totalValueSOL,
    totalPnLSOL,
    totalPnLPercent,
    loading,
    error,
    refresh: loadPortfolio,
  }
}
