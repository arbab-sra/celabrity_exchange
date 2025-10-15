'use client'

import { Market } from '@/types'
import Link from 'next/link'
import { TrendingUp, Users } from 'lucide-react'

export function MarketCard({ market }: { market: Market }) {
  const priceInSOL = (Number(market.currentPrice) / 1e9).toFixed(4)
  const marketCapSOL = ((Number(market.currentPrice) * Number(market.totalSupply)) / 1e9).toFixed(2)

  return (
    <Link href={`/market/${market.publicKey}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-400">
        {/* Token Image */}
        <div className="w-full h-40 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-4 flex items-center justify-center">
          <span className="text-4xl font-bold text-white">{market.symbol || market.publicKey.slice(0, 4)}</span>
        </div>

        {/* Token Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1">{market.name || `Token ${market.publicKey.slice(0, 8)}`}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{market.symbol || 'TOKEN'}</p>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Price</span>
            <span className="font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {priceInSOL} SOL
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Market Cap</span>
            <span className="font-semibold">{marketCapSOL} SOL</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Trades</span>
            <span className="font-semibold flex items-center gap-1">
              <Users className="w-4 h-4" />
              {market.tradeCount}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-4 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold">
          Trade Now
        </button>
      </div>
    </Link>
  )
}
