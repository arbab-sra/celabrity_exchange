'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { api } from '@/lib/api'
import { Market } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Loader2, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatSOL, formatNumber } from '@/lib/utils'

interface BuyTokensDialogProps {
  market: Market
  onSuccess?: () => void
}

interface PriceImpact {
  currentPrice: string
  currentPriceSOL: string
  newPrice: string
  newPriceSOL: string
  priceChange: string
  priceChangeSOL: string
  priceChangePercent: string
  priceImpact: string
  averagePrice: string
  averagePriceSOL: string
  totalCost: string
  totalCostSOL: string
  platformFee: string
  platformFeeSOL: string
  totalWithFee: string
  totalWithFeeSOL: string
  message: string
}

export function BuyTokensDialog({ market, onSuccess }: BuyTokensDialogProps) {
  const { publicKey, signTransaction, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  const [priceImpact, setPriceImpact] = useState<PriceImpact | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)

  useEffect(() => {
    if (amount && Number(amount) > 0 && !isNaN(Number(amount))) {
      calculatePriceImpact()
    } else {
      setPriceImpact(null)
      setPriceError(null)
    }
  }, [amount, market])

  const calculatePriceImpact = async () => {
    setCalculatingPrice(true)
    setPriceError(null)

    try {
      const result = await api.calculatePrice({
        currentPrice: market.currentPrice,
        amount: amount,
        totalSupply: market.totalSupply,
        isBuy: true,
      })

      setPriceImpact(result.data)
    } catch (error) {
      console.error('Error calculating price:', error)
      setPriceError('Failed to calculate price impact')
      setPriceImpact(null)
    } finally {
      setCalculatingPrice(false)
    }
  }

 const handleBuy = async () => {
   if (!publicKey || !signTransaction) {
     toast.error('Please connect your wallet!')
     return
   }

   setLoading(true)
   const loadingToast = toast.loading('Preparing buy transaction...')

   try {
     console.log('📝 Preparing buy transaction...')

     // Prepare transaction from backend
     const prepared = await api.prepareBuyTransaction({
       marketAddress: market.publicKey,
       userWallet: publicKey.toString(),
       amount: Number(amount),
     })

     console.log('✅ Transaction prepared')
     console.log('💰 Total cost:', prepared.data.totalWithFeesSOL, 'SOL')

     toast.loading('Requesting wallet signature...', { id: loadingToast })

     const transaction = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'))

     // ✅ CRITICAL FIX FOR PHANTOM: Get FRESH blockhash right before signing
     console.log('🔄 Fetching fresh blockhash...')
     const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')
     transaction.recentBlockhash = blockhash
     transaction.feePayer = publicKey

     console.log('🔑 Fresh blockhash:', blockhash)
     console.log('📏 Last valid height:', lastValidBlockHeight)

     console.log('✍️ Requesting signature...')
     const signedTransaction = await signTransaction(transaction)

     toast.loading('Sending transaction...', { id: loadingToast })

     console.log('📤 Broadcasting transaction...')

     // ✅ CRITICAL FIX FOR PHANTOM: Use proper send options
     const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
       skipPreflight: false, // Phantom needs this
       preflightCommitment: 'finalized', // ✅ Changed from 'confirmed'
       maxRetries: 3, // ✅ NEW: Retry up to 3 times
     })

     console.log('📝 Transaction signature:', signature)
     toast.loading('Waiting for confirmation...', { id: loadingToast })

     // ✅ CRITICAL FIX: Use the SAME blockhash we used for signing
     await connection.confirmTransaction(
       {
         signature,
         blockhash, // ✅ Use the fresh blockhash
         lastValidBlockHeight,
       },
       'confirmed',
     )

     console.log('✅ Transaction confirmed on-chain')
     toast.loading('Updating database...', { id: loadingToast })

     console.log('💾 Confirming with backend...')
     const result = await api.confirmBuyTransaction({
       signature,
       marketAddress: market.publicKey,
       userWallet: publicKey.toString(),
       amount: Number(amount),
     })

     console.log('✅ Buy confirmed:', result)

     toast.success(`✅ Purchased ${amount} tokens successfully!`, { id: loadingToast, duration: 5000 })

     await onSuccess()
     setAmount('1')
   } catch (error: any) {
     console.error('❌ Buy error:', error)

     let errorMessage = 'Failed to buy tokens'

     // ✅ Better error detection for Phantom
     if (error.message?.includes('User rejected') || error.message?.includes('User canceled')) {
       errorMessage = 'Transaction cancelled'
     } else if (error.message?.includes('insufficient')) {
       errorMessage = 'Insufficient SOL balance'
     } else if (error.message?.includes('already been processed')) {
       errorMessage = 'Transaction already processed. Please refresh and try again.'
       toast.error(errorMessage, { id: loadingToast, duration: 5000 })
       // ✅ Auto-refresh market data
       setTimeout(() => window.location.reload(), 2000)
       return
     } else if (error.message?.includes('Blockhash not found')) {
       errorMessage = 'Transaction expired. Please try again.'
     } else if (error.message?.includes('Transaction simulation failed')) {
       errorMessage = 'Simulation failed. Check your balance and try again.'
     } else if (error.message) {
       errorMessage = error.message
     }

     toast.error(errorMessage, { id: loadingToast })
   } finally {
     setLoading(false)
   }
 }


  const handleQuickAmount = (percentage: number) => {
    // Quick buy buttons for common amounts
    const maxTokens = 10000 // Max tokens for quick buy
    const quickAmount = Math.floor(maxTokens * percentage)
    setAmount(quickAmount.toString())
  }

  const priceImpactColor = () => {
    if (!priceImpact) return ''
    const impact = parseFloat(priceImpact.priceImpact)
    if (impact < 1) return 'text-green-600'
    if (impact < 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const priceImpactBgColor = () => {
    if (!priceImpact) return ''
    const impact = parseFloat(priceImpact.priceImpact)
    if (impact < 1) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (impact < 5) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Buy Tokens
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md h-full  overflow-y-scroll  sm:h-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Buy {market.symbol} Tokens</DialogTitle>
          <DialogDescription>Purchase {market.name} tokens using SOL from your wallet</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Price Display */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{formatSOL(market.currentPrice)} SOL</p>
            <p className="text-xs text-gray-500 mt-1">
              Market Cap: {((Number(market.currentPrice) * Number(market.totalSupply)) / 1e9).toFixed(2)} SOL
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Input
              type="number"
              label={`Amount (${market.symbol})`}
              placeholder="Enter number of tokens"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              className="text-lg"
              disabled={loading}
            />

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickAmount(pct)}
                  disabled={loading}
                  className="text-xs"
                >
                  {pct === 1 ? 'MAX' : `${pct * 100}%`}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Impact Calculation */}
          {calculatingPrice && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600 mr-2" />
              <span className="text-sm text-gray-600">Calculating price impact...</span>
            </div>
          )}

          {priceError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{priceError}</p>
            </div>
          )}

          {/* Price Impact Display */}
          {priceImpact && !calculatingPrice && (
            <div className="space-y-3">
              {/* Price Impact Warning */}
              <div className={`${priceImpactBgColor()} rounded-lg p-4 border`}>
                <div className="flex items-start gap-2 mb-2">
                  <Info className={`w-5 h-5 ${priceImpactColor()} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${priceImpactColor()}`}>
                      Price Impact: {priceImpact.priceImpact}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{priceImpact.message}</p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Cost Breakdown</h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                    <span className="font-semibold">{formatNumber(amount)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Average Price:</span>
                    <span className="font-semibold">{priceImpact.averagePriceSOL} SOL</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-semibold">{priceImpact.totalCostSOL} SOL</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform Fee (1%):</span>
                    <span className="font-semibold">{priceImpact.platformFeeSOL} SOL</span>
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">Total Cost:</span>
                    <span className="font-bold text-purple-600 text-xl">{priceImpact.totalWithFeeSOL} SOL</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Estimated USD:</span>
                    <span className="text-gray-500">${(parseFloat(priceImpact.totalWithFeeSOL) * 200).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Price After Trade */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">New Price:</span>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{priceImpact.newPriceSOL} SOL</p>
                  <p className="text-xs text-gray-500">{priceImpact.priceChangePercent} increase</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for High Impact */}
          {priceImpact && parseFloat(priceImpact.priceImpact) > 5 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-orange-900 dark:text-orange-200">High Price Impact!</p>
                <p className="text-orange-700 dark:text-orange-300 text-xs mt-1">
                  This trade will significantly affect the token price. Consider splitting into smaller orders.
                </p>
              </div>
            </div>
          )}

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={loading || !amount || Number(amount) <= 0 || calculatingPrice || !priceImpact}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Transaction...
              </>
            ) : calculatingPrice ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Buy {amount || '0'} Tokens
              </>
            )}
          </Button>

          {/* Info Footer */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                You will be prompted to approve this transaction in your wallet. Make sure you have enough SOL to cover
                the total cost plus network fees (~0.00001 SOL).
              </p>
            </div>

            {!publicKey && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Please connect your wallet to continue
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
