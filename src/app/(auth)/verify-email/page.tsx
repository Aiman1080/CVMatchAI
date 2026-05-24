'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setStatus('error')
      setErrorMessage('Invalid verification link. Missing token or email.')
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
        if (!res.ok) throw new Error(data.error || 'Verification failed')
        setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || 'Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [token, email])

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8" data-theme="light">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your email address has been successfully verified. You can now access all features.
            </p>
            <Link href="/dashboard">
              <Button className="gradient-bg h-11 px-8">Go to dashboard</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification failed</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/login">
                <Button variant="outline" className="h-11 px-6">Back to login</Button>
              </Link>
              <Link href="/dashboard">
                <Button className="gradient-bg h-11 px-6">Go to dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
