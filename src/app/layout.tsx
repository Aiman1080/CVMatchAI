import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import { Providers } from '@/components/layout/Providers'
import { Toaster } from '@/components/ui/toaster'
import type { Locale } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'CVMatch AI — Intelligent Recruitment Platform',
    template: '%s | CVMatch AI',
  },
  description: 'AI-powered recruitment automation. Match CVs to vacancies, rank candidates, generate interview questions, and hire faster with artificial intelligence.',
  keywords: 'recruitment, AI, CV matching, ATS, hiring, HR software, interview questions, candidate ranking, hiring report',
  metadataBase: new URL(process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://cvmatch.ai'),
  openGraph: {
    title: 'CVMatch AI — Smarter Hiring. Better Matches.',
    description: 'AI-powered recruitment platform: CV analysis, candidate ranking, interview questions, and hiring reports. Save 80% of screening time.',
    siteName: 'CVMatch AI',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CVMatch AI — Smarter Hiring. Better Matches.',
    description: 'AI-powered recruitment platform: CV analysis, candidate ranking, interview questions, and hiring reports.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
