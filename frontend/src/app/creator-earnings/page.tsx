'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { api } from '@/lib/api'
import { TrendingUp, DollarSign, Wallet, ArrowUpRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CreatorEarningsPage() {
  const { publicKey } = useWallet()
  const [earnings, setEarnings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (publicKey) {
      loadEarnings()
    } else {
      setLoading(false)
    }
  }, [publicKey])

  const loadEarnings = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const response = await api.getCreatorEarnings(publicKey.toString())
      setEarnings(response.data)
    } catch (error) {
      console.error('Error loading creator earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-20 h-20 mx-auto mb-4 text-purple-600" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400">Connect your wallet to view your creator earnings</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Creator Earnings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Track earnings from your created tokens (30% of all trading fees)
        </p>
      </motion.div>

      {/* Total Earnings Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-6 h-6" />
          <p className="text-white/80 text-lg">Total Earnings (30% of fees)</p>
        </div>
        <p className="text-6xl font-bold mb-6">
          {earnings?.totalEarningsSOL || '0.000000'} <span className="text-4xl text-white/80">SOL</span>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm mb-1">Markets Created</p>
            <p className="text-3xl font-bold">{earnings?.marketsCreated || 0}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm mb-1">Recent Fees (24h)</p>
            <p className="text-3xl font-bold">
              {earnings?.recentFees
                ?.filter((f: any) => new Date(f.blockTime) > new Date(Date.now() - 86400000))
                ?.reduce((sum: number, f: any) => sum + Number(f.creatorFee), 0) / 1e9 || 0}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Markets List */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <h2 className="text-2xl font-bold col-span-full">Your Created Markets</h2>
        {earnings?.markets?.length > 0 ? (
          earnings.markets.map((market: any, index: number) => (
            <motion.div
              key={market.publicKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/market/${market.publicKey}`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                        {market.name}
                      </h3>
                      <p className="text-sm text-gray-500">{market.symbol}</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Fees Earned</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {market.totalCreatorFeesSOL} SOL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Trades</span>
                      <span className="font-semibold">{market.tradeCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Created</span>
                      <span className="text-gray-500">{new Date(market.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">No Markets Created Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first token to start earning fees!</p>
            <Link href="/create">
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition">
                Create Token
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Fee Transactions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Fee Transactions</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Fee Earned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {earnings?.recentFees?.slice(0, 20).map((fee: any) => (
                  <tr key={fee.signature} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                    <td className="px-4 py-3 text-sm">{new Date(fee.blockTime).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold">{fee.market.name}</p>
                        <p className="text-xs text-gray-500">{fee.market.symbol}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          fee.type === 'BUY'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {fee.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                      +{fee.creatorFeeSOL} SOL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
