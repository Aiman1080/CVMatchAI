'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const showDemo = searchParams.get('demo') === 'true'
  const router = useRouter()
  const { t } = useLanguage()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    if (res?.ok) { router.push('/dashboard') }
    else { toast({ title: t.auth.loginFailed, description: t.auth.invalidCredentials, variant: 'destructive' }) }
  }

  const fillDemo = (type: 'free' | 'pro' | 'admin') => {
    if (type === 'admin') setForm({ email: 'admin@cvmatch.ai', password: 'admin123' })
    else if (type === 'pro') setForm({ email: 'pro@cvmatch.ai', password: 'pro123' })
    else setForm({ email: 'demo@cvmatch.ai', password: 'recruiter123' })
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors">
        <ArrowLeft size={16} /> {t.auth.backToHome}
      </Link>
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 [&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_label]:text-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.auth.welcomeBack}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.auth.signInTo}</p>
        </div>
        {/* SSO buttons — only show when env vars are configured AND not demo flow */}
        {!showDemo && (process.env.NEXT_PUBLIC_HAS_GOOGLE_SSO === 'true' || process.env.NEXT_PUBLIC_HAS_MICROSOFT_SSO === 'true') && (
          <>
            <div className="flex flex-col gap-2 mb-4">
              {process.env.NEXT_PUBLIC_HAS_GOOGLE_SSO === 'true' && (
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              )}
              {process.env.NEXT_PUBLIC_HAS_MICROSOFT_SSO === 'true' && (
              <button
                onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
              >
                <svg width="18" height="18" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Continue with Microsoft
              </button>
              )}
            </div>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400 uppercase">or</span></div>
            </div>
          </>
        )}
        {showDemo && (
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <button
            onClick={() => fillDemo('free')}
            title="demo@cvmatch.ai / recruiter123"
            className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            {t.auth.demoFree}
            <span className="block text-blue-400 font-normal" style={{ fontSize: '10px' }}>recruiter123</span>
          </button>
          <button
            onClick={() => fillDemo('pro')}
            title="pro@cvmatch.ai / pro123"
            className="flex-1 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
          >
            {t.auth.demoPro}
            <span className="block text-green-400 font-normal" style={{ fontSize: '10px' }}>pro123</span>
          </button>
        </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required className="pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">{t.auth.forgotPassword}</Link>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-bg h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.auth.signIn}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.noAccount} <Link href="/register" className="text-blue-600 font-medium hover:underline">{t.auth.createOneFree}</Link>
        </p>
      </div>
    </div>
  )
}
