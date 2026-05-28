'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function EmailVerificationBanner() {
  const { t } = useLanguage()
  const v = t.auth.verification
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || v.failedToResend)
      setSent(true)
    } catch (err: any) {
      setError(err.message || v.failedToResend)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 pl-16 md:pl-4 pr-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 max-w-screen-xl mx-auto">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 break-words min-w-0">
            {v.bannerMessage}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {sent ? (
            <span className="flex items-center gap-1 text-sm text-green-700 dark:text-green-400 break-words">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {v.sent}
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline underline-offset-2 disabled:opacity-50 flex items-center gap-1 text-left break-words"
            >
              {resending && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
              {v.resend}
            </button>
          )}
          {error && <span className="text-xs text-red-600 dark:text-red-400 break-words">{error}</span>}
        </div>
      </div>
    </div>
  )
}
