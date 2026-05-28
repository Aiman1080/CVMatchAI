'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const { t } = useLanguage()

  const [status, setStatus] = useState<'loading' | 'success' | 'alreadyVerified' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setStatus('error')
      setErrorMessage(t.auth.invalidVerificationLink)
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || t.auth.verificationFailed)
        if (data.alreadyVerified) setStatus('alreadyVerified')
        else setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || t.auth.verificationError)
      }
    }

    verifyEmail()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email])

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.auth.emailVerification}</h1>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t.auth.verifyingEmail}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.auth.emailVerified}</h2>
            <p className="text-gray-500 text-sm mb-6">
              {t.auth.emailVerifiedDesc}
            </p>
            <Link href="/dashboard">
              <Button className="gradient-bg h-11 px-8">{t.auth.goToDashboard}</Button>
            </Link>
          </div>
        )}

        {status === 'alreadyVerified' && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.auth.alreadyVerified}</h2>
            <p className="text-gray-500 text-sm mb-6">
              {t.auth.alreadyVerifiedDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="h-11 px-6 w-full sm:w-auto">{t.auth.backToLogin}</Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="gradient-bg h-11 px-6 w-full sm:w-auto">{t.auth.goToDashboard}</Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.auth.verificationFailed}</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" className="h-11 px-6 w-full sm:w-auto">{t.auth.backToLogin}</Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="gradient-bg h-11 px-6 w-full sm:w-auto">{t.auth.goToDashboard}</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
