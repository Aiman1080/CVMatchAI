'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, translations } from '@/lib/i18n'

// Use a recursive string-keyed type so all locales are assignment-compatible
export type DeepStringRecord = { [key: string]: string | string[] | DeepStringRecord | DeepStringRecord[] }

interface LanguageContextType {
  locale: Locale
  t: typeof translations.en
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  t: translations.en,
  setLocale: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('cvmatch-locale') as Locale
    if (saved && ['en', 'nl', 'fr'].includes(saved)) setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('cvmatch-locale', l)
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale] as typeof translations.en, setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
