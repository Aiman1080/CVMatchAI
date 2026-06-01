'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Database, CreditCard, Users, UserCheck, Briefcase,
  Link2, Inbox, MessageSquare, Network, GitBranch, Brain,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { UpstashUsage, SentryUsage } from '@/lib/service-usage'

interface Props {
  counts: { users: number; vacancies: number; candidates: number; openTickets: number }
  hasAiKey: boolean
  hasSmtp: boolean
  hasSentry: boolean
  hasUpstash: boolean
  hasStripe: boolean
  hasGa: boolean
  integrationsByPlatform: Array<{ platform: string; _count: number }>
  integrationsCount: number
  emailInboxesCount: number
  activeVacanciesCount: number
  openCount: number
  latestVacancies: Array<{ title: string; createdAt: Date; _count: { candidates: number } }>
  aiUsageStats?: {
    totalCalls: number
    totalTokens: number
    totalInputTokens: number
    totalOutputTokens: number
    totalCostUsd: number
    last30d: { calls: number; tokens: number; costUsd: number }
    byOperation: Array<{ operation: string; calls: number; tokens: number; costUsd: number }>
    byMonth?: Array<{ month: string; calls: number; tokens: number; costUsd: number }>
  } | null
  dbStats?: {
    users: number; vacancies: number; candidates: number
    notifications: number; activities: number; emailScans: number; aiLogs: number
    totalRows: number
  }
  ta: any
  upstashUsage: UpstashUsage
  sentryUsage: SentryUsage
}

