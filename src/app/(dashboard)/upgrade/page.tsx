'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { CheckCircle, Zap, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'

export default function UpgradePage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const subscription = (session?.user as any)?.subscription || 'free'
  const isPro = subscription === 'pro' || subscription === 'demo_pro'

  const stripeAvailable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== undefined

  const stripe = (t as any).stripe || {} as any

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false)
    }
  }

  const plans = [
    {
      name: t.upgrade.freePlan, icon: Zap, price: t.upgrade.freePrice, period: t.upgrade.freePeriod,
      color: 'border-gray-200 dark:border-gray-700',
      iconColor: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
      features: t.upgrade.freeFeatures,
      cta: t.upgrade.currentPlan, disabled: true, isPro: false,
    },
    {
      name: t.upgrade.proPlan, icon: Star, price: t.upgrade.proPrice, period: t.upgrade.proPeriod,
      color: 'border-blue-500 ring-2 ring-blue-500',
      iconColor: 'gradient-bg text-white',
      features: t.upgrade.proFeatures,
      cta: isPro ? (stripe.currentPlan || 'Current Plan') : t.upgrade.upgradeToPro,
      popular: true, disabled: isPro, isPro: true,
    },
  ]

  return (
    <div>
      <Header title={t.upgrade.title} description={t.upgrade.description} />
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.upgrade.unlockTitle}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.upgrade.unlockDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 ${plan.color} bg-white dark:bg-gray-800`}>
                {(plan as any).popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <span className="gradient-bg text-white text-xs px-3 py-1 rounded-full font-semibold">{t.upgrade.mostPopular}</span>
                    {!isPro && (
                      <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        {stripe.firstMonthFree || 'First month free'}
                      </span>
                    )}
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl ${plan.iconColor} flex items-center justify-center mb-4`}><plan.icon className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {plan.isPro && !isPro ? (
                  <Button
                    className="w-full gradient-bg"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? (stripe.redirecting || 'Redirecting...') : plan.cta}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${(plan as any).popular ? 'gradient-bg' : ''}`}
                    variant={plan.disabled ? 'outline' : 'default'}
                    disabled={plan.disabled}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isPro && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {portalLoading
                  ? (stripe.redirecting || 'Redirecting...')
                  : (stripe.manageSubscription || 'Manage subscription')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
