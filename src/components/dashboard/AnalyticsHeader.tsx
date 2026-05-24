'use client'

import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'

export function AnalyticsHeader() {
  const { t } = useLanguage()
  const ta = t.dashboard.analytics
  return <Header title={ta.title} description={ta.subtitle} />
}
