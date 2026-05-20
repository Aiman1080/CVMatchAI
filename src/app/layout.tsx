import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVMatch AI — Intelligent Recruitment Platform',
  description: 'AI-powered recruitment automation. Match CVs to vacancies, rank candidates, and hire faster with artificial intelligence.',
  keywords: 'recruitment, AI, CV matching, ATS, hiring, HR software',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
