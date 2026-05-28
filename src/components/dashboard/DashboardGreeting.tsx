'use client'
import { useLanguage } from '@/contexts/LanguageContext'

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const { t } = useLanguage()
  const g = t.dashboard.greeting
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 pl-16 md:pl-8 pr-8 py-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {g.hello} {firstName || g.defaultName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{g.subtitle}</p>
      </div>
    </header>
  )
}
