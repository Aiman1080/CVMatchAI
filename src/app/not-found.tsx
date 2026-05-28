'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 sm:px-6">
      <div className="text-center max-w-md w-full">
        <div className="mx-auto mb-6 w-fit"><Logo size={56} /></div>
        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-2">{t.errors.notFoundCode}</h1>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.errors.pageNotFound}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t.errors.pageNotFoundDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="w-full sm:w-auto"><Button variant="outline" className="w-full sm:w-auto">{t.errors.home}</Button></Link>
          <Link href="/dashboard" className="w-full sm:w-auto"><Button className="gradient-bg w-full sm:w-auto">{t.errors.dashboard}</Button></Link>
        </div>
      </div>
    </div>
  )
}
