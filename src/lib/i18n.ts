// Translation barrel — re-exports the per-locale modules. The actual strings
// live in src/lib/i18n/{en,nl,fr}.ts so each locale stays under ~1500 lines.
// Bundle size is unchanged (all three locales are statically imported) — the
// motivation is editor responsiveness and diff readability, not perf.
import { en } from './i18n/en'
import { nl } from './i18n/nl'
import { fr } from './i18n/fr'

export type Locale = 'en' | 'nl' | 'fr'

export const translations = { en, nl, fr } as const

export type Translations = typeof en
