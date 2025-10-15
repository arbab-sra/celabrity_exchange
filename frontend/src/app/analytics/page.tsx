'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { PlatformAnalytics } from '@/types'
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Loader2,
  Users,
  Activity,
  Crown,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await api.getPlatformAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading analytics...</p>
        </motion.div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <BarChart3 className="w-20 h-20 mx-auto mb-6 text-gray-400" />
            <p className="text-xl text-gray-600 dark:text-gray-400">Failed to load analytics</p>
            <button
              onClick={loadData}
              className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
            >
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // const COLORS = ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Platform Analytics
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg ml-15">Real-time statistics and insights</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: DollarSign,
              label: 'Total Volume',
              value: `${analytics.overview.totalVolumeSOL} SOL`,
              subValue: `$${analytics.overview.totalVolumeUSD}`,
              gradient: 'from-purple-500 to-purple-600',
              delay: 0.1,
            },
            {
              icon: PieChartIcon,
              label: 'Total Markets',
              value: analytics.overview.totalMarkets,
              subValue: null,
              gradient: 'from-blue-500 to-blue-600',
              delay: 0.2,
            },
            {
              icon: TrendingUp,
              label: 'Total Trades',
              value: analytics.overview.totalTransactions.toLocaleString(),
              subValue: null,
              gradient: 'from-green-500 to-green-600',
              delay: 0.3,
            },
            {
              icon: BarChart3,
              label: 'Platform Revenue',
              value: `${analytics.overview.totalFeesSOL} SOL`,
              subValue: `$${analytics.overview.totalFeesUSD}`,
              gradient: 'from-orange-500 to-orange-600',
              delay: 0.4,
            },
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-3xl p-6 text-white shadow-xl`}
            >
              {/* Animated Background */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
                animate={{
                  backgroundPosition: ['0px 0px', '20px 20px'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              <div className="relative z-10">
                <card.icon className="w-8 h-8 mb-3 opacity-90" />
                <p className="text-white/80 text-sm mb-1">{card.label}</p>
                <motion.p
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: card.delay + 0.2, type: 'spring' }}
                  className="text-3xl font-bold"
                >
                  {card.value}
                </motion.p>
                {card.subValue && <p className="text-white/60 text-sm mt-1">{card.subValue}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            {
              icon: Users,
              label: 'Active Users',
              value: analytics.overview.activeUsers,
              color: 'purple',
            },
            {
              icon: Activity,
              label: '24h Volume',
              value: `${analytics.overview.volume24hSOL} SOL`,
              color: 'pink',
            },
            {
              icon: TrendingUp,
              label: '24h Trades',
              value: analytics.overview.trades24h,
              color: 'blue',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-2xl flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Top Markets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-7 h-7 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Top Markets by Volume</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Token</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Price</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700 dark:text-gray-300">24h Volume</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Holders</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topMarkets.map((market, index) => (
                  <motion.tr
                    key={market.publicKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                  >
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                            }}
                          >
                            <Crown
                              className={`w-5 h-5 ${
                                index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'
                              }`}
                            />
                          </motion.div>
                        ) : (
                          <span className="font-bold text-purple-600 text-lg">#{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <Link
                        href={`/market/${market.publicKey}`}
                        className="hover:text-purple-600 dark:hover:text-purple-400 transition"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg"
                          >
                            <span className="text-sm font-bold text-white">{market.symbol}</span>
                          </motion.div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                              {market.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{market.symbol}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="font-bold text-gray-900 dark:text-white">{market.currentPriceSOL} SOL</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {market.volume24hSOL} SOL
                      </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">{market.holderCount}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
