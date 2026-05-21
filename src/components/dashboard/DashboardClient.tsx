'use client'

import { useState } from 'react'
import { OnboardingChecklist } from './OnboardingChecklist'

interface Props {
  onboarding: { hasVacancy: boolean; hasCandidate: boolean; hasEmail: boolean }
}

export function DashboardClient({ onboarding }: Props) {
  const [hasVacancy, setHasVacancy] = useState(onboarding.hasVacancy)

  if (hasVacancy && onboarding.hasCandidate && onboarding.hasEmail) return null

  return (
    <OnboardingChecklist
      hasVacancy={hasVacancy}
      hasCandidate={onboarding.hasCandidate}
      hasEmail={onboarding.hasEmail}
      onVacancyCreated={() => setHasVacancy(true)}
    />
  )
}
