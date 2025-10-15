'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { QrCode } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDialogProps {
  address: string
}

export function QRCodeDialog({ address }: QRCodeDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 hover:bg-white/20 rounded-lg transition"
        >
          <QrCode className="w-5 h-5" />
        </motion.button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wallet QR Code</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-8">
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG value={address} size={250} level="H" />
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Scan this QR code to send SOL to this wallet
        </p>
      </DialogContent>
    </Dialog>
  )
}
