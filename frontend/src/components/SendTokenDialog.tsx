'use client'

import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { isValidSolanaAddress } from '@/lib/utils'

interface SendTokenDialogProps {
  balance: number
  onSuccess?: () => void
}

export function SendTokenDialog({ balance, onSuccess }: SendTokenDialogProps) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet!')
      return
    }

    if (!recipient || !amount) {
      toast.error('Please fill in all fields')
      return
    }

    if (!isValidSolanaAddress(recipient)) {
      toast.error('Invalid recipient address')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount')
      return
    }

    if (amountNum > balance) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)

    try {
      const recipientPubkey = new PublicKey(recipient)
      const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        }),
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTx = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTx.serialize())

      toast.loading('Confirming transaction...', { id: 'send' })

      await connection.confirmTransaction(signature, 'confirmed')

      toast.success(`✅ Sent ${amountNum} SOL successfully!`, { id: 'send' })

      setRecipient('')
      setAmount('')
      setOpen(false)

      if (onSuccess) {
        setTimeout(onSuccess, 1000)
      }
    } catch (error:any) {
      console.error('Send error:', error)
      toast.error(error.message || 'Failed to send SOL', { id: 'send' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition"
        >
          <Send className="w-5 h-5" />
          Send
        </motion.button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SOL</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Balance Display */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-purple-600">{balance.toFixed(4)} SOL</p>
          </div>

          {/* Recipient Input */}
          <Input
            label="Recipient Address"
            placeholder="Enter Solana address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={loading}
          />

          {/* Amount Input */}
          <div>
            <Input
              type="number"
              label="Amount (SOL)"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              disabled={loading}
            />
            <div className="flex gap-2 mt-2">
              {[0.1, 0.5, 1].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  disabled={loading}
                >
                  {val} SOL
                </button>
              ))}
              <button
                onClick={() => setAmount(Math.max(balance - 0.001, 0).toFixed(4))}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                disabled={loading}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Warning */}
          {amount && parseFloat(amount) > balance && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">Insufficient balance</p>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={loading || !recipient || !amount || parseFloat(amount) > balance}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send {amount || '0'} SOL
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
