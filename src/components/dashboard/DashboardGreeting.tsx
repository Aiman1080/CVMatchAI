'use client'
import { useLanguage } from '@/contexts/LanguageContext'

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const { t } = useLanguage()
  const g = t.dashboard.greeting
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 pl-16 md:pl-8 pr-4 sm:pr-8 py-3 sm:py-4">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
          {g.hello} {firstName || g.defaultName}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{g.subtitle}</p>
      </div>
    </header>
  )
}
