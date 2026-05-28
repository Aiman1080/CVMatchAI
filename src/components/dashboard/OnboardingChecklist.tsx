'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Briefcase, Upload, Mail, X, ChevronRight, Sparkles, Lock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateVacancyDialog } from './CreateVacancyDialog'
import { useLanguage } from '@/contexts/LanguageContext'

const DISMISS_KEY = 'deltamatch-onboarding-dismissed'

interface Props {
  hasVacancy: boolean
  hasCandidate: boolean
  hasEmail: boolean
  onVacancyCreated: () => void
  subscription?: string
}

export function OnboardingChecklist({ hasVacancy, hasCandidate, hasEmail, onVacancyCreated, subscription = 'free' }: Props) {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash
  const [showCreate, setShowCreate] = useState(false)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const { t } = useLanguage()

  const isPro = subscription !== 'free'

  // Hydrate dismiss state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY)
    setDismissed(stored === 'true')
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  const steps = [
    {
      key: 'vacancy',
      icon: Briefcase,
      done: hasVacancy,
      title: t.dashboard.onboarding.step1Title,
      description: t.dashboard.onboarding.step1Desc,
      action: t.dashboard.onboarding.step1Action,
      href: null as string | null,
      blocked: false,
      badge: null as string | null,
    },
    {
      key: 'candidate',
      icon: Upload,
      done: hasCandidate,
      title: t.dashboard.onboarding.step2Title,
      description: t.dashboard.onboarding.step2Desc,
      action: t.dashboard.onboarding.step2Action,
      href: '/vacancies',
      blocked: !hasVacancy,
      badge: null as string | null,
    },
    {
      key: 'analysis',
      icon: BarChart3,
      done: hasCandidate, // analysis happens automatically when a candidate exists
      title: t.dashboard.onboarding.step3Title,
      description: t.dashboard.onboarding.step3Desc,
      action: t.dashboard.onboarding.step3Action,
      href: '/candidates',
      blocked: !hasCandidate,
      badge: null as string | null,
    },
    {
      key: 'email',
      icon: Mail,
      done: hasEmail,
      title: t.dashboard.onboarding.step4Title,
      description: t.dashboard.onboarding.step4Desc,
      action: t.dashboard.onboarding.step4Action,
      href: '/email',
      blocked: false,
      badge: isPro ? null : t.dashboard.onboarding.step4Badge,
    },
  ]

  const completed = steps.filter(s => s.done).length
  const total = steps.length
  const progressPct = Math.round((completed / total) * 100)
  const allDone = completed === total

  if (dismissed || allDone) return null

  const handleCreated = () => {
    setShowCreate(false)
    setJustCompleted('vacancy')
    setTimeout(() => setJustCompleted(null), 1500)
    onVacancyCreated()
  }

  // Determine the "current" (first incomplete, non-blocked) step
  const currentStepIdx = steps.findIndex(s => !s.done && !s.blocked)

  return (
    <>
      <Card className="border-0 shadow-lg relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30">
        {/* Decorative background circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/10 dark:to-purple-800/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 dark:from-indigo-800/10 dark:to-blue-800/10 blur-xl" />

        <CardContent className="p-6 relative z-10">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
            title={t.dashboard.onboarding.dismiss}
          >
            <X size={16} />
          </button>

          {/* Header section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.dashboard.onboarding.welcomeTitle}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.dashboard.onboarding.welcomeSubtitle}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200/70 dark:bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {completed}/{total} {t.dashboard.onboarding.progress}
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const { key, icon: Icon, done, title, description, action, href, blocked, badge } = step
              const isJustCompleted = justCompleted === key
              const isCurrent = i === currentStepIdx
              const isProLocked = key === 'email' && !isPro

              return (
                <div
                  key={key}
                  className={`flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 ${
                    isJustCompleted
                      ? 'bg-green-50 dark:bg-green-950/30 ring-2 ring-green-300 dark:ring-green-700 scale-[1.01]'
                      : done
                      ? 'bg-white/40 dark:bg-gray-800/40'
                      : blocked
                      ? 'bg-white/20 dark:bg-gray-800/20 opacity-50'
                      : isCurrent
                      ? 'bg-white dark:bg-gray-800 shadow-md ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'bg-white/70 dark:bg-gray-800/60 shadow-sm'
                  }`}
                >
                  {/* Step number / icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    isJustCompleted
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : done
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : blocked
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : isCurrent
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40'
                      : 'bg-blue-50 dark:bg-blue-950/30'
                  }`}>
                    {done ? (
                      <CheckCircle className={`w-5 h-5 text-green-600 dark:text-green-400 ${isJustCompleted ? 'animate-bounce' : ''}`} />
                    ) : blocked ? (
                      <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-500 dark:text-blue-400'}`} />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium transition-colors ${
                        done
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : blocked
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {title}
                      </p>
                      {badge && (
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${
                      blocked
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {blocked ? t.dashboard.onboarding.stepLocked : description}
                    </p>
                  </div>

                  {/* Action button */}
                  {done ? (
                    <CheckCircle className="shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  ) : blocked ? null : (
                    isProLocked ? (
                      <a href="/settings" className="shrink-0">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                          {t.dashboard.upgrade.onboardingAction} <ChevronRight size={12} />
                        </Button>
                      </a>
                    ) : href ? (
                      <a href={href} className="shrink-0">
                        <Button size="sm" variant={isCurrent ? 'gradient' : 'outline'} className="gap-1 text-xs h-8">
                          {action} <ChevronRight size={12} />
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" variant="gradient" className="shrink-0 gap-1 text-xs h-8" onClick={() => setShowCreate(true)}>
                        {action} <ChevronRight size={12} />
                      </Button>
                    )
                  )}
                </div>
              )
            })}
          </div>

          {/* Plan badge footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPro ? (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-full font-medium">
                  {t.dashboard.upgrade.planPro}
                </span>
              ) : (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full font-medium">
                  {t.dashboard.upgrade.planFree}
                </span>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {t.dashboard.onboarding.dismiss}
            </button>
          </div>
        </CardContent>
      </Card>

      <CreateVacancyDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </>
  )
}
