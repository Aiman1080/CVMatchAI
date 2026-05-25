import { Header } from '@/components/layout/Header'
import { CheckCircle, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const plans = [
  {
    name: 'Free', icon: Zap, price: '€0', period: 'forever',
    color: 'border-gray-200 dark:border-gray-700',
    iconColor: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    features: ['3 active vacancies', '25 candidates/month', 'AI match scoring', 'CV upload & analysis', 'Basic dashboard'],
    cta: 'Current Plan', disabled: true,
  },
  {
    name: 'Pro', icon: Star, price: '€49', period: '/month',
    color: 'border-blue-500 ring-2 ring-blue-500',
    iconColor: 'gradient-bg text-white',
    features: [
      'Unlimited vacancies', 'Unlimited candidates',
      'AI interview questions', 'AI hiring reports', 'AI candidate ranking',
      'Email inbox scanning', 'ATS integrations (Teamtailor, Recruitee, SmartRecruiters)',
      'Analytics & export (CSV, PDF)', 'Priority support',
    ],
    cta: 'Upgrade to Pro', popular: true, disabled: false,
  },
]

export default function UpgradePage() {
  return (
    <div>
      <Header title="Upgrade Plan" description="Choose the plan that fits your team" />
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unlock the full power of CVMatch AI</h2>
            <p className="text-gray-500 dark:text-gray-400">Scale your recruitment with AI automation, email scanning and unlimited candidates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 ${plan.color} bg-white dark:bg-gray-800`}>
                {(plan as any).popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="gradient-bg text-white text-xs px-3 py-1 rounded-full font-semibold">Most Popular</span></div>}
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
                <Button className={`w-full ${(plan as any).popular ? 'gradient-bg' : ''}`} variant={plan.disabled ? 'outline' : 'default'} disabled={plan.disabled}>{plan.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
