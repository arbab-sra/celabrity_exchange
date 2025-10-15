'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { PlatformAnalytics } from '@/types'

interface UsePlatformAnalyticsReturn {
  analytics: PlatformAnalytics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePlatformAnalytics(): UsePlatformAnalyticsReturn {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading platform analytics...')
      const response = await api.getPlatformAnalytics()
      setAnalytics(response.data)
      console.log('✅ Platform analytics loaded')
    } catch (err:any) {
      console.error('❌ Error loading analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics,
  }
}
