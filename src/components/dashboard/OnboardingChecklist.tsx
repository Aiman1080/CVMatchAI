'use client'

import { useState } from 'react'
import { CheckCircle, Briefcase, Upload, Mail, X, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateVacancyDialog } from './CreateVacancyDialog'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  hasVacancy: boolean
  hasCandidate: boolean
  hasEmail: boolean
  onVacancyCreated: () => void
  subscription?: string
}

export function OnboardingChecklist({ hasVacancy, hasCandidate, hasEmail, onVacancyCreated, subscription = 'free' }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const { t } = useLanguage()

  const isFree = subscription === 'free'

  const baseSteps = [
    { key: 'vacancy', icon: Briefcase, title: t.dashboard.onboarding.step1Title, description: t.dashboard.onboarding.step1Desc, action: t.dashboard.onboarding.step1Action, href: null },
    { key: 'candidate', icon: Upload, title: t.dashboard.onboarding.step2Title, description: t.dashboard.onboarding.step2Desc, action: t.dashboard.onboarding.step2Action, href: '/vacancies' },
    { key: 'email', icon: Mail, title: t.dashboard.onboarding.step3Title, description: t.dashboard.onboarding.step3Desc, action: t.dashboard.onboarding.step3Action, href: '/email' },
  ]

  const upgradeStep = { key: 'upgrade', icon: Zap, title: 'Passez en Pro', description: 'Débloquez l\'analyse IA avancée, les intégrations ATS et plus.', action: 'Mettre à niveau', href: '/settings' }

  const steps = isFree ? [...baseSteps, upgradeStep] : baseSteps

  const doneFlags = [hasVacancy, hasCandidate, hasEmail, false]
  const completed = [hasVacancy, hasCandidate, hasEmail].filter(Boolean).length
  const total = steps.length
  const allDone = isFree ? false : completed === baseSteps.length

  if (dismissed || allDone) return null

  const handleCreated = () => {
    setShowCreate(false)
    setJustCompleted('vacancy')
    setTimeout(() => setJustCompleted(null), 1000)
    onVacancyCreated()
  }

  return (
    <>
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 relative overflow-hidden dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full">
          <div
            className="h-1 gradient-bg transition-all duration-500"
            style={{ width: `${(completed / (isFree ? baseSteps.length : total)) * 100}%` }}
          />
        </div>
        <CardContent className="p-6">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t.dashboard.onboarding.title}</h3>
              <span className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {completed}/{isFree ? baseSteps.length : total} {t.dashboard.onboarding.progress}
              </span>
              {isFree ? (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full font-medium">
                  Plan Gratuit
                </span>
              ) : (
                <span className="text-xs bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-full font-medium">
                  Plan Pro
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.onboarding.subtitle}</p>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = i < 3 ? doneFlags[i] : false
              const isJustCompleted = justCompleted === step.key
              const Icon = step.icon
              const blocked = i === 1 && !hasVacancy
              const isUpgrade = step.key === 'upgrade'

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                    isJustCompleted
                      ? 'bg-green-50 dark:bg-green-950/30 scale-[1.01]'
                      : done
                      ? 'bg-white/50 dark:bg-gray-800/50 opacity-60'
                      : blocked
                      ? 'bg-white/30 dark:bg-gray-800/30 opacity-50'
                      : isUpgrade
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900 shadow-sm'
                      : 'bg-white dark:bg-gray-800 shadow-sm'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : isUpgrade ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-blue-50'}`}>
                    {done ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Icon className={`w-5 h-5 ${isUpgrade ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600'}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : isUpgrade ? 'text-blue-800 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{step.title}</p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  {!done && !blocked && (
                    step.href ? (
                      <a href={step.href} className="shrink-0">
                        <Button size="sm" variant={isUpgrade ? 'default' : 'outline'} className={`gap-1 text-xs h-7 ${isUpgrade ? 'gradient-bg text-white border-0' : ''}`}>
                          {step.action} <ChevronRight size={12} />
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" className="gradient-bg shrink-0 gap-1 text-xs h-7" onClick={() => setShowCreate(true)}>
                        {step.action} <ChevronRight size={12} />
                      </Button>
                    )
                  )}
                  {done && <CheckCircle className={`shrink-0 w-4 h-4 text-green-500 ${isJustCompleted ? 'animate-bounce' : ''}`} />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <CreateVacancyDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </>
  )
}
