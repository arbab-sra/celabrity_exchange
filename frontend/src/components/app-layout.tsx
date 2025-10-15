'use client'

import { ThemeProvider } from '@/providers/ThemeProvider'
import { Toaster } from './ui/sonner'
import { AppHeader } from '@/components/app-header'
import React from 'react'
import { ClusterChecker } from '@/components/cluster/cluster-ui'
import { AccountChecker } from '@/components/account/account-ui'

export function AppLayout({
  children,
  links,
}: {
  children: React.ReactNode
  links: { label: string; path: string }[]
}) {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        <AppHeader links={links} />
        <main className="flex-grow border w-full h-full mx-auto p-4">
          <ClusterChecker>
            <AccountChecker />
          </ClusterChecker>
          {children}
        </main>
       
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
