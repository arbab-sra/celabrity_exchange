'use client'

import { useEffect, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { shortenAddress, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { SendTokenDialog } from '@/components/SendTokenDialog'
import { ReceiveTokenDialog } from '@/components/ReceiveTokenDialog'
import { QRCodeDialog } from '@/components/QRCodeDialog'
import { Transaction } from '@/types'

export default function AccountPage() {
  const { publicKey, disconnect } = useWallet()
  const { connection } = useConnection()

  // State
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'transactions' | 'tokens'>('transactions')

  // Load data
  useEffect(() => {
    if (publicKey) {
      loadAccountData()
    } else {
      setLoading(false)
    }
  }, [publicKey])

  const loadAccountData = async () => {
    if (!publicKey) return

    try {
      setLoading(true)

      // Get SOL balance
      const bal = await connection.getBalance(publicKey)
      setBalance(bal / LAMPORTS_PER_SOL)

      // Get transaction history
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 20 })
      const txs = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          })
          return {
            signature: sig.signature,
            timestamp: sig.blockTime,
            status: tx?.meta?.err ? 'failed' : 'success',
            type: 'transfer', // Simplified
            amount: tx?.meta?.postBalances[0]
              ? (tx.meta.postBalances[0] - (tx?.meta?.preBalances[0] || 0)) / LAMPORTS_PER_SOL
              : 0,
          }
        }),
      )

      setTransactions(txs)
    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAccountData()
    setTimeout(() => setRefreshing(false), 500)
    toast.success('Account data refreshed!')
  }

  const copyAddress = async () => {
    if (!publicKey) return
    await navigator.clipboard.writeText(publicKey.toString())
    setCopied(true)
    toast.success('Address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
            <p className="text-gray-600 dark:text-gray-400 text-lg">Please connect your wallet to view your account</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400">Loading account data...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              My Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Manage your wallet and transactions</p>
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

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Wallet Balance</p>
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-5xl font-bold"
                  >
                    {balance.toFixed(4)} <span className="text-3xl text-white/80">SOL</span>
                  </motion.p>
                </div>
              </div>

              <button
                onClick={disconnect}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition"
              >
                Disconnect
              </button>
            </div>

            {/* Wallet Address */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <p className="text-white/80 text-sm mb-2">Wallet Address</p>
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono">{shortenAddress(publicKey.toString(), 8)}</code>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyAddress}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </motion.button>
                  <QRCodeDialog address={publicKey.toString()} />
                  <a
                    href={`https://solscan.io/account/${publicKey.toString()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <SendTokenDialog balance={balance} onSuccess={handleRefresh} />
              <ReceiveTokenDialog address={publicKey.toString()} />
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
        >
          {/* Tab Headers */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl">
            {[
              { id: 'transactions', label: 'Transaction History', icon: Activity },
              { id: 'tokens', label: 'Token Holdings', icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
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
            >
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg">No transactions yet</p>
                    </div>
                  ) : (
                    transactions.map((tx, index) => (
                      <motion.div
                        key={tx.signature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 5 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              tx.amount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                            }`}
                          >
                            {tx.amount > 0 ? (
                              <ArrowDownLeft className="w-6 h-6 text-green-600" />
                            ) : (
                              <ArrowUpRight className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {tx.amount > 0 ? 'Received' : 'Sent'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(tx.timestamp)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? '+' : ''}
                              {Math.abs(tx.amount).toFixed(4)} SOL
                            </p>
                            <p className={`text-xs ${tx.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.status === 'success' ? '✓ Success' : '✗ Failed'}
                            </p>
                          </div>
                          <a
                            href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition"
                          >
                            <ExternalLink className="w-5 h-5 text-gray-400 hover:text-purple-600" />
                          </a>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tokens' && (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Token holdings coming soon</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Check your portfolio page for token holdings
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
