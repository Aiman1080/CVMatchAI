'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Info } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useDemoMode } from '@/hooks/useDemoGuard'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const TAB_KEYS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/vacancies': 'vacancies',
  '/candidates': 'candidates',
  '/email': 'email',
  '/integrations': 'integrations',
  '/analytics': 'analytics',
  '/settings': 'settings',
  '/support': 'support',
}

const STORAGE_KEY = 'cvmatch-show-guides'
const DISMISSED_KEY = 'cvmatch-guides-dismissed'

export function TabGuide() {
  const pathname = usePathname()
  const isDemo = useDemoMode()
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [hasAsked, setHasAsked] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const tabKey = TAB_KEYS[pathname] || ''

  const guides = (t as any).tabGuides as Record<string, string> | undefined
  const guideText = guides?.[tabKey] || ''

  const getDismissedTabs = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    if (!tabKey || !guideText) {
      setVisible(false)
      return
    }

    if (isDemo) {
      // Demo: always show on every tab visit
      setVisible(true)
      return
    }

    // Real user logic
    const pref = localStorage.getItem(STORAGE_KEY)
    if (pref === 'no') {
      setVisible(false)
      return
    }
    if (pref === 'yes') {
      // Show if this tab hasn't been dismissed yet
      const dismissed = getDismissedTabs()
      if (dismissed.includes(tabKey)) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      return
    }

    // Not yet asked
    setHasAsked(false)
    setShowPrompt(true)
    setVisible(false)
  }, [tabKey, guideText, isDemo, getDismissedTabs])

  const handleDismiss = () => {
    setVisible(false)
    if (!isDemo) {
      const dismissed = getDismissedTabs()
      if (!dismissed.includes(tabKey)) {
        dismissed.push(tabKey)
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed))
      }
    }
  }

  const handleAcceptGuides = () => {
    localStorage.setItem(STORAGE_KEY, 'yes')
    setShowPrompt(false)
    setHasAsked(true)
    setVisible(true)
  }

  const handleDeclineGuides = () => {
    localStorage.setItem(STORAGE_KEY, 'no')
    setShowPrompt(false)
    setHasAsked(true)
    setVisible(false)
  }

  // Guide prompt for real users on first visit
  if (showPrompt && !isDemo && !hasAsked) {
    const guidePrompt = (t as any).guidePrompt as { title: string; yes: string; no: string } | undefined
    return (
      <div className="mx-4 mt-4 md:mx-8">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200 flex-1">
            {guidePrompt?.title || 'Would you like guided tips?'}
          </p>
          <button
            onClick={handleAcceptGuides}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {guidePrompt?.yes || 'Yes, show me'}
          </button>
          <button
            onClick={handleDeclineGuides}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            {guidePrompt?.no || 'No thanks'}
          </button>
        </div>
      </div>
    )
  }

  if (!visible || !guideText) return null

  return (
    <div className="mx-4 mt-4 md:mx-8">
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl border',
          isDemo
            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
        )}
      >
        <Info className={cn('w-5 h-5 shrink-0 mt-0.5', isDemo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')} />
        <p className={cn('text-sm flex-1', isDemo ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300')}>
          {guideText}
        </p>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
