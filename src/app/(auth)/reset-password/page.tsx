'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { t } = useLanguage()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Password strength helpers — match the server-side requirements (min 8, uppercase, number, symbol)
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const isStrong = hasLength && hasUpper && hasNumber && hasSymbol
  const isMedium = hasLength && ((hasUpper && hasNumber) || (hasUpper && hasSymbol) || (hasNumber && hasSymbol))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      toast({ title: t.auth.passwordsDoNotMatch, variant: 'destructive' })
      return
    }

    if (!isStrong) {
      toast({ title: t.auth.passwordTooShort, variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: t.auth.resetFailed, description: data.error || t.auth.somethingWentWrong, variant: 'destructive' })
        setLoading(false)
        return
      }

      toast({ title: t.auth.passwordResetSuccess, description: t.auth.canNowSignIn })
      router.push('/login')
    } catch {
      toast({ title: t.auth.somethingWentWrong, description: t.auth.tryAgainLater, variant: 'destructive' })
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 [&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_label]:text-gray-700">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.auth.invalidResetLink}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.auth.missingOrInvalid}
            </p>
          </div>
          <div className="text-center">
            <Link href="/forgot-password" className="text-blue-600 text-sm font-medium hover:underline">
              {t.auth.requestNewLink}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.auth.setNewPassword}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.auth.enterNewPassword}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.newPassword}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
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
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t.auth.confirmPassword}</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-bg h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.auth.resetPassword}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.rememberPassword}{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            {t.auth.signIn}
          </Link>
        </p>
      </div>
    </div>
  )
}