export function AdminSystemTab({
  counts, hasAiKey, hasSmtp, hasSentry, hasUpstash, hasStripe, hasGa,
  integrationsByPlatform, integrationsCount, emailInboxesCount, activeVacanciesCount,
  openCount, latestVacancies, aiUsageStats, dbStats, ta,
  upstashUsage, sentryUsage,
}: Props) {
  return (
    <>
          {/* ── Scaling roadmap & infrastructure status ── */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" /> {ta.system?.infraTitle || 'Infrastructure & Scaling'}
              </CardTitle>
              <CardDescription>{ta.system?.infraDesc || 'Current setup, capacity, and when to upgrade'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current phase indicator */}
              {(() => {
                const userCount = counts.users
                let phase = 1
                let phaseLabel = ta.system?.phaseStartup || 'Startup'
                let phaseColor = 'green'
                if (userCount > 2000) { phase = 4; phaseLabel = ta.system?.phaseEnterprise || 'Enterprise'; phaseColor = 'red' }
                else if (userCount > 300) { phase = 3; phaseLabel = ta.system?.phaseGrowth || 'Growth'; phaseColor = 'orange' }
                else if (userCount > 50) { phase = 2; phaseLabel = ta.system?.phaseTraction || 'Traction'; phaseColor = 'amber' }
                const phaseBg = { green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300',
                                  amber: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
                                  orange: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300',
                                  red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300' }[phaseColor]
                return (
                  <div className={`p-3 rounded-lg border ${phaseBg}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs uppercase font-semibold opacity-70">{ta.system?.currentPhase || 'Current phase'}</p>
                        <p className="text-lg font-bold">{(ta.system?.phaseLabel || 'Phase {phase} - {name}').replace('{phase}', String(phase)).replace('{name}', phaseLabel)}</p>
                        <p className="text-xs mt-1">{(ta.system?.totalAccounts || '{count} total accounts').replace('{count}', String(userCount))}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p>{ta.system?.monthlyCost || 'Monthly cost'}</p>
                        <p className="text-lg font-bold">
                          {phase === 1 ? '€0' : phase === 2 ? '~€25' : phase === 3 ? '~€45' : '~€150'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Scaling phases roadmap */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{ta.system?.scalingRoadmap || 'Scaling roadmap'}</p>
                <div className="space-y-2">
                  {[
                    {
                      phase: 1, name: ta.system?.phaseStartup || 'Startup', range: ta.system?.range1 || '0-50 users', cost: '€0/mo',
                      stack: ta.system?.stack1 || 'Vercel Free + Supabase Free (60 connections)',
                      reached: counts.users <= 50,
                      current: counts.users <= 50,
                    },
                    {
                      phase: 2, name: ta.system?.phaseTraction || 'Traction', range: ta.system?.range2 || '50-300 users', cost: '~€25/mo',
                      stack: ta.system?.stack2 || 'Vercel Free + Supabase Pro (500 connections, daily backups)',
                      reached: counts.users > 50,
                      current: counts.users > 50 && counts.users <= 300,
                    },
                    {
                      phase: 3, name: ta.system?.phaseGrowth || 'Growth', range: ta.system?.range3 || '300-2000 users', cost: '~€45/mo',
                      stack: ta.system?.stack3 || 'Vercel Pro + Supabase Pro + CDN (Cloudinary free)',
                      reached: counts.users > 300,
                      current: counts.users > 300 && counts.users <= 2000,
                    },
                    {
                      phase: 4, name: ta.system?.phaseEnterprise || 'Enterprise', range: ta.system?.range4 || '2000+ users', cost: '~€150/mo',
                      stack: ta.system?.stack4 || 'AWS RDS / PlanetScale + Upstash Redis + S3',
                      reached: counts.users > 2000,
                      current: counts.users > 2000,
                    },
                  ].map(p => (
                    <div key={p.phase} className={`p-2.5 rounded-lg border text-xs ${p.current ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${p.current ? 'bg-blue-500 text-white' : p.reached ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                            {p.reached && !p.current ? '✓' : p.phase}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{p.name}</span>
                          <span className="text-gray-500">{p.range}</span>
                        </div>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">{p.cost}</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 ml-7">{p.stack}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health checks */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{ta.system?.healthChecks || 'Health checks'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className={hasAiKey ? 'text-green-500' : 'text-red-500'}>{hasAiKey ? '●' : '○'}</span>
                    <span className="text-gray-700 dark:text-gray-300">{ta.system?.geminiApi || 'Gemini AI API'}</span>
                    <span className="ml-auto font-mono text-gray-500">{hasAiKey ? (ta.system?.ok || 'OK') : (ta.system?.notConfigured || 'Not configured')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className={hasSmtp ? 'text-green-500' : 'text-red-500'}>{hasSmtp ? '●' : '○'}</span>
                    <span className="text-gray-700 dark:text-gray-300">{ta.system?.smtpEmail || 'SMTP (Email)'}</span>
                    <span className="ml-auto font-mono text-gray-500">{hasSmtp ? (ta.system?.ok || 'OK') : (ta.system?.notConfigured || 'Not configured')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className="text-green-500">●</span>
                    <span className="text-gray-700 dark:text-gray-300">{ta.system?.database || 'Database'}</span>
                    <span className="ml-auto font-mono text-gray-500">{ta.system?.supabaseConnected || 'Supabase connected'}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className="text-green-500">●</span>
                    <span className="text-gray-700 dark:text-gray-300">{ta.system?.hosting || 'Hosting'}</span>
                    <span className="ml-auto font-mono text-gray-500">Vercel</span>
                  </div>
                </div>
              </div>

              {/* Upgrade triggers */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{ta.system?.whenToUpgrade || 'When to upgrade - watch for these signs'}</p>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>{ta.system?.upgradeSign1Pre || 'Vercel logs show'} <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">max clients reached</code> {ta.system?.upgradeSign1Post || 'errors'} → {ta.system?.upgradeSign1Action || 'upgrade Supabase'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>{ta.system?.upgradeSign2 || 'Supabase Dashboard - DB connections > 70% on average'} → {ta.system?.upgradeSign2Action || 'upgrade Supabase'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>{ta.system?.upgradeSign3 || 'Vercel Analytics P95 response time > 2s'} → {ta.system?.upgradeSign3Action || 'upgrade Vercel'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>{ta.system?.upgradeSign4 || 'Users complain about slowness or HTTP 500 errors'} → {ta.system?.upgradeSign4Action || 'check both'}</span>
                  </li>
                </ul>
              </div>

              {/* External monitoring links */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{ta.system?.monitorLive || 'Monitor live'}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://supabase.com/dashboard/project/rlvxyzudngineksyftqv/reports/database"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 font-medium border border-green-200 dark:border-green-800"
                  >
                    🗄 {ta.system?.supabaseReports || 'Supabase Reports'}
                  </a>
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium border border-blue-200 dark:border-blue-800"
                  >
                    ▲ {ta.system?.vercelDashboard || 'Vercel Dashboard'}
                  </a>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 font-medium border border-purple-200 dark:border-purple-800"
                  >
                    💳 {ta.system?.stripeDashboard || 'Stripe Dashboard'}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── External services & costs ── */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" /> {ta.system?.servicesTitle || 'External services & costs'}
              </CardTitle>
              <CardDescription>{ta.system?.servicesDesc || 'Every account this app depends on, its free-tier limit, and when it starts costing money'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cost summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300">
                  <p className="text-xs uppercase font-semibold opacity-70">{ta.system?.fixedCostToday || 'Fixed cost today'}</p>
                  <p className="text-2xl font-bold">€0 / mo</p>
                  <p className="text-xs mt-1">{ta.system?.fixedCostDesc || 'Everything sits on a free tier. Usage-based services (Gemini, Stripe) only bill on real usage.'}</p>
                </div>
                <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                  <p className="text-xs uppercase font-semibold opacity-70">{ta.system?.nextLikelyCost || 'Next likely cost'}</p>
                  <p className="text-2xl font-bold">~$45 / mo</p>
                  <p className="text-xs mt-1">{ta.system?.nextLikelyCostDesc || 'Vercel Pro ($20, once commercial) + Supabase Pro ($25, when the DB fills up).'}</p>
                </div>
              </div>

              {/* Per-service breakdown */}
              <div className="space-y-2">
                {[
                  {
                    name: 'Vercel', purpose: ta.system?.vercelPurpose || 'Hosting & deploys', active: true,
                    tier: ta.system?.vercelTier || 'Hobby (Free)', limit: ta.system?.vercelLimit || '100 GB bandwidth/mo', paid: ta.system?.vercelPaid || 'Pro $20/mo per member',
                    warn: ta.system?.vercelWarn || 'Hobby is non-commercial use. A paid SaaS technically needs Pro.',
                    url: 'https://vercel.com/account/billing',
                  },
                  {
                    name: 'Supabase', purpose: ta.system?.supabasePurpose || 'Postgres database', active: true,
                    tier: ta.system?.supabaseTier || 'Free', limit: ta.system?.supabaseLimit || '500 MB DB · 5 GB bandwidth', paid: ta.system?.supabasePaid || 'Pro $25/mo',
                    warn: ta.system?.supabaseWarn || 'CVs are stored as binary in Postgres - 500 MB fills fast (~2-4k CVs). Plan to move to Supabase Storage.',
                    url: 'https://supabase.com/dashboard/project/rlvxyzudngineksyftqv/settings/billing',
                  },
                  {
                    name: 'Google Gemini', purpose: ta.system?.geminiPurpose || 'AI analysis & matching', active: hasAiKey,
                    tier: ta.system?.geminiTier || 'Pay-as-you-go', limit: ta.system?.geminiLimit || 'Free tier has rate limits', paid: ta.system?.geminiPaid || '~$0.30 / 1M tokens (2.5 Flash) - see AI Usage tab',
                    warn: '', url: 'https://aistudio.google.com/app/apikey',
                  },
                  {
                    name: 'Sentry', purpose: ta.system?.sentryPurpose || 'Error monitoring', active: hasSentry,
                    tier: ta.system?.sentryTier || 'Developer (Free)', limit: ta.system?.sentryLimit || '5,000 errors/mo · 1 user', paid: ta.system?.sentryPaid || 'Team ~$26/mo',
                    warn: '', url: 'https://sentry.io/settings/billing/',
                  },
                  {
                    name: 'Upstash', purpose: ta.system?.upstashPurpose || 'Rate limiting (Redis)', active: hasUpstash,
                    tier: ta.system?.upstashTier || 'Free', limit: ta.system?.upstashLimit || '10,000 commands/day · 256 MB', paid: ta.system?.upstashPaid || 'Pay-as-you-go beyond - rate limiting barely touches it',
                    warn: '', url: 'https://console.upstash.com/',
                  },
                  {
                    name: 'Stripe', purpose: ta.system?.stripePurpose || 'Payments (Pro plan)', active: hasStripe,
                    tier: ta.system?.stripeTier || 'Pay-per-sale', limit: ta.system?.stripeLimit || 'No monthly fee', paid: ta.system?.stripePaid || '~1.5% + €0.25 per EU card charge',
                    warn: '', url: 'https://dashboard.stripe.com/',
                  },
                  {
                    name: 'SMTP email', purpose: ta.system?.smtpPurpose || 'Sending to candidates', active: hasSmtp,
                    tier: ta.system?.smtpTier || 'Provider-dependent', limit: ta.system?.smtpLimit || 'Varies', paid: ta.system?.smtpPaid || 'Free with Gmail; paid SMTP varies',
                    warn: '', url: '',
                  },
                  {
                    name: 'Google Analytics', purpose: ta.system?.gaPurpose || 'Traffic stats', active: hasGa,
                    tier: ta.system?.gaTier || 'Free', limit: ta.system?.gaLimit || 'Unlimited (standard)', paid: ta.system?.gaPaid || '€0',
                    warn: '', url: 'https://analytics.google.com/',
                  },
                ].map(s => (
                  <div key={s.name} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={s.active ? 'text-green-500' : 'text-gray-400'} title={s.active ? (ta.system?.configured || 'Configured') : (ta.system?.notConfigured || 'Not configured')}>
                          {s.active ? '●' : '○'}
                        </span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{s.name}</span>
                        <span className="text-xs text-gray-500">{s.purpose}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{s.tier}</span>
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium border border-blue-200 dark:border-blue-800">
                            {ta.system?.manage || 'Manage'} →
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-1.5 ml-6 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{ta.system?.free || 'Free:'}</span> {s.limit} · <span className="font-medium">{ta.system?.then || 'Then:'}</span> {s.paid}
                    </div>
                    {s.warn ? (
                      <div className="mt-1 ml-6 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                        <span className="mt-0.5">⚠</span><span>{s.warn}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {ta.system?.servicesFootnote || '● configured (env vars set) · ○ inactive. Prices are indicative (early 2026) - always confirm on each billing page. This panel links out to billing dashboards; it cannot change external plans for you.'}
              </p>
            </CardContent>
          </Card>

          {/* ── Live service usage vs free-tier ceilings ── */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-500" /> {ta.system?.rateLimitTitle || 'Rate limiting & monitoring - usage'}
              </CardTitle>
              <CardDescription>{ta.system?.rateLimitDesc || 'Live readings where available, with the free-tier ceiling and when it starts costing'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Upstash */}
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={upstashUsage.configured ? 'text-green-500' : 'text-gray-400'}>{upstashUsage.configured ? '●' : '○'}</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{ta.system?.upstashRedis || 'Upstash Redis'}</span>
                    <span className="text-xs text-gray-500">{ta.system?.rateLimiting || 'rate limiting'}</span>
                  </div>
                  <a href="https://console.upstash.com/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium border border-blue-200 dark:border-blue-800">{ta.system?.console || 'Console'} →</a>
                </div>
                <div className="mt-1.5 ml-6 text-xs text-gray-600 dark:text-gray-400">
                  {!upstashUsage.configured
                    ? <span>{ta.system?.upstashNotConfigured || 'Not configured - rate limiting runs in-memory (per-instance).'}</span>
                    : upstashUsage.available
                      ? <span><span className="font-semibold text-gray-900 dark:text-white">{upstashUsage.keys?.toLocaleString()}</span> {ta.system?.upstashKeysStored || 'active keys stored.'}</span>
                      : <span>{ta.system?.upstashUnavailable || 'Configured, but the live reading is unavailable right now.'}</span>}
                  <span className="block mt-0.5 text-gray-400">{ta.system?.upstashFreeNote || 'Free: 256 MB · 500K commands/month. The monthly command count (the real ceiling) is on the Upstash console.'}</span>
                </div>
              </div>

              {/* Sentry */}
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={sentryUsage.configured ? 'text-green-500' : 'text-gray-400'}>{sentryUsage.configured ? '●' : '○'}</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{ta.system?.sentry || 'Sentry'}</span>
                    <span className="text-xs text-gray-500">{ta.system?.errorMonitoring || 'error monitoring'}</span>
                  </div>
                  <a href="https://sentry.io/" target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium border border-blue-200 dark:border-blue-800">{ta.system?.dashboard || 'Dashboard'} →</a>
                </div>
                <div className="mt-1.5 ml-6 text-xs text-gray-600 dark:text-gray-400">
                  {!sentryUsage.configured
                    ? <span>{ta.system?.sentryNotConfigured || 'Not configured - set SENTRY_DSN to capture production errors.'}</span>
                    : sentryUsage.available
                      ? (() => {
                          const n = sentryUsage.errors30d || 0
                          const pct = Math.min(100, Math.round((n / 5000) * 100))
                          return (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span><span className="font-semibold text-gray-900 dark:text-white">{n.toLocaleString()}</span> {ta.system?.sentryErrors30d || 'errors / 30 days'}</span>
                                <span className="text-gray-400">{(ta.system?.sentryPctFreeTier || '{pct}% of free tier').replace('{pct}', String(pct))}</span>
                              </div>
                              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.max(2, pct)}%` }} />
                              </div>
                            </div>
                          )
                        })()
                      : <span>{ta.system?.sentryConfiguredNote || 'Configured - live error count is in the Sentry dashboard (set SENTRY_AUTH_TOKEN + SENTRY_ORG to show it here).'}</span>}
                  <span className="block mt-0.5 text-gray-400">{ta.system?.sentryFreeNote || 'Free: 5,000 errors/month · 1 user - Team ~$26/mo beyond.'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" /> {ta.system?.dbTitle || 'Database'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: ta.system?.accounts || 'Accounts', value: counts.users, icon: Users },
                  { label: ta.system?.candidates || 'Candidates', value: counts.candidates, icon: UserCheck },
                  { label: ta.system?.vacancies || 'Vacancies', value: counts.vacancies, icon: Briefcase },
                  { label: ta.system?.activeVacancies || 'Active vacancies', value: activeVacanciesCount, icon: Briefcase },
                  { label: ta.system?.atsIntegrations || 'ATS integrations', value: integrationsCount, icon: Link2 },
                  { label: ta.system?.inboxes || 'Inboxes', value: emailInboxesCount, icon: Inbox },
                  { label: ta.system?.supportTickets || 'Support tickets', value: openCount, icon: MessageSquare },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <item.icon className="w-3 h-3" /> {item.label}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Network className="w-4 h-4 text-orange-500" /> {ta.system?.atsTitle || 'ATS Integrations'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['teamtailor', 'recruitee', 'smartrecruiters'].map(platform => {
                  const found = integrationsByPlatform.find(p => p.platform === platform)
                  const count = found?._count || 0
                  return (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{platform}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{(ta.system?.connections || '{count} connection(s)').replace('{count}', String(count))}</span>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{ta.system?.total || 'Total'}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{integrationsCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-teal-500" /> {ta.system?.techStackTitle || 'Tech Stack'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: ta.system?.tsFramework || 'Framework', value: 'Next.js 15 App Router' },
                  { label: ta.system?.tsDatabase || 'Database', value: 'PostgreSQL (Neon)' },
                  { label: ta.system?.tsOrm || 'ORM', value: 'Prisma 5.22' },
                  { label: ta.system?.tsAuth || 'Auth', value: 'NextAuth.js v4 JWT' },
                  { label: ta.system?.tsAi || 'AI', value: 'Google Gemini SDK (gemini-2.5-flash)' },
                  { label: ta.system?.tsEmail || 'Email', value: 'ImapFlow (IMAP/IMAPS)' },
                  { label: ta.system?.tsParser || 'Parser', value: 'pdf-parse + mammoth' },
                  { label: ta.system?.tsUi || 'UI', value: 'Tailwind CSS + shadcn/ui' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Usage Stats */}
          {aiUsageStats && (
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" /> {ta.system?.aiUsageTitle || 'Gemini AI Usage & Cost'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-violet-600">{aiUsageStats.totalCalls}</div>
                    <div className="text-xs text-gray-500">{ta.system?.totalApiCalls || 'Total API Calls'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{(aiUsageStats.totalTokens / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-gray-500">{ta.system?.totalTokens || 'Total Tokens'}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">${aiUsageStats.totalCostUsd.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">{ta.system?.totalCostUsd || 'Total Cost (USD)'}</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">${aiUsageStats.last30d.costUsd.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">{ta.system?.last30Days || 'Last 30 Days'}</div>
                  </div>
                </div>
                {aiUsageStats.byOperation.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">{ta.system?.byOperation || 'By Operation'}</p>
                    {aiUsageStats.byOperation.map(op => (
                      <div key={op.operation} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{op.operation.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">{(ta.system?.calls || '{count} calls').replace('{count}', String(op.calls))}</span>
                          <span className="text-gray-400">{(ta.system?.tokens || '{count}k tokens').replace('{count}', (op.tokens / 1000).toFixed(1))}</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">${op.costUsd.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {aiUsageStats.byMonth && aiUsageStats.byMonth.length > 0 && (() => {
                  const months = aiUsageStats.byMonth!
                  const maxCost = Math.max(...months.map(m => m.costUsd), 0.0001)
                  const formatMonth = (ym: string) => {
                    const [y, m] = ym.split('-')
                    const date = new Date(Number(y), Number(m) - 1, 1)
                    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
                  }
                  return (
                    <div className="mt-6 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase">{ta.system?.byMonth || 'By Month (last 12)'}</p>
                      <div className="space-y-1.5">
                        {months.map(m => (
                          <div key={m.month} className="flex items-center gap-3 text-xs">
                            <span className="text-gray-600 dark:text-gray-400 font-mono w-16 shrink-0">{formatMonth(m.month)}</span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                style={{ width: `${Math.max(2, (m.costUsd / maxCost) * 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-400 w-20 text-right shrink-0">{(ta.system?.calls || '{count} calls').replace('{count}', String(m.calls))}</span>
                            <span className="text-gray-400 w-20 text-right shrink-0">{(m.tokens / 1000).toFixed(1)}k</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300 w-20 text-right shrink-0">${m.costUsd.toFixed(4)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Database Stats */}
          {dbStats && (
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" /> {ta.system?.dbUsageTitle || 'Database Usage (Supabase)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-emerald-600">{dbStats.totalRows.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{ta.system?.totalRows || 'Total Rows'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{dbStats.candidates}</div>
                    <div className="text-xs text-gray-500">{ta.system?.candidates || 'Candidates'}</div>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-indigo-600">{dbStats.activities}</div>
                    <div className="text-xs text-gray-500">{ta.system?.activityLogs || 'Activity Logs'}</div>
                  </div>
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-violet-600">{dbStats.aiLogs}</div>
                    <div className="text-xs text-gray-500">{ta.system?.aiLogs || 'AI Logs'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(dbStats).filter(([k]) => k !== 'totalRows').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(ta.system?.rows || '{count} rows').replace('{count}', (value as number).toLocaleString())}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
                  {ta.system?.supabaseFreeNote || 'Supabase Free: 500MB storage / 2GB bandwidth. Upgrade if needed.'}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> {ta.system?.latestJobs || 'Latest Job Postings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {latestVacancies.length === 0 ? (
                <p className="text-xs text-gray-400 px-5 py-4">{ta.noVacancies || 'No vacancies'}</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {latestVacancies.map((v, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{v.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(v.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{v._count.candidates}</span>
                        <p className="text-xs text-gray-400">{ta.system?.candidatesLabel || 'candidates'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
    </>
  )
}
