'use client'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { SessionTracker } from './SessionTracker'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        <LanguageProvider>
          <SessionTracker />
          {children}
        </LanguageProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
