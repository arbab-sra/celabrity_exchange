'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Market } from '@/types'
import { MarketCard } from '@/components/MarketCard'
import { Search, Loader2, TrendingUp, Filter, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ✅ Define as type, not enum
type SortByValue = 'name' | 'price' | 'volume' | 'holders'

// ✅ Properly typed options
interface SortOption {
  value: SortByValue
  label: string
}

const sortByOptions: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'volume', label: 'Volume' },
  { value: 'holders', label: 'Holders' },
]

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortByValue>('name') // ✅ Set initial value
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadMarkets()
  }, [])

  const loadMarkets = async () => {
    try {
      const response = await api.getAllMarkets()
      setMarkets(response.data)
    } catch (error) {
      console.error('Error loading markets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedMarkets = markets
    .filter(
      (market) =>
        market.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.publicKey.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return Number(b.currentPrice) - Number(a.currentPrice)
        case 'volume':
          return Number(b.tradeCount) - Number(a.tradeCount)
        case 'holders':
          return (b.holderCount || 0) - (a.holderCount || 0)
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                All Markets
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Discover and trade celebrity tokens</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Markets</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{markets.length}</p>
              </div>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, symbol, or address..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </motion.button>
                )}
              </div>

              {/* Sort Dropdown */}
              <motion.div whileTap={{ scale: 0.98 }} className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  Sort: {sortByOptions.find((opt) => opt.value === sortBy)?.label}
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-10"
                    >
                      {sortByOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value) // ✅ Type-safe now!
                            setShowFilters(false)
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                            sortBy === option.value
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Active Filters */}
            {(searchTerm || sortBy !== 'name') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                  <Filter className="w-4 h-4" />
                  <span>Active filters: </span>

                  {searchTerm && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg font-semibold">
                      Search: {searchTerm}
                    </span>
                  )}

                  {sortBy !== 'name' && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-semibold">
                      Sort: {sortByOptions.find((opt) => opt.value === sortBy)?.label}
                    </span>
                  )}

                  <span className="text-gray-400">•</span>
                  <span>{filteredAndSortedMarkets.length} results</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Markets Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="w-12 h-12 text-purple-600" />
            </motion.div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading markets...</p>
          </div>
        ) : filteredAndSortedMarkets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700"
          >
            <TrendingUp className="w-20 h-20 mx-auto mb-6 text-gray-400" />
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              {searchTerm ? 'No markets found' : 'No markets yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a market!'}
            </p>
            {!searchTerm && (
              <a
                href="/create"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                Create First Market
              </a>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAndSortedMarkets.map((market, index) => (
              <motion.div
                key={market.publicKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <MarketCard market={market} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
