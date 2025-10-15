import './globals.css'
import { SolanaProvider } from '@/components/providers/solanaProvider'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/providers/ThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
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
      </body>
    </html>
  )
}
