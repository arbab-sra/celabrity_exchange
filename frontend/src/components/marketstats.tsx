'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, DollarSign, Users, Activity, Zap } from 'lucide-react'
import { formatSOL, formatNumber } from '@/lib/utils'

interface MarketStatsProps {
  currentPrice: string
  marketCap: string
  totalSupply: string
  tradeCount: string
  volume24h?: number
  holders?: number
}

export function MarketStats({
  currentPrice,
  marketCap,
  totalSupply,
  tradeCount,
  volume24h = 0,
  holders = 0,
}: MarketStatsProps) {
  const stats = [
    {
      icon: DollarSign,
      label: 'Current Price',
      value: `${formatSOL(currentPrice)} SOL`,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Market Cap',
      value: `${formatSOL(marketCap)} SOL`,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: Activity,
      label: 'Total Supply',
      value: formatNumber(totalSupply),
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Zap,
      label: 'Trades',
      value: tradeCount,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      icon: Activity,
      label: '24h Volume',
      value: volume24h > 0 ? `${volume24h.toFixed(2)} SOL` : '—',
      color: 'text-pink-600',
      bg: 'bg-pink-100 dark:bg-pink-900/20',
    },
    {
      icon: Users,
      label: 'Holders',
      value: holders > 0 ? formatNumber(holders) : '—',
      color: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className={`${stat.bg} p-3 rounded-lg`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
          <p className="text-2xl font-bold">{stat.value}</p>
        </Card>
      ))}
    </div>
  )
}
