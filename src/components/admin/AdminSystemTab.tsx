'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Database, CreditCard, Users, UserCheck, Briefcase,
  Link2, Inbox, MessageSquare, Network, GitBranch, Brain,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

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
}

export function AdminSystemTab({
  counts, hasAiKey, hasSmtp, hasSentry, hasUpstash, hasStripe, hasGa,
  integrationsByPlatform, integrationsCount, emailInboxesCount, activeVacanciesCount,
  openCount, latestVacancies, aiUsageStats, dbStats, ta,
}: Props) {
  return (
    <>
          {/* ── Scaling roadmap & infrastructure status ── */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" /> Infrastructure & Scaling
              </CardTitle>
              <CardDescription>Current setup, capacity, and when to upgrade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current phase indicator */}
              {(() => {
                const userCount = counts.users
                let phase = 1
                let phaseLabel = 'Startup'
                let phaseColor = 'green'
                if (userCount > 2000) { phase = 4; phaseLabel = 'Enterprise'; phaseColor = 'red' }
                else if (userCount > 300) { phase = 3; phaseLabel = 'Growth'; phaseColor = 'orange' }
                else if (userCount > 50) { phase = 2; phaseLabel = 'Traction'; phaseColor = 'amber' }
                const phaseBg = { green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300',
                                  amber: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
                                  orange: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300',
                                  red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300' }[phaseColor]
                return (
                  <div className={`p-3 rounded-lg border ${phaseBg}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs uppercase font-semibold opacity-70">Current phase</p>
                        <p className="text-lg font-bold">Phase {phase} — {phaseLabel}</p>
                        <p className="text-xs mt-1">{userCount} total accounts</p>
                      </div>
                      <div className="text-right text-xs">
                        <p>Monthly cost</p>
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
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Scaling roadmap</p>
                <div className="space-y-2">
                  {[
                    {
                      phase: 1, name: 'Startup', range: '0-50 users', cost: '€0/mo',
                      stack: 'Vercel Free + Supabase Free (60 connections)',
                      reached: counts.users <= 50,
                      current: counts.users <= 50,
                    },
                    {
                      phase: 2, name: 'Traction', range: '50-300 users', cost: '~€25/mo',
                      stack: 'Vercel Free + Supabase Pro (500 connections, daily backups)',
                      reached: counts.users > 50,
                      current: counts.users > 50 && counts.users <= 300,
                    },
                    {
                      phase: 3, name: 'Growth', range: '300-2000 users', cost: '~€45/mo',
                      stack: 'Vercel Pro + Supabase Pro + CDN (Cloudinary free)',
                      reached: counts.users > 300,
                      current: counts.users > 300 && counts.users <= 2000,
                    },
                    {
                      phase: 4, name: 'Enterprise', range: '2000+ users', cost: '~€150/mo',
                      stack: 'AWS RDS / PlanetScale + Upstash Redis + S3',
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
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Health checks</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className={hasAiKey ? 'text-green-500' : 'text-red-500'}>{hasAiKey ? '●' : '○'}</span>
                    <span className="text-gray-700 dark:text-gray-300">Gemini AI API</span>
                    <span className="ml-auto font-mono text-gray-500">{hasAiKey ? 'OK' : 'Not configured'}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className={hasSmtp ? 'text-green-500' : 'text-red-500'}>{hasSmtp ? '●' : '○'}</span>
                    <span className="text-gray-700 dark:text-gray-300">SMTP (Email)</span>
                    <span className="ml-auto font-mono text-gray-500">{hasSmtp ? 'OK' : 'Not configured'}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className="text-green-500">●</span>
                    <span className="text-gray-700 dark:text-gray-300">Database</span>
                    <span className="ml-auto font-mono text-gray-500">Supabase connected</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                    <span className="text-green-500">●</span>
                    <span className="text-gray-700 dark:text-gray-300">Hosting</span>
                    <span className="ml-auto font-mono text-gray-500">Vercel</span>
                  </div>
                </div>
              </div>

              {/* Upgrade triggers */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">When to upgrade — watch for these signs</p>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>Vercel logs show <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">max clients reached</code> errors → upgrade Supabase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>Supabase Dashboard → DB connections {'>'} 70% on average → upgrade Supabase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>Vercel Analytics P95 response time {'>'} 2s → upgrade Vercel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>Users complain about slowness or HTTP 500 errors → check both</span>
                  </li>
                </ul>
              </div>

              {/* External monitoring links */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Monitor live</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://supabase.com/dashboard/project/rlvxyzudngineksyftqv/reports/database"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 font-medium border border-green-200 dark:border-green-800"
                  >
                    🗄 Supabase Reports
                  </a>
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium border border-blue-200 dark:border-blue-800"
                  >
                    ▲ Vercel Dashboard
                  </a>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 font-medium border border-purple-200 dark:border-purple-800"
                  >
                    💳 Stripe Dashboard
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── External services & costs ── */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" /> External services & costs
              </CardTitle>
              <CardDescription>Every account this app depends on, its free-tier limit, and when it starts costing money</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cost summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300">
                  <p className="text-xs uppercase font-semibold opacity-70">Fixed cost today</p>
                  <p className="text-2xl font-bold">€0 / mo</p>
                  <p className="text-xs mt-1">Everything sits on a free tier. Usage-based services (Gemini, Stripe) only bill on real usage.</p>
                </div>
                <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                  <p className="text-xs uppercase font-semibold opacity-70">Next likely cost</p>
                  <p className="text-2xl font-bold">~$45 / mo</p>
                  <p className="text-xs mt-1">Vercel Pro ($20, once commercial) + Supabase Pro ($25, when the DB fills up).</p>
                </div>
              </div>

              {/* Per-service breakdown */}
              <div className="space-y-2">
                {[
                  {
                    name: 'Vercel', purpose: 'Hosting & deploys', active: true,
                    tier: 'Hobby (Free)', limit: '100 GB bandwidth/mo', paid: 'Pro $20/mo per member',
                    warn: 'Hobby is non-commercial use. A paid SaaS technically needs Pro.',
                    url: 'https://vercel.com/account/billing',
                  },
                  {
                    name: 'Supabase', purpose: 'Postgres database', active: true,
                    tier: 'Free', limit: '500 MB DB · 5 GB bandwidth', paid: 'Pro $25/mo',
                    warn: 'CVs are stored as binary in Postgres — 500 MB fills fast (~2-4k CVs). Plan to move to Supabase Storage.',
                    url: 'https://supabase.com/dashboard/project/rlvxyzudngineksyftqv/settings/billing',
                  },
                  {
                    name: 'Google Gemini', purpose: 'AI analysis & matching', active: hasAiKey,
                    tier: 'Pay-as-you-go', limit: 'Free tier has rate limits', paid: '~$0.30 / 1M tokens (2.5 Flash) — see AI Usage tab',
                    warn: '', url: 'https://aistudio.google.com/app/apikey',
                  },
                  {
                    name: 'Sentry', purpose: 'Error monitoring', active: hasSentry,
                    tier: 'Developer (Free)', limit: '5,000 errors/mo · 1 user', paid: 'Team ~$26/mo',
                    warn: '', url: 'https://sentry.io/settings/billing/',
                  },
                  {
                    name: 'Upstash', purpose: 'Rate limiting (Redis)', active: hasUpstash,
                    tier: 'Free', limit: '10,000 commands/day · 256 MB', paid: 'Pay-as-you-go beyond — rate limiting barely touches it',
                    warn: '', url: 'https://console.upstash.com/',
                  },
                  {
                    name: 'Stripe', purpose: 'Payments (Pro plan)', active: hasStripe,
                    tier: 'Pay-per-sale', limit: 'No monthly fee', paid: '~1.5% + €0.25 per EU card charge',
                    warn: '', url: 'https://dashboard.stripe.com/',
                  },
                  {
                    name: 'SMTP email', purpose: 'Sending to candidates', active: hasSmtp,
                    tier: 'Provider-dependent', limit: 'Varies', paid: 'Free with Gmail; paid SMTP varies',
                    warn: '', url: '',
                  },
                  {
                    name: 'Google Analytics', purpose: 'Traffic stats', active: hasGa,
                    tier: 'Free', limit: 'Unlimited (standard)', paid: '€0',
                    warn: '', url: 'https://analytics.google.com/',
                  },
                ].map(s => (
                  <div key={s.name} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={s.active ? 'text-green-500' : 'text-gray-400'} title={s.active ? 'Configured' : 'Not configured'}>
                          {s.active ? '●' : '○'}
                        </span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{s.name}</span>
                        <span className="text-xs text-gray-500">{s.purpose}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{s.tier}</span>
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium border border-blue-200 dark:border-blue-800">
                            Manage →
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-1.5 ml-6 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Free:</span> {s.limit} · <span className="font-medium">Then:</span> {s.paid}
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
                ● configured (env vars set) · ○ inactive. Prices are indicative (early 2026) — always confirm on each billing page. This panel links out to billing dashboards; it cannot change external plans for you.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" /> Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Accounts', value: counts.users, icon: Users },
                  { label: 'Candidates', value: counts.candidates, icon: UserCheck },
                  { label: 'Vacancies', value: counts.vacancies, icon: Briefcase },
                  { label: 'Active vacancies', value: activeVacanciesCount, icon: Briefcase },
                  { label: 'ATS integrations', value: integrationsCount, icon: Link2 },
                  { label: 'Inboxes', value: emailInboxesCount, icon: Inbox },
                  { label: 'Support tickets', value: openCount, icon: MessageSquare },
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
                  <Network className="w-4 h-4 text-orange-500" /> ATS Integrations
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
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{count} connection{count !== 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{integrationsCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-teal-500" /> Tech Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Framework', value: 'Next.js 15 App Router' },
                  { label: 'Database', value: 'PostgreSQL (Neon)' },
                  { label: 'ORM', value: 'Prisma 5.22' },
                  { label: 'Auth', value: 'NextAuth.js v4 JWT' },
                  { label: 'IA', value: 'Google Gemini SDK (gemini-2.5-flash)' },
                  { label: 'Email', value: 'ImapFlow (IMAP/IMAPS)' },
                  { label: 'Parser', value: 'pdf-parse + mammoth' },
                  { label: 'UI', value: 'Tailwind CSS + shadcn/ui' },
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
                  <Brain className="w-4 h-4 text-violet-500" /> Gemini AI Usage & Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-violet-600">{aiUsageStats.totalCalls}</div>
                    <div className="text-xs text-gray-500">Total API Calls</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{(aiUsageStats.totalTokens / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-gray-500">Total Tokens</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">${aiUsageStats.totalCostUsd.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">Total Cost (USD)</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">${aiUsageStats.last30d.costUsd.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">Last 30 Days</div>
                  </div>
                </div>
                {aiUsageStats.byOperation.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">By Operation</p>
                    {aiUsageStats.byOperation.map(op => (
                      <div key={op.operation} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{op.operation.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">{op.calls} calls</span>
                          <span className="text-gray-400">{(op.tokens / 1000).toFixed(1)}k tokens</span>
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
                      <p className="text-xs font-semibold text-gray-500 uppercase">By Month (last 12)</p>
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
                            <span className="text-gray-400 w-20 text-right shrink-0">{m.calls} calls</span>
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
                  <Database className="w-4 h-4 text-emerald-500" /> Database Usage (Supabase)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-emerald-600">{dbStats.totalRows.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Rows</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{dbStats.candidates}</div>
                    <div className="text-xs text-gray-500">Candidates</div>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-indigo-600">{dbStats.activities}</div>
                    <div className="text-xs text-gray-500">Activity Logs</div>
                  </div>
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-center">
                    <div className="text-2xl font-bold text-violet-600">{dbStats.aiLogs}</div>
                    <div className="text-xs text-gray-500">AI Logs</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(dbStats).filter(([k]) => k !== 'totalRows').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(value as number).toLocaleString()} rows</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
                  Supabase Free: 500MB storage / 2GB bandwidth. Upgrade si necessaire.
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Latest Job Postings
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
                        <p className="text-xs text-gray-400">candidates</p>
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
