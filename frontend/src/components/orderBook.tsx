'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface Order {
  price: number
  amount: number
  total: number
}

export function OrderBook() {
  // Mock data (replace with real order book from backend)
  const buyOrders: Order[] = [
    { price: 0.998, amount: 1000, total: 998 },
    { price: 0.997, amount: 2500, total: 2492.5 },
    { price: 0.996, amount: 5000, total: 4980 },
    { price: 0.995, amount: 10000, total: 9950 },
    { price: 0.994, amount: 15000, total: 14910 },
  ]

  const sellOrders: Order[] = [
    { price: 1.002, amount: 800, total: 801.6 },
    { price: 1.003, amount: 1500, total: 1504.5 },
    { price: 1.004, amount: 3000, total: 3012 },
    { price: 1.005, amount: 7000, total: 7035 },
    { price: 1.006, amount: 12000, total: 12072 },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Order Book</h3>

      <div className="grid grid-cols-3 gap-2 mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
        <div>Price (SOL)</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total (SOL)</div>
      </div>

      {/* Sell Orders */}
      <div className="space-y-1 mb-4">
        {sellOrders.reverse().map((order, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-2 text-sm py-1.5 px-2 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition"
          >
            <div className="text-red-600 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {order.price.toFixed(4)}
            </div>
            <div className="text-right">{order.amount.toLocaleString()}</div>
            <div className="text-right">{order.total.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Spread</span>
          <span className="font-bold text-purple-600">0.004 SOL (0.4%)</span>
        </div>
      </div>

      {/* Buy Orders */}
      <div className="space-y-1">
        {buyOrders.map((order, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-2 text-sm py-1.5 px-2 rounded hover:bg-green-50 dark:hover:bg-green-900/10 transition"
          >
            <div className="text-green-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {order.price.toFixed(4)}
            </div>
            <div className="text-right">{order.amount.toLocaleString()}</div>
            <div className="text-right">{order.total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
