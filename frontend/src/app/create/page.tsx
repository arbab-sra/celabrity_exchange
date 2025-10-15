'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Transaction } from '@solana/web3.js'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function CreatePage() {
  const { publicKey, connected, signTransaction } = useWallet()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    initialPrice: '1000000000',
    initialSupply: '1000000',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected || !publicKey) {
      toast.error('Please connect your wallet!')
      return
    }

    if (!signTransaction) {
      toast.error('Your wallet does not support transaction signing!')
      return
    }

    setLoading(true)
    const loadingToast = toast.loading('Preparing transaction...')

    try {
      // Step 1: Prepare the transaction (backend partially signs)
      console.log('📝 Preparing market creation...')
      const prepared = await api.prepareCreateMarket({
        userWallet: publicKey.toString(),
        initialPrice: Number(formData.initialPrice),
        initialSupply: Number(formData.initialSupply),
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        imageUrl: formData.imageUrl,
      })

      console.log('✅ Transaction prepared')
      console.log('💰 Estimated cost:', prepared.data.estimatedCost.totalSOL, 'SOL')

      toast.loading('Requesting wallet signature...', { id: loadingToast })

      // Step 2: Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(prepared.data.transaction, 'base64'))

      // Step 3: User signs with their wallet
      console.log('✍️ Requesting user signature...')
      const signedTransaction = await signTransaction(transaction)

      toast.loading('Sending transaction...', { id: loadingToast })

      // Step 4: Send the fully signed transaction
      console.log('📤 Broadcasting transaction...')
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed',
      )

      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      console.log('📝 Transaction signature:', signature)
      toast.loading('Confirming transaction...', { id: loadingToast })

      // Step 5: Confirm with backend
      console.log('⏳ Confirming with backend...')
      const result = await api.confirmCreateMarket({
        signature,
        marketAddress: prepared.data.marketAddress,
        userWallet: publicKey.toString(),
      })

      // Success!
      toast.success(`✅ Token created successfully!\n\nView on Explorer`, {
        id: loadingToast,
        duration: 5000,
      })

      console.log('✅ Market created successfully!')
      console.log('🔗 Explorer:', result.data.explorerUrl)

      // Navigate to the new market
      setTimeout(() => {
        router.push(`/market/${prepared.data.marketAddress}`)
      }, 1000)
    } catch (error: any) {
      console.error('❌ Error creating market:', error)

      // User-friendly error messages
      let errorMessage = 'Failed to create market'

      if (error.message?.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user'
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance. You need at least 0.15 SOL.'
      } else if (error.message?.includes('Simulation failed')) {
        errorMessage = 'Transaction simulation failed. Please check your inputs.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage, { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">Create Celebrity Token</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Launch your own celebrity token in minutes</p>

      {/* Fee Information */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
        <h3 className="font-semibold mb-2">💰 Fees</h3>
        <ul className="text-sm space-y-1">
          <li>
            • Creation Fee: <strong>0.1 SOL</strong> (~$20)
          </li>
          <li>
            • Account Rent: <strong>~0.007 SOL</strong> (one-time)
          </li>
          <li>
            • Transaction Fee: <strong>1%</strong> on every trade
          </li>
          <li className="pt-2 border-t border-yellow-300 dark:border-yellow-700 mt-2">
            <strong>Total Required: ~0.15 SOL</strong> (includes buffer)
          </li>
        </ul>
      </div>

      {/* Wallet Connection Warning */}
      {!connected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <p className="text-sm">
            ℹ️ <strong>Connect your wallet</strong> to create a token. You will pay the creation fee from your wallet.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
        {/* Token Name */}
        <div>
          <label className="block font-semibold mb-2">
            Token Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={32}
            placeholder="e.g., Taylor Swift"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">{formData.name.length}/32 characters</p>
        </div>

        {/* Symbol */}
        <div>
          <label className="block font-semibold mb-2">
            Symbol <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={10}
            placeholder="e.g., TSWIFT"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 uppercase"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">{formData.symbol.length}/10 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            placeholder="Tell us about this token..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block font-semibold mb-2">
            Image URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            placeholder="https://i.imgur.com/example.jpg"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">Use Imgur, IPFS, or any public URL</p>

          {/* Image Preview */}
          {formData.imageUrl && (
            <div className="mt-3">
              <Image
                src={formData.imageUrl}
                alt="Token preview"
                width={128}
                height={128}
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/128?text=Invalid+URL'
                }}
              />
            </div>
          )}
        </div>

        {/* Initial Price */}
        <div>
          <label className="block font-semibold mb-2">
            Initial Price (lamports) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="1000000000"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={formData.initialPrice}
            onChange={(e) => setFormData({ ...formData, initialPrice: e.target.value })}
            required
            disabled={loading}
            min="1"
          />
          <p className="text-sm text-gray-500 mt-1">
            = <strong>{(Number(formData.initialPrice) / 1e9).toFixed(6)} SOL</strong> per token
          </p>
        </div>

        {/* Initial Supply */}
        <div>
          <label className="block font-semibold mb-2">
            Initial Supply <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="1000000"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={formData.initialSupply}
            onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
            required
            disabled={loading}
            min="1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Total: <strong>{Number(formData.initialSupply).toLocaleString()}</strong> tokens
          </p>
        </div>

        {/* Market Cap Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">📊 Market Preview</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Price per token:</span>
              <span className="font-mono">{(Number(formData.initialPrice) / 1e9).toFixed(6)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total supply:</span>
              <span className="font-mono">{Number(formData.initialSupply).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
              <span className="text-gray-600 dark:text-gray-400">Market cap:</span>
              <span className="font-mono font-semibold">
                {((Number(formData.initialPrice) / 1e9) * Number(formData.initialSupply)).toFixed(4)} SOL
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !connected}
          className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Token...
            </>
          ) : !connected ? (
            'Connect Wallet First'
          ) : (
            'Create Token (Pay ~0.107 SOL)'
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By creating a token, you agree to pay the creation fee and transaction fees. Your wallet will be the owner of
          this market.
        </p>
      </form>
    </div>
  )
}
