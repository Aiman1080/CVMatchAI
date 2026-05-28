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
      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center mb-4 shrink-0">
        <Lock className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 px-2 break-words">{feature}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6 px-2 break-words">{description}</p>
      <Link href="/upgrade" className="w-full max-w-xs">
        <Button className="gradient-bg gap-2 w-full whitespace-normal h-auto py-2.5 px-4 text-xs sm:text-sm">
          <Zap size={16} className="shrink-0" /> <span className="break-words">{tu.cta}</span>
        </Button>
      </Link>
      <p className="text-xs text-gray-400 mt-3 px-2">{tu.trial}</p>
    </div>
  )
}
