'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Briefcase, Upload, Mail, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateVacancyDialog } from './CreateVacancyDialog'

interface Props {
  hasVacancy: boolean
  hasCandidate: boolean
  hasEmail: boolean
  onVacancyCreated: () => void
}

const steps = [
  {
    key: 'vacancy',
    icon: Briefcase,
    title: 'Créez votre première offre',
    description: 'Définissez un poste pour que l\'IA puisse scorer vos candidats.',
    action: 'Créer une offre',
    href: null,
  },
  {
    key: 'candidate',
    icon: Upload,
    title: 'Ajoutez un candidat',
    description: 'Uploadez un CV ou lancez le scan email de démo.',
    action: 'Voir les offres',
    href: '/vacancies',
  },
  {
    key: 'email',
    icon: Mail,
    title: 'Connectez votre boîte mail',
    description: 'Recevez les candidatures automatiquement par email IMAP.',
    action: 'Configurer',
    href: '/email',
  },
]

export function OnboardingChecklist({ hasVacancy, hasCandidate, hasEmail, onVacancyCreated }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const completed = [hasVacancy, hasCandidate, hasEmail].filter(Boolean).length
  const total = steps.length
  const allDone = completed === total

  if (dismissed || allDone) return null

  const handleCreated = () => {
    setShowCreate(false)
    onVacancyCreated()
  }

  return (
    <>
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full">
          <div
            className="h-1 gradient-bg transition-all duration-500"
            style={{ width: `${(completed / total) * 100}%` }}
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Premiers pas</h3>
              <span className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {completed}/{total} complétés
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Suivez ces étapes pour configurer votre pipeline de recrutement.</p>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = i === 0 ? hasVacancy : i === 1 ? hasCandidate : hasEmail
              const Icon = step.icon
              const blocked = i === 1 && !hasVacancy

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${done ? 'bg-white/50 dark:bg-gray-800/50 opacity-60' : blocked ? 'bg-white/30 dark:bg-gray-800/30 opacity-50' : 'bg-white dark:bg-gray-800 shadow-sm'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-blue-50'}`}>
                    {done ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Icon className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{step.title}</p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  {!done && !blocked && (
                    step.href ? (
                      <a href={step.href} className="shrink-0">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                          {step.action} <ChevronRight size={12} />
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" className="gradient-bg shrink-0 gap-1 text-xs h-7" onClick={() => setShowCreate(true)}>
                        {step.action} <ChevronRight size={12} />
                      </Button>
                    )
                  )}
                  {done && <CheckCircle className="shrink-0 w-4 h-4 text-green-500" />}
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
