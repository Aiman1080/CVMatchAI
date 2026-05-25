'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage()

  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 w-fit"><Logo size={56} /></div>
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t.errors.somethingWentWrong}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t.errors.unexpectedError}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>{t.errors.tryAgain}</Button>
          <Link href="/dashboard"><Button className="gradient-bg">{t.errors.dashboard}</Button></Link>
        </div>
      </div>
    </div>
  )
}
