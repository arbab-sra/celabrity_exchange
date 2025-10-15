'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMarket } from '@/hoooks/useMarket'
import { PriceChart } from '@/components/charts/priceChart'
import { TradeHistory } from '@/components/tradeHistory'
import { HoldersTable } from '@/components/holderTable'
import { BuyTokensDialog } from '@/components/BuyTokensDialog'
import { SellTokensDialog } from '@/components/SellTokensDialog'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Loader2,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Share2,
  Star,
  BarChart3,
  Activity,
  Users,
  DollarSign,
  Info as InfoIcon,
  LucideIcon, // ✅ Import the type
} from 'lucide-react'
import { formatSOL, shortenAddress, formatNumber } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

type TabId = 'trades' | 'holders' | 'about'

// ✅ Fix: Use LucideIcon as the type
interface Tab {
  id: TabId
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { id: 'trades', label: 'Recent Trades', icon: Activity },
  { id: 'holders', label: 'Top Holders', icon: Users },
  { id: 'about', label: 'About', icon: InfoIcon },
]

export default function TradePage() {
  const params = useParams()
  const marketAddress = params.id as string
  const { market, transactions, priceHistory, holders, stats24h, loading, refresh } = useMarket(marketAddress)

  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('trades')

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400">Loading market data...</p>
        </motion.div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Market not found</p>
          <Link href="/markets">
            <button className="text-purple-600 hover:text-purple-700 font-semibold">← Back to Markets</button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const priceChange24h = stats24h ? parseFloat(stats24h.priceChangePercent) : 0
  const isPositiveChange = priceChange24h >= 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900" />

        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/30 dark:bg-purple-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/30 dark:bg-pink-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Link href="/markets">
              <motion.button
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Markets</span>
              </motion.button>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20 transition"
              >
                <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20 transition"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>
          </div>

          {/* Token Header Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-purple-200/50 dark:border-purple-700/50 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Token Icon */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="relative"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl">
                  {market.imageUrl ? (
                    <Image
                      width={96}
                      height={96}
                      src={market.imageUrl}
                      alt={market.name || ''}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">{market.symbol?.charAt(0)}</span>
                  )}
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </motion.div>
              </motion.div>

              {/* Token Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {market.name || 'Unknown Token'}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
                    {market.symbol}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyAddress(market.mint)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition group"
                  >
                    <span className="font-mono text-gray-600 dark:text-gray-400">{shortenAddress(market.mint)}</span>
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Check className="w-3 h-3 text-green-500" />
                        </motion.div>
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400 group-hover:text-purple-600" />
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <a
                    href={`https://solscan.io/token/${market.mint}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Solscan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Price Display */}
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</p>
                <motion.p
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {formatSOL(market.currentPrice)} <span className="text-2xl text-gray-500">SOL</span>
                </motion.p>
                {stats24h && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                      isPositiveChange
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-bold text-sm">{stats24h.priceChangePercent}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* 24h Stats Bar */}
            {stats24h && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  { icon: Activity, label: '24h Volume', value: `${stats24h.volumeSOL} SOL`, color: 'purple' },
                  { icon: TrendingUp, label: '24h High', value: `${stats24h.high24hSOL} SOL`, color: 'green' },
                  { icon: TrendingDown, label: '24h Low', value: `${stats24h.low24hSOL} SOL`, color: 'red' },
                  { icon: Users, label: 'Traders', value: stats24h.uniqueTraders, color: 'blue' },
                ].map((stat, idx) => {
                  const StatIcon = stat.icon // ✅ Rename to avoid conflict
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <StatIcon className={`w-4 h-4 text-${stat.color}-600`} />
                        <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                      </div>
                      <p className={`text-lg font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                        {stat.value}
                      </p>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Charts & Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Price Chart */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 dark:border-purple-700/50 shadow-xl">
              <PriceChart data={priceHistory} symbol={market.symbol || ''} />
            </div>

            {/* Market Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Market Cap',
                  value: `${formatSOL((BigInt(market.currentPrice) * BigInt(market.totalSupply)).toString())} SOL`,
                  icon: DollarSign,
                },
                { label: 'Volume', value: `${market.tradeCount} trades`, icon: Activity },
                { label: 'Supply', value: formatNumber(market.totalSupply), icon: BarChart3 },
                { label: 'Holders', value: market.holderCount || holders.length, icon: Users },
              ].map((stat, idx) => {
                const StatIcon = stat.icon // ✅ Rename to avoid conflict
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StatIcon className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </motion.div>
                )
              })}
            </div>

            {/* Tabs Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 dark:border-purple-700/50 shadow-xl">
              {/* Tab Headers */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl relative">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon // ✅ Extract icon component
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)} // ✅ Type-safe now
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all relative ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-[400px]"
                >
                  {activeTab === 'trades' && <TradeHistory transactions={transactions} />}
                  {activeTab === 'holders' && <HoldersTable holders={holders} />}
                  {activeTab === 'about' && (
                    <div className="space-y-4">
                      {market.description && (
                        <div>
                          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Description</h3>
                          <p className="text-gray-600 dark:text-gray-400">{market.description}</p>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Token Information</h3>
                        <div className="space-y-3 text-sm">
                          {[
                            { label: 'Name', value: market.name },
                            { label: 'Symbol', value: market.symbol },
                            {
                              label: 'Mint Address',
                              value: shortenAddress(market.mint, 12),
                              mono: true,
                            },
                            {
                              label: 'Market Address',
                              value: shortenAddress(market.publicKey, 12),
                              mono: true,
                            },
                            {
                              label: 'Created',
                              value: market.createdAt ? new Date(market.createdAt).toLocaleDateString() : 'Unknown',
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                            >
                              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                              <span
                                className={`font-medium text-gray-900 dark:text-white ${
                                  item.mono ? 'font-mono text-xs' : ''
                                }`}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Column - Trading */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <BuyTokensDialog market={market} onSuccess={refresh} />
            <SellTokensDialog market={market} onSuccess={refresh} />

            {/* Market Info Card */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-purple-200/50 dark:border-purple-700/50 shadow-xl">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Market Info</h3>
              <div className="space-y-3 text-sm">
                {[
                  {
                    label: 'Current Price',
                    value: `${formatSOL(market.currentPrice)} SOL`,
                    highlight: true,
                  },
                  { label: 'Total Trades', value: market.tradeCount },
                  { label: 'Total Supply', value: Number(market.totalSupply).toLocaleString() },
                  { label: 'Holders', value: market.holderCount || holders.length },
                  {
                    label: 'Market Cap',
                    value: `${((Number(market.currentPrice) * Number(market.totalSupply)) / 1e9).toFixed(2)} SOL`,
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span
                      className={`font-semibold ${
                        item.highlight ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
