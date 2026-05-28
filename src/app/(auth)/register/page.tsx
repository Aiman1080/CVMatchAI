'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, Check, Sparkles } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

// RFC 5322-ish email check — server still validates strictly
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', plan: 'pro' as 'free' | 'pro' })
  const [loading, setLoading] = useState(false)

  // Inline validation state for required fields
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const tAuth: any = (t as any).auth
  const nameRequiredMsg = tAuth?.nameRequired || 'Please enter your full name'
  const emailRequiredMsg = tAuth?.emailRequired || 'Please enter your email'
  const invalidEmailMsg = tAuth?.invalidEmail || 'Please enter a valid email address'

  const validate = (f: typeof form): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!f.name.trim()) next.name = nameRequiredMsg
    if (!f.email.trim()) next.email = emailRequiredMsg
    else if (!EMAIL_REGEX.test(f.email)) next.email = invalidEmailMsg
    if (!f.password) next.password = t.auth.tooShort
    else if (f.password.length < 8) next.password = t.auth.tooShort
    return next
  }

  const setField = (key: keyof typeof form, value: any) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (touched[key]) {
      const all = validate(next)
      setErrors(prev => {
        const n = { ...prev }
        if (all[key]) n[key] = all[key]
        else delete n[key]
        return n
      })
    }
  }

  const markTouched = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const all = validate(form)
    setErrors(prev => {
      const n = { ...prev }
      if (all[key]) n[key] = all[key]
      else delete n[key]
      return n
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true })
    const all = validate(form)
    if (Object.keys(all).length > 0) {
      setErrors(all)
      toast({ title: 'Please fix the highlighted fields', description: 'Some required fields are missing or invalid.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (login?.ok) router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: t.auth.registrationFailed,
        description: error.message || 'Please check your details and try again. If the issue persists, contact support.',
        variant: 'destructive',
      })
    } finally { setLoading(false) }
  }

  return (
    <div className="relative z-10 w-full max-w-lg">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 [&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_label]:text-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{t.auth.startForFree}</h1>
          <p className="text-gray-500 text-sm mt-1 break-words">{t.auth.createYourAccount}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.auth.fullName} <span className="text-red-500">*</span></Label>
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                onBlur={() => markTouched('name')}
                aria-invalid={!!errors.name}
                className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500" role="alert">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t.auth.company}</Label>
              <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.auth.workEmail} <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              onBlur={() => markTouched('email')}
              aria-invalid={!!errors.email}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-500" role="alert">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>{t.auth.password} <span className="text-red-500">*</span></Label>
            <Input
              type="password"
              placeholder={t.auth.minCharacters}
              value={form.password}
              onChange={e => setField('password', e.target.value)}
              onBlur={() => markTouched('password')}
              aria-invalid={!!errors.password}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              minLength={8}
            />
            {errors.password && <p className="text-xs text-red-500" role="alert">{errors.password}</p>}
            {form.password.length > 0 && (() => {
              const hasLength = form.password.length >= 8
              const hasUpper = /[A-Z]/.test(form.password)
              const hasNumber = /[0-9]/.test(form.password)
              const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
              const isStrong = hasLength && hasUpper && hasNumber && hasSymbol
              const isMedium = hasLength && ((hasUpper && hasNumber) || (hasUpper && hasSymbol) || (hasNumber && hasSymbol))
              return (
                <div className="space-y-1 mt-1">
                  <p className={`text-xs ${isStrong ? 'text-green-600' : isMedium ? 'text-amber-500' : 'text-red-500'}`}>
                    {!hasLength ? t.auth.tooShort : isStrong ? t.auth.strong : t.auth.weak}
                  </p>
                  <div className="flex gap-1 text-xs text-gray-400">
                    <span className={hasUpper ? 'text-green-500' : ''}>ABC</span>
                    <span>·</span>
                    <span className={hasNumber ? 'text-green-500' : ''}>123</span>
                    <span>·</span>
                    <span className={hasSymbol ? 'text-green-500' : ''}>!@#</span>
                  </div>
                </div>
              )
            })()}
          </div>
          {/* Plan selector */}
          <div className="space-y-2">
            <Label>Choose your plan</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Free plan card */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, plan: 'free' }))}
                className={`relative rounded-xl border-2 p-4 pr-8 text-left transition-all ${
                  form.plan === 'free'
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {form.plan === 'free' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-sm break-words">Free</p>
                <p className="text-lg font-bold text-gray-900 mt-1 break-words">&euro;0</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li className="break-words">3 vacancies</li>
                  <li className="break-words">20 candidates/month</li>
                  <li className="break-words">AI scoring</li>
                </ul>
              </button>
              {/* Pro plan card */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, plan: 'pro' }))}
                className={`relative rounded-xl border-2 p-4 pr-8 text-left transition-all ${
                  form.plan === 'pro'
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {form.plan === 'pro' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-1 break-words max-w-full">
                  <Sparkles className="w-3 h-3 shrink-0" /> First month free
                </span>
                <p className="font-semibold text-gray-900 text-sm break-words">Pro</p>
                <p className="text-lg font-bold text-gray-900 mt-1 break-words">&euro;55<span className="text-xs font-normal text-gray-500">/month</span></p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li className="break-words">Unlimited vacancies</li>
                  <li className="break-words">All AI features</li>
                  <li className="break-words">14 ATS integrations</li>
                  <li className="break-words">Email scan</li>
                </ul>
                {form.plan === 'pro' && (
                  <p className="mt-2 text-xs font-medium text-green-600 break-words">30 days free trial</p>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 break-words">{t.auth.gdprDisclaimer}</p>
          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" required className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
            <label htmlFor="terms" className="text-xs text-gray-500 break-words min-w-0">
              I agree to the{' '}
              <Link href="/terms" className="text-blue-600 underline hover:text-blue-700">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</Link>
            </label>
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-bg h-auto py-2.5 whitespace-normal text-center leading-tight">
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : form.plan === 'pro' ? 'Start Pro — 30 days free' : t.auth.createFreeAccount}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6 break-words">
          {t.auth.alreadyHaveAccount} <Link href="/login" className="text-blue-600 font-medium hover:underline">{t.auth.signIn}</Link>
        </p>
      </div>
    </div>
  )
}
