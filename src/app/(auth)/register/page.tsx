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

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', plan: 'free' as 'free' | 'pro' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (login?.ok) router.push('/dashboard')
    } catch (error: any) {
      toast({ title: t.auth.registrationFailed, description: error.message, variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="relative z-10 w-full max-w-lg">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 [&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_label]:text-gray-700">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-gray-900">{t.auth.startForFree}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.auth.createYourAccount}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.auth.fullName} <span className="text-red-500">*</span></Label>
              <Input placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t.auth.company}</Label>
              <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.auth.workEmail} <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t.auth.password} <span className="text-red-500">*</span></Label>
            <Input type="password" placeholder={t.auth.minCharacters} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
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
            <div className="grid grid-cols-2 gap-3">
              {/* Free plan card */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, plan: 'free' }))}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  form.plan === 'free'
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {form.plan === 'free' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="font-semibold text-gray-900 text-sm">Free</p>
                <p className="text-lg font-bold text-gray-900 mt-1">&euro;0</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li>3 vacancies</li>
                  <li>25 candidates/month</li>
                  <li>AI scoring</li>
                </ul>
              </button>
              {/* Pro plan card */}
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, plan: 'pro' }))}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  form.plan === 'pro'
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {form.plan === 'pro' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-1">
                  <Sparkles className="w-3 h-3" /> First month free
                </span>
                <p className="font-semibold text-gray-900 text-sm">Pro</p>
                <p className="text-lg font-bold text-gray-900 mt-1">&euro;55<span className="text-xs font-normal text-gray-500">/month</span></p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li>Unlimited vacancies</li>
                  <li>All AI features</li>
                  <li>14 ATS integrations</li>
                  <li>Email scan</li>
                </ul>
                {form.plan === 'pro' && (
                  <p className="mt-2 text-xs font-medium text-green-600">30 days free trial</p>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">{t.auth.gdprDisclaimer}</p>
          <Button type="submit" disabled={loading} className="w-full gradient-bg h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.auth.createFreeAccount}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.alreadyHaveAccount} <Link href="/login" className="text-blue-600 font-medium hover:underline">{t.auth.signIn}</Link>
        </p>
      </div>
    </div>
  )
}
