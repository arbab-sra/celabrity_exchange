import { PublicKey } from '@solana/web3.js'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format number with commas
export function formatNumber(num: string | number): string {
  return Number(num).toLocaleString()
}

// Shorten address
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// Format timestamp
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

/**
 * Format large numbers with K, M, B suffix
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toString()
}

/**
 * Calculate percentage change
 */
export function calculatePercentChange(oldValue: number, newValue: number): string {
  if (oldValue === 0) return '0.00%'
  const change = ((newValue - oldValue) / oldValue) * 100
  return change.toFixed(2) + '%'
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp * 1000

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

// Calculate price change percentage
export function calculatePriceChange(oldPrice: string, newPrice: string): number {
  const old = Number(oldPrice)
  const current = Number(newPrice)
  if (old === 0) return 0
  return ((current - old) / old) * 100
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}
export function formatSOL(lamports: string | bigint | number, decimals: number = 4): string {
  try {
    const lamportsNum = typeof lamports === 'string' ? BigInt(lamports) : BigInt(lamports)
    const sol = Number(lamportsNum) / 1e9
    return sol.toFixed(decimals)
  } catch (error) {
    console.error('Error formatting SOL:', error)
    return '0.0000'
  }
}