import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import { Providers } from '@/components/layout/Providers'
import { Toaster } from '@/components/ui/toaster'
import type { Locale } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVMatch AI — Intelligent Recruitment Platform',
  description: 'AI-powered recruitment automation. Match CVs to vacancies, rank candidates, and hire faster with artificial intelligence.',
  keywords: 'recruitment, AI, CV matching, ATS, hiring, HR software',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('cvmatch-locale')?.value
  const initialLocale: Locale = (['en', 'nl', 'fr'].includes(localeCookie as string) ? localeCookie : 'fr') as Locale

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialLocale={initialLocale}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
