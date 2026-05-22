'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
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

export function LanguageProvider({ children, initialLocale = 'fr' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('cvmatch-locale', l)
    document.cookie = `cvmatch-locale=${l}; path=/; max-age=31536000; SameSite=Lax`
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale] as typeof translations.en, setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
