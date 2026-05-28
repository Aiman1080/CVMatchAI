'use client'
import { Lock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  feature: string
  description: string
}

export function UpgradePrompt({ feature, description }: Props) {
  const { t } = useLanguage()
  const tu = t.dashboard.upgrade
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4 sm:p-8">
      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">{description}</p>
      <Link href="/upgrade">
        <Button className="gradient-bg gap-2">
          <Zap size={16} /> {tu.cta}
        </Button>
      </Link>
      <p className="text-xs text-gray-400 mt-3">{tu.trial}</p>
    </div>
  )
}
