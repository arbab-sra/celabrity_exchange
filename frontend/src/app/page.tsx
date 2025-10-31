'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Market } from '@/types'
import { MarketCard } from '@/components/MarketCard'
import Link from 'next/link'
import { TrendingUp, Zap, Shield, Users, Sparkles, ArrowRight } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ThemeToggle'
import Footercomp from '@/components/footer'

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalMarkets: 0, totalTrades: 0, totalVolume: 0 })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Celebrity Stock Exchange',
    description: 'Trade celebrity tokens on Solana blockchain',
    url: 'https://exchange.arbab.fun',
    applicationCategory: 'FinanceApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
  useEffect(() => {
    loadMarkets()
  }, [])

  const loadMarkets = async () => {
    try {
      const response = await api.getAllMarkets()
      const allMarkets = response.data
      setMarkets(allMarkets.slice(0, 6))

      const totalTrades = allMarkets.reduce((sum: number, m: Market) => sum + Number(m.tradeCount), 0)
      const totalVolume = allMarkets.reduce(
        (sum: number, m: Market) => sum + (Number(m.currentPrice) * Number(m.tradeCount)) / 1e9,
        0,
      )

      setStats({
        totalMarkets: allMarkets.length,
        totalTrades,
        totalVolume,
      })
    } catch (error) {
      console.error('Error loading markets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="min-h-screen w-full overflow-hidden">
        <section className="relative min-h-[600px] overflow-hidden rounded-md">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at top, #F3E8FF 0%, #DDD6FE 20%, #C4B5FD 40%, #A78BFA 70%, #8B5CF6 100%)',
              }}
            />

            {/* Animated Orbs */}
            <motion.div
              className="absolute top-20 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/30 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                x: [0, -50, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 py-20">
            <div className="flex justify-end mb-8">
              <ThemeToggle />
            </div>

            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Powered by Solana</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Trade Celebrity Tokens
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">Like a Pro</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl mb-8 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
              >
                Create, buy, and sell celebrity tokens with automated market making, instant settlement, and transparent
                pricing on Solana blockchain.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/markets"
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  Explore Markets
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/create"
                  className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-400 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-purple-50 dark:hover:bg-gray-700 hover:scale-105 transition-all"
                >
                  Create Token
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* STATS BAR */}
        {/* ============================================ */}
        <section className="relative z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-y border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {stats.totalMarkets}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  Active Markets
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {formatNumber(stats.totalTrades)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  Total Trades
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {stats.totalVolume.toFixed(2)} SOL
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
                  Trading Volume
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* MAIN CONTENT */}
        {/* ============================================ */}
        <div className="relative z-10 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-20">
            {/* Features Section */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Why Choose Us?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                  Experience the future of celebrity token trading with cutting-edge technology
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Zap,
                    color: 'purple',
                    title: 'Lightning Fast',
                    description: 'Trades settle in under 500ms on Solana. No waiting, no delays. Pure speed.',
                  },
                  {
                    icon: TrendingUp,
                    color: 'green',
                    title: 'Auto Market Making',
                    description: 'Bonding curve pricing ensures fair prices and instant liquidity for all tokens.',
                  },
                  {
                    icon: Shield,
                    color: 'blue',
                    title: '100% Secure',
                    description: 'Non-custodial platform. Your keys, your crypto. Audited smart contracts.',
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600"
                  >
                    <div
                      className={`w-16 h-16 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`w-8 h-8 text-${feature.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trending Markets Section */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Trending Markets
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">Most actively traded celebrity tokens</p>
                </div>
                <Link
                  href="/markets"
                  className="mt-4 sm:mt-0 group text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-2 transition-colors"
                >
                  View All
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-3xl p-6 animate-pulse border border-gray-200 dark:border-gray-700"
                    >
                      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
                    </div>
                  ))}
                </div>
              ) : markets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700"
                >
                  <Users className="w-20 h-20 mx-auto mb-6 text-gray-400" />
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">No markets yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                    Be the first to create a celebrity token market and start trading!
                  </p>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
                  >
                    Create First Market
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {markets.map((market, idx) => (
                    <motion.div
                      key={market.publicKey}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <MarketCard market={market} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* ============================================ */}
        {/* CTA SECTION */}
        {/* ============================================ */}
        <section className="relative z-10 overflow-hidden">
          <div className="absolute inset-0 " />

          {/* Animated Background Pattern */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at top, #F3E8FF 0%, #DDD6FE 20%, #C4B5FD 40%, #A78BFA 70%, #8B5CF6 100%)',
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

          <div className="relative z-10 container mx-auto px-4 py-20 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 ">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to Start Trading?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl mb-10 bg-gradient-to-r from-purple-600 to-slate-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 max-w-2xl mx-auto"
            >
              Join thousands of traders on the fastest celebrity token exchange
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Link
                href="/markets"
                className="inline-flex items-center gap-2 bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6" />
              </Link>
            </motion.div>
          </div>
        </section>
        <Footercomp />
      </div>
    </>
  )
}
