'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { api } from '@/lib/api'
import { Transaction } from '@/types'

interface UseUserActivityReturn {
  activity: Transaction[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useUserActivity(limit: number = 50): UseUserActivityReturn {
  const { publicKey } = useWallet()
  const [activity, setActivity] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const loadActivity = useCallback(
    async (append: boolean = false) => {
      if (!publicKey) {
        setLoading(false)
        return
      }

      try {
        if (!append) setLoading(true)
        setError(null)

        console.log('🔄 Loading user activity...')
        const response = await api.getUserActivity(publicKey.toString(), limit)

        if (append) {
          setActivity((prev) => [...prev, ...response.data])
        } else {
          setActivity(response.data)
        }

        setHasMore(response.data.length === limit)
        console.log(`✅ Loaded ${response.data.length} activities`)
      } catch (err:any) {
        console.error('❌ Error loading activity:', err)
        setError(err.message || 'Failed to load activity')
      } finally {
        setLoading(false)
      }
    },
    [publicKey, limit],
  )

  const loadMore = useCallback(async () => {
    await loadActivity(true)
  }, [loadActivity])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  return {
    activity,
    loading,
    error,
    refresh: () => loadActivity(false),
    loadMore,
    hasMore,
  }
}
