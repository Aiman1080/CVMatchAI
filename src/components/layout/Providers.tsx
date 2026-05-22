'use client'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { SessionTracker } from './SessionTracker'
import type { Locale } from '@/lib/i18n'

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        <LanguageProvider initialLocale={initialLocale}>
          <SessionTracker />
          {children}
        </LanguageProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
