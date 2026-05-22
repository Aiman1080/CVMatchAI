import { Header } from '@/components/layout/Header'
import { CheckCircle, Zap, Star, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const plans = [
  { name: 'Free', icon: Zap, price: '€0', period: 'forever', color: 'border-gray-200', iconColor: 'bg-gray-100 text-gray-600', features: ['5 active vacancies', '50 candidates/month', 'AI match scoring', 'Basic dashboard'], cta: 'Current Plan', disabled: true },
  { name: 'Pro', icon: Star, price: '€49', period: '/month', color: 'border-blue-500 ring-2 ring-blue-500', iconColor: 'gradient-bg text-white', features: ['Unlimited vacancies', '500 candidates/month', 'Advanced AI analysis', 'Email inbox scanning', 'Full analytics', 'Priority support'], cta: 'Upgrade to Pro', popular: true, disabled: false },
  { name: 'Enterprise', icon: Building2, price: 'Custom', period: 'pricing', color: 'border-purple-200', iconColor: 'bg-purple-100 text-purple-600', features: ['Unlimited everything', 'Custom AI configuration', 'API & webhooks', 'SSO / SAML', 'Dedicated account manager', 'SLA 99.9%'], cta: 'Contact Sales', disabled: false },
]

export default function UpgradePage() {
  return (
    <div>
      <Header title="Upgrade Plan" description="Choose the plan that fits your team" />
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unlock the full power of CVMatch AI</h2>
            <p className="text-gray-500">Scale your recruitment with AI automation, email scanning and unlimited candidates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-6 ${plan.color} bg-white dark:bg-gray-800`}>
                {(plan as any).popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="gradient-bg text-white text-xs px-3 py-1 rounded-full font-semibold">Most Popular</span></div>}
                <div className={`w-10 h-10 rounded-xl ${plan.iconColor} flex items-center justify-center mb-4`}><plan.icon className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${(plan as any).popular ? 'gradient-bg' : ''}`} variant={plan.disabled ? 'outline' : (plan as any).popular ? 'default' : 'outline'} disabled={plan.disabled}>{plan.cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
