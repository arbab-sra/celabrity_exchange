'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { api } from '@/lib/api'
import { Portfolio } from '@/types'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  PieChart,
  Activity,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function PortfolioPage() {
  const { publicKey } = useWallet()
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalValueSOL, setTotalValueSOL] = useState(0)
  const [totalPnLSOL, setTotalPnLSOL] = useState(0)

  useEffect(() => {
    if (publicKey) {
      loadPortfolio()
    } else {
      setLoading(false)
    }
  }, [publicKey])

  const loadPortfolio = async () => {
    if (!publicKey) return

    try {
      setLoading(true)
      const response = await api.getUserPortfolio(publicKey.toString())

      setPortfolio(response.data.holdings)
      setTotalValueSOL(parseFloat(response.data.summary.totalValueSOL))
      setTotalPnLSOL(parseFloat(response.data.summary.totalPnLSOL))
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPortfolio()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <Wallet className="w-20 h-20 mx-auto mb-6 text-purple-600" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Please connect your wallet to view your portfolio
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  const isProfit = totalPnLSOL >= 0
  const profitPercentage = totalValueSOL > 0 ? ((totalPnLSOL / (totalValueSOL - totalPnLSOL)) * 100).toFixed(2) : '0'

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
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              My Portfolio
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Track all your celebrity token holdings</p>
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

        {/* Total Value Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 mb-8 text-white shadow-2xl"
        >
          {/* Animated Background Pattern */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                               radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
            animate={{
              backgroundPosition: ['0px 0px', '50px 50px'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-6 h-6 text-white/80" />
              <p className="text-white/80 text-lg">Total Portfolio Value</p>
            </div>

            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="text-6xl font-bold mb-6"
            >
              {totalValueSOL.toFixed(4)} <span className="text-4xl text-white/80">SOL</span>
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total P&L */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-white/80" />
                  <p className="text-white/80 text-sm">Total P&L</p>
                </div>
                <p
                  className={`text-3xl font-bold flex items-center gap-2 ${
                    isProfit ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {isProfit ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  {isProfit ? '+' : ''}
                  {totalPnLSOL.toFixed(4)} SOL
                </p>
                <p className="text-white/60 text-sm mt-1">
                  {isProfit ? '+' : ''}
                  {profitPercentage}%
                </p>
              </motion.div>

              {/* Total Holdings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-white/80" />
                  <p className="text-white/80 text-sm">Total Holdings</p>
                </div>
                <p className="text-3xl font-bold">{portfolio.length}</p>
                <p className="text-white/60 text-sm mt-1">Active positions</p>
              </motion.div>

              {/* Average Performance */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-white/80" />
                  <p className="text-white/80 text-sm">Avg. Position Value</p>
                </div>
                <p className="text-3xl font-bold">
                  {portfolio.length > 0 ? (totalValueSOL / portfolio.length).toFixed(2) : '0.00'}
                </p>
                <p className="text-white/60 text-sm mt-1">SOL per holding</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Holdings Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Loader2 className="w-12 h-12 text-purple-600" />
              </motion.div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading portfolio...</p>
            </motion.div>
          ) : portfolio.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Wallet className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No tokens yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                Start building your portfolio by exploring available markets
              </p>
              <Link
                href="/markets"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                Explore Markets
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {portfolio.map((item, index) => {
                const isProfitable = parseFloat(item.totalPnLSOL) >= 0

                return (
                  <motion.div
                    key={item.market.publicKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  >
                    <Link href={`/market/${item.market.publicKey}`}>
                      <div className="group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-lg font-bold text-white">{item.market.symbol?.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                                {item.market.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.market.symbol}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.balanceFormatted} tokens
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Value</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.currentValueSOL} SOL
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Buy Price</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.averageBuyPriceSOL} SOL
                            </span>
                          </div>

                          {/* P&L Section */}
                          <div
                            className={`mt-4 p-4 rounded-2xl ${
                              isProfitable
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-900 dark:text-white">Total P&L</span>
                              <span
                                className={`text-2xl font-bold ${
                                  isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {isProfitable ? '+' : ''}
                                {item.totalPnLSOL} SOL
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Unrealized:</span>
                                <span
                                  className={`ml-1 font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {item.unrealizedPnLSOL} SOL
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-600 dark:text-gray-400">Realized:</span>
                                <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                  {item.realizedPnLSOL} SOL
                                </span>
                              </div>
                            </div>
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
