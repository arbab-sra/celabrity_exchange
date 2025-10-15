'use client'

import { Holder } from '@/types'
import { shortenAddress } from '@/lib/utils'
import { Trophy, Medal, Award } from 'lucide-react'

export function HoldersTable({ holders }: { holders: Holder[] }) {
  if (holders.length === 0) {
    return <div className="text-center py-8 text-gray-500">No holders yet. Be the first!</div>
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />
    return <Award className="w-5 h-5 text-gray-300" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-2 font-semibold text-sm">Rank</th>
            <th className="text-left py-3 px-2 font-semibold text-sm">Wallet</th>
            <th className="text-right py-3 px-2 font-semibold text-sm">Balance</th>
            <th className="text-right py-3 px-2 font-semibold text-sm">%</th>
            <th className="text-right py-3 px-2 font-semibold text-sm">Avg Buy</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((holder) => (
            <tr
              key={holder.walletAddress}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  {getRankIcon(holder.rank)}
                  <span className="font-semibold">#{holder.rank}</span>
                </div>
              </td>
              <td className="py-3 px-2">
                <span className="font-mono text-sm">{shortenAddress(holder.walletAddress)}</span>
              </td>
              <td className="py-3 px-2 text-right font-semibold">{Number(holder.balance).toLocaleString()}</td>
              <td className="py-3 px-2 text-right text-purple-600 font-semibold">{holder.percentage}</td>
              <td className="py-3 px-2 text-right text-sm">{holder.averageBuyPriceSOL} SOL</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
