'use client'

import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useLanguage } from '@/contexts/LanguageContext'

// One-click public demo: auto sign-in to the read-only Pro demo account, then land
// on the dashboard. No login form - "the demo IS Pro, without a login step". The
// demo account stays read-only via demo-guard so visitors can't alter it.
export default function DemoPage() {
  const { t } = useLanguage()

  useEffect(() => {
    signIn('credentials', { email: 'pro@cvmatch.ai', password: 'pro123', callbackUrl: '/dashboard' })
  }, [])

  return (
    <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 text-center">
      <Logo size={48} />
      <Loader2 className="w-7 h-7 animate-spin text-white" />
      <p className="text-white/80 text-sm">{t.auth.loadingDemo}</p>
    </div>
  )
}
