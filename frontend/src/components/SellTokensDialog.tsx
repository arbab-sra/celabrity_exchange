'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { api } from '@/lib/api'
import { Market } from '@/types'
import { DollarSign, Loader2, Info, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function SellTokensDialog({ market, onSuccess }: { market: Market; onSuccess: () => void }) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [priceEstimate, setPriceEstimate] = useState<any>(null)
  const [slippagePercent, setSlippagePercent] = useState(2)
  const priceInSOL = Number(market.currentPrice) / 1e9

  // Fetch price estimate
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!amount || Number(amount) <= 0) return

      try {
        const estimate = await api.prepareSellTransaction({
          marketAddress: market.publicKey,
          userWallet: publicKey?.toString() || '11111111111111111111111111111111',
          amount: Number(amount),
        })
        setPriceEstimate(estimate.data)
      } catch (error) {
        console.error('Error fetching price estimate:', error)
      }
    }

    const debounce = setTimeout(fetchEstimate, 300)
    return () => clearTimeout(debounce)
  }, [amount, market.publicKey, publicKey])

  const handleSell = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet!')
      return
    }

    setLoading(true)
    const loadingToast = toast.loading('Preparing sell transaction...')

    try {
      console.log(`📝 Preparing sell with ${slippagePercent}% slippage tolerance...`)

      // Get fresh estimate
      const freshEstimate = await api.prepareSellTransaction({
        marketAddress: market.publicKey,
        userWallet: publicKey.toString(),
        amount: Number(amount),
      })

      const userReceives = freshEstimate.data.userReceives
      const minReceiveLamports = Math.floor(userReceives * (1 - slippagePercent / 100))

      console.log('💰 Fresh calculation:')
      console.log('  Expected receive:', userReceives, 'lamports')
      console.log('  Slippage tolerance:', slippagePercent, '%')
      console.log('  Min receive:', minReceiveLamports, 'lamports')

      // Get final transaction
      const prepared = await api.prepareSellTransaction({
        marketAddress: market.publicKey,
        userWallet: publicKey.toString(),
        amount: Number(amount),
        minReceiveLamports: minReceiveLamports,
      })

      toast.loading('Requesting wallet signature...', { id: loadingToast })

      const transaction = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'))

      // ✅ CRITICAL FIX FOR PHANTOM: Get FRESH blockhash right before signing
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      console.log('🔑 Fresh blockhash:', blockhash)
      console.log('✍️ Requesting signature...')

      const signedTransaction = await signTransaction(transaction)

      toast.loading('Sending transaction...', { id: loadingToast })

      console.log('📤 Broadcasting transaction...')

      // CRITICAL FIX FOR PHANTOM: Use proper send options
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false, // Phantom needs this to be false
        preflightCommitment: 'finalized', //  Changed from 'confirmed'
        maxRetries: 3, // NEW: Retry up to 3 times
      })

      console.log('📝 Transaction signature:', signature)
      toast.loading('Waiting for confirmation...', { id: loadingToast })

      //  CRITICAL FIX: Use the SAME blockhash we used for signing
      await connection.confirmTransaction(
        {
          signature,
          blockhash, //  Use the fresh blockhash
          lastValidBlockHeight,
        },
        'confirmed',
      )

      console.log('✅ Transaction confirmed on-chain')
      toast.loading('Updating database...', { id: loadingToast })

      const result = await api.confirmSellTransaction({
        signature,
        marketAddress: market.publicKey,
        userWallet: publicKey.toString(),
        amount: Number(amount),
      })

      console.log('✅ Sell confirmed:', result)

      toast.success(`✅ Sold ${amount} tokens successfully!`, { id: loadingToast, duration: 5000 })

      await onSuccess()
      setAmount('1')
    } catch (error: any) {
      console.error('❌ Sell error:', error)

      let errorMessage = 'Failed to sell tokens'

      // ✅ Better error detection for Phantom
      if (error.message?.includes('User rejected') || error.message?.includes('User canceled')) {
        errorMessage = 'Transaction cancelled'
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient token balance'
      } else if (error.message?.includes('already been processed')) {
        errorMessage = 'Transaction already processed. Please refresh and try again.'
        // ✅ Auto-refresh market data
        setTimeout(() => window.location.reload(), 2000)
      } else if (error.message?.includes('0x1772') || error.message?.includes('SlippageExceeded')) {
        errorMessage = `Price moved beyond ${slippagePercent}% slippage. This token is extremely volatile!`
        toast.error(errorMessage, { id: loadingToast, duration: 8000 })

        if (slippagePercent < 20) {
          setTimeout(() => {
            toast(
              (t) => (
                <div className="flex flex-col gap-2 p-3">
                  <p className="font-bold text-sm text-red-600">⚠️ Highly Volatile Token!</p>
                  <p className="text-xs text-gray-600">
                    Try selling smaller amounts or use {slippagePercent + 5}% slippage.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAmount(String(Math.max(1, Math.floor(Number(amount) / 2))))
                        toast.dismiss(t.id)
                      }}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700"
                    >
                      Sell Half ({Math.floor(Number(amount) / 2)})
                    </button>
                    <button
                      onClick={() => {
                        setSlippagePercent(Math.min(20, slippagePercent + 5))
                        toast.dismiss(t.id)
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                    >
                      Use {Math.min(20, slippagePercent + 5)}%
                    </button>
                  </div>
                </div>
              ),
              { duration: 15000 },
            )
          }, 500)
        }
        return
      } else if (error.message?.includes('Blockhash not found')) {
        errorMessage = 'Transaction expired. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage, { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="w-6 h-6" />
        Sell Tokens
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">Amount</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="50"
            disabled={loading}
          />
        </div>

        {/* ✅ NEW: Slippage Tolerance Control */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Slippage Tolerance
            </span>
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{slippagePercent}%</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-2">
            {[0.5, 1, 2, 3, 5].map((percent) => (
              <button
                key={percent}
                onClick={() => setSlippagePercent(percent)}
                className={`px-2 py-2 rounded text-sm font-medium transition ${
                  slippagePercent === percent
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-600'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            💡 Popular tokens need 2-3%. Low volume tokens can use 0.5-1%.
          </p>
        </div>

        {/* Price Estimate Display */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4 space-y-3 text-sm border border-red-200 dark:border-red-700">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
            <Info className="w-4 h-4" />
            <span>Bonding Curve Pricing</span>
          </div>

          {priceEstimate ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current price per token</span>
                <span className="font-semibold">{priceInSOL.toFixed(6)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average sell price</span>
                <span className="font-semibold">
                  {(priceEstimate.estimatedReceive / Number(amount) / 1e9).toFixed(6)} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Token value</span>
                <span className="font-semibold">{priceEstimate.estimatedReceiveSOL.toFixed(6)} SOL</span>
              </div>

              <div className="border-t border-red-200 dark:border-red-700 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Platform fee (70% of 1%)</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    -{priceEstimate.platformFeeSOL.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Creator fee (30% of 1%)</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    -{priceEstimate.creatorFeeSOL.toFixed(6)} SOL
                  </span>
                </div>
              </div>

              <div className="border-t border-red-300 dark:border-red-600 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Expected Receive</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {priceEstimate.userReceivesSOL.toFixed(6)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Minimum (with {slippagePercent}% slippage)</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {(priceEstimate.userReceivesSOL * (1 - slippagePercent / 100)).toFixed(6)} SOL
                  </span>
                </div>
              </div>

              {/* Price impact warning */}
              {priceEstimate.estimatedReceive / Number(amount) < Number(market.currentPrice) * 0.93 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-xs text-yellow-800 dark:text-yellow-300">
                  ⚠️ Large price impact! Try selling {Math.floor(Number(amount) / 2)} tokens instead.
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
            </div>
          )}
        </div>

        <button
          onClick={handleSell}
          disabled={loading || !publicKey || !amount || Number(amount) <= 0}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-lg font-bold hover:from-red-700 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Selling...
            </>
          ) : !publicKey ? (
            'Connect Wallet'
          ) : (
            `Sell ${amount} Tokens`
          )}
        </button>
      </div>
    </div>
  )
}
