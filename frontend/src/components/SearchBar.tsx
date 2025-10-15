'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from './ui/input'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Market } from '@/types'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.searchMarkets(q)
      setResults(response.data)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search markets..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-purple-600" />
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.map((market) => (
            <Link
              key={market.publicKey}
              href={`/market/${market.publicKey}`}
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{market.symbol}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{market.name}</p>
                  <p className="text-sm text-gray-500">{market.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{market.currentPriceSOL} SOL</p>
                  <p className="text-xs text-gray-500">{market.holderCount} holders</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
