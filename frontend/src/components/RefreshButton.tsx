'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading}>
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  )
}
