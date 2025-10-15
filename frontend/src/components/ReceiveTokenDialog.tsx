'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Download, Copy, Check  } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { shortenAddress } from '@/lib/utils'

interface ReceiveTokenDialogProps {
  address: string
}

export function ReceiveTokenDialog({ address }: ReceiveTokenDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition"
        >
          <Download className="w-5 h-5" />
          Receive
        </motion.button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive SOL</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-6 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG value={address} size={200} level="H" />
            </div>
          </div>

          {/* Address Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">Your Wallet Address</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm font-mono text-gray-900 dark:text-white">{shortenAddress(address, 12)}</code>
              <Button onClick={copyAddress} variant="secondary" size="sm">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Full Address */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Full Address:</p>
            <p className="text-xs font-mono break-all text-gray-900 dark:text-white">{address}</p>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white">How to receive SOL:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Share this address or QR code with the sender</li>
              <li>Wait for the transaction to be confirmed</li>
              <li>Your balance will update automatically</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
