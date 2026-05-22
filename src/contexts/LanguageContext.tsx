'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, translations } from '@/lib/i18n'

export type DeepStringRecord = { [key: string]: string | string[] | DeepStringRecord | DeepStringRecord[] }

interface LanguageContextType {
  locale: Locale
  t: typeof translations.en
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'fr',
  t: translations.fr as unknown as typeof translations.en,
  setLocale: () => {},
})

export function LanguageProvider({ children, initialLocale = 'fr' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    // Migrate from localStorage-only (old system) to cookie+localStorage (new system).
    // Runs once: if localStorage has a locale the server didn't know about, adopt it
    // and write it to the cookie so the server picks it up on the next request.
    const lsLocale = localStorage.getItem('cvmatch-locale') as Locale
    if (lsLocale && ['en', 'nl', 'fr'].includes(lsLocale) && lsLocale !== initialLocale) {
      setLocaleState(lsLocale)
      document.cookie = `cvmatch-locale=${lsLocale}; path=/; max-age=31536000; SameSite=Lax`
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
