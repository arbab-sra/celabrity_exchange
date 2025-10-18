import './globals.css'
import { SolanaProvider } from '@/components/providers/solanaProvider'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/providers/ThemeProvider'
import LenisProvider from '@/components/SmoothScrollProvider'
export const metadata = {
  title: 'Celebrity Stock Exchange | Trade Tokens on Solana',
  description: 'Trade celebrity tokens on Solana blockchain with real-time market data',
  keywords: ['solana', 'token exchange', 'crypto trading', 'celebrity stocks' ,'arbab exchange' ,'crypto exchange'],
  authors: [{ name: 'Arbab' }],
  openGraph: {
    title: 'Celebrity Stock Exchange',
    description: 'Trade celebrity tokens on Solana blockchain',
    url: 'https://exchange.arbab.fun',
    siteName: 'Celebrity Exchange',
    images: [
      {
        url: 'https://exchange.arbab.fun/og-image.png',
        width: 1200,
        height: 628,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Celebrity Stock Exchange',
    description: 'Trade celebrity tokens on Solana blockchain',
    images: ['https://exchange.arbab.fun/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        <LenisProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <SolanaProvider>
                <Navbar />
                <main className="min-h-screen">{children}</main>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1f2937',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </SolanaProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LenisProvider>
      </body>
    </html>
  )
}
