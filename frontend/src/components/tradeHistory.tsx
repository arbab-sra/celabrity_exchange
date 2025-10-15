'use client'

import { Transaction } from '@/types'
import { ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatTimestamp, shortenAddress } from '@/lib/utils'

export function TradeHistory({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">No trades yet. Be the first to trade!</div>
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.signature}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {/* Buy/Sell Icon */}
              {tx.type === 'BUY' ? (
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                </div>
              )}

              {/* Transaction Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${tx.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{Number(tx.amount).toLocaleString()} tokens</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <a
                    href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-purple-600 flex items-center gap-1"
                  >
                    {shortenAddress(tx.signature, 8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span>•</span>
                  <span>{formatTimestamp(tx.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="text-right">
            <p className="font-semibold">{tx.totalValueSOL} SOL</p>
            <p className="text-xs text-gray-500">@ {tx.pricePerTokenSOL} SOL</p>
          </div>
        </div>
      ))}
    </div>
  )
}
