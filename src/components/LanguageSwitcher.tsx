'use client'

import { Locale } from '@/lib/i18n'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const LOCALES: { id: Locale; label: string }[] = [
  { id: 'nl', label: 'NL' },
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
]

interface LanguageSwitcherProps {
  dark?: boolean
}

// Context-based switcher — reads locale/setLocale from LanguageContext
export function LanguageSwitcher({ dark = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()
  return (
    <div className={cn('flex items-center rounded-lg p-0.5 gap-0.5', dark ? 'bg-white/10' : 'bg-gray-100 border border-gray-200')}>
      {LOCALES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setLocale(id)}
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded-md transition-all',
            locale === id
              ? dark ? 'bg-white text-blue-700' : 'bg-white shadow text-blue-700'
              : dark ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-800',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
