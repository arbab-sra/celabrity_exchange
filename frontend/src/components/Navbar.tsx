'use client'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coins, BarChart3, Trophy, Briefcase, Plus, Menu, X, User,  DollarSign } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/markets', label: 'Markets', icon: Coins },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/account', label: 'Account', icon: User },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/creator-earnings', label: 'Creator Earnings', icon: DollarSign },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="border-b bg-white/90 dark:bg-gray-800/90 sticky top-0 z-50 backdrop-blur-lg shadow-sm rounded-br-md rounded-bl-md"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 bg-gradient-to-b rounded-xl flex items-center justify-center shadow-lg"
            >
              <Image
                width={40}
                height={40}
                alt="logo"
                src={
                  'https://res.cloudinary.com/duns099gs/image/upload/v1760680167/Screenshot_2025-10-16_at_1.20.45_PM_yzhnnd.png'
                }
              />
            </motion.div>
            <span className="hidden sm:block font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 transition-all">
              Celebrity Exchange
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400 font-semibold shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:block">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Link
                href="/create"
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-yellow-600 text-white hover:from-purple-700 hover:to-gray-700 transition-all font-semibold ml-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span className="hidden md:block">Create</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="ml-2"
            >
              <WalletMultiButton className="!bg-gradient-to-r !from-gray-900 !to-gray-800 hover:!from-gray-800 hover:!to-gray-700 !rounded-xl !shadow-lg !transition-all !duration-300 hover:!scale-105" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <ThemeToggle />
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeToggle />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Link
                    href="/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Create Market
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-2"
                >
                  <WalletMultiButton className="!w-full !rounded-xl !shadow-lg" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
