'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'

// Lightweight RFC 5322-ish check — good enough for UX feedback, server validates strictly
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailTouched, setEmailTouched] = useState(false)

  const tAuth: any = (t as any).auth
  const requiredMsg = tAuth?.emailRequired || 'Please enter your email'
  const invalidMsg = tAuth?.invalidEmail || 'Please enter a valid email address'

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return requiredMsg
    if (!EMAIL_REGEX.test(value)) return invalidMsg
    return null
  }

  const onEmailChange = (value: string) => {
    setEmail(value)
    if (emailTouched) setEmailError(validateEmail(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Silently handle — we show the same message regardless
    }
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 [&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_label]:text-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.auth.resetYourPassword}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.auth.enterEmailForReset}
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm">
              {t.auth.resetLinkSent}
            </div>
            <Link href="/login" className="text-blue-600 text-sm font-medium hover:underline">
              {t.auth.backToSignIn}
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => onEmailChange(e.target.value)}
                  onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email)) }}
                  aria-invalid={!!emailError}
                  className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  autoComplete="email"
                />
                {emailError && <p className="text-xs text-red-500" role="alert">{emailError}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-bg h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.auth.sendResetLink}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              {t.auth.rememberPassword}{' '}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                {t.auth.signIn}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
