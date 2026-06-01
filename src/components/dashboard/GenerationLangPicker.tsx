'use client'

import { Languages } from 'lucide-react'

// Compact language selector shown next to AI "generate" actions so the recruiter
// can choose the OUTPUT language of generated text (questions, emails, reports)
// independently of the UI language or the candidate's CV language.
const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'nl', label: 'NL' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
]

export function GenerationLangPicker({ value, onChange, className = '' }: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Languages className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {LANGS.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => onChange(l.code)}
            aria-pressed={value === l.code}
            className={`px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              value === l.code
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}
