'use client'

import {  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatSOL,  } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PriceChartProps {
  data: Array<{ timestamp: number; price: number; volume?: number }>
  symbol?: string
}

export function PriceChart({ data, symbol = 'TOKEN' }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl">
        <p className="text-gray-500">No price data available</p>
      </div>
    )
  }

  const firstPrice = data[0]?.price || 0
  const lastPrice = data[data.length - 1]?.price || 0
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(2) : '0'
  const isPositive = priceChange >= 0

  const formatTooltip = (value: number, name: string) => {
    if (name === 'price') {
      return [`${formatSOL(value * 1e9)} SOL`, 'Price']
    }
    return [value, name]
  }

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{symbol} Price</h3>
          <p className="text-3xl font-bold mt-1">{formatSOL(lastPrice * 1e9)} SOL</p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}
        >
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}
            {priceChangePercent}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="timestamp" tickFormatter={formatXAxis} stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis tickFormatter={(value) => `${value.toFixed(4)} SOL`} stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleString()}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#9333ea"
              strokeWidth={2}
              fill="url(#colorPrice)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
