'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Trophy,
  Crown,
  Medal,
  Loader2,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Sparkles,
  LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Market } from '@/types'
type SortBy = 'marketCap' | 'volume' | 'trades' | 'holders'
const sortOptions: Array<{ key: SortBy; label: string; icon: LucideIcon }> = [
  { key: 'marketCap', label: 'Market Cap', icon: DollarSign },
  { key: 'volume', label: 'Volume', icon: TrendingUp },
  { key: 'trades', label: 'Trades', icon: Activity },
  { key: 'holders', label: 'Holders', icon: Users },
]
export default function LeaderboardPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('marketCap')

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        const response = await api.getLeaderboard(sortBy, 20)
        setMarkets(response.data)
      } catch (error) {
        console.error('Error loading leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLeaderboard()
  }, [sortBy])

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <Crown className="w-8 h-8 text-yellow-500" />
        </motion.div>
      )
    if (rank === 2)
      return (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Medal className="w-7 h-7 text-gray-400" />
        </motion.div>
      )
    if (rank === 3)
      return (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Medal className="w-7 h-7 text-orange-600" />
        </motion.div>
      )
    return <span className="text-xl font-bold text-purple-600">#{rank}</span>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl"
            >
              <Trophy className="w-9 h-9 text-white" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Top performing markets</p>
            </div>
          </div>

          {/* Sort Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {sortOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <motion.button
                  key={option.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy(option.key)}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    sortBy === option.key
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {option.label}
                  {sortBy === option.key && (
                    <motion.div
                      layoutId="activeSort"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Leaderboard Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Loader2 className="w-16 h-16 text-purple-600" />
              </motion.div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading leaderboard...</p>
            </motion.div>
          ) : markets.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700"
            >
              <Trophy className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No markets yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Be the first to create a market!</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {markets.map((market, index) => {
                const isTopThree = index < 3

                return (
                  <motion.div
                    key={market.publicKey}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <Link href={`/market/${market.publicKey}`}>
                      <div
                        className={`relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all ${
                          isTopThree
                            ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-2 border-yellow-400 dark:border-yellow-600'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                        }`}
                      >
                        {/* Top 3 Sparkle Effect */}
                        {isTopThree && (
                          <motion.div
                            className="absolute top-2 right-2"
                            animate={{
                              scale: [1, 1.2, 1],
                              rotate: [0, 180, 360],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                            }}
                          >
                            <Sparkles className="w-6 h-6 text-yellow-500" />
                          </motion.div>
                        )}

                        <div className="flex items-center gap-6">
                          {/* Rank */}
                          <div className="w-16 flex-shrink-0 flex justify-center">{getRankIcon(market.rank || 0)}</div>

                          {/* Token Icon */}
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className="relative w-16 h-16 flex-shrink-0"
                          >
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-2xl flex items-center justify-center shadow-xl">
                              {market.imageUrl ? (
                                <Image
                                  width={100}
                                  height={100}
                                  src={market.imageUrl ||""}
                                  alt={market.name || ''}
                                  className="w-full h-full object-cover rounded-2xl"
                                />
                              ) : (
                                <span className="text-xl font-bold text-white">{market.symbol}</span>
                              )}
                            </div>
                            {isTopThree && (
                              <motion.div
                                className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center"
                                animate={{
                                  scale: [1, 1.2, 1],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                }}
                              >
                                <span className="text-xs font-bold text-white">{market.rank || 0}</span>
                              </motion.div>
                            )}
                          </motion.div>

                          {/* Token Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold truncate text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                              {market.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{market.symbol}</p>
                          </div>

                          {/* Stats Grid */}
                          <div className="hidden md:grid grid-cols-3 gap-8 text-right">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm"
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price</p>
                              <p className="font-bold text-purple-600 dark:text-purple-400">
                                {market.currentPriceSOL} SOL
                              </p>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm"
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Market Cap</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                {market.marketCapSOL || 0} SOL
                              </p>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm"
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {sortBy === 'holders'
                                  ? 'Holders'
                                  : sortBy === 'trades'
                                    ? 'Trades'
                                    : sortBy === 'volume'
                                      ? 'Volume'
                                      : 'Holders'}
                              </p>
                              <p className="font-bold text-blue-600 dark:text-blue-400">
                                {sortBy === 'holders'
                                  ? market.holderCount
                                  : sortBy === 'trades'
                                    ? market.tradeCount
                                    : sortBy === 'volume'
                                      ? `${market.volume24hSOL || '0.00'} SOL`
                                      : market.holderCount}
                              </p>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
