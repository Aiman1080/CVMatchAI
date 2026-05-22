'use client'

import { useState } from 'react'
import {
  Loader2, CheckCircle, XCircle, RefreshCw, Trash2, Link2,
  ExternalLink, AlertCircle, Info, Plug, Users, Briefcase,
  HelpCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Integration {
  id: string
  platform: string
  apiKey: string
  companySlug: string | null
  status: string
  lastSyncAt: string | null
  syncCount: number
}

const PLATFORM_STATIC = [
  {
    id: 'teamtailor' as const,
    name: 'Teamtailor',
    color: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    docsUrl: 'https://app.teamtailor.com/settings/api',
    apiKeyPlaceholder: 'tt-v1-xxxxxxxxxxxxxxxxxxxx',
    needsSlug: false,
  },
  {
    id: 'recruitee' as const,
    name: 'Recruitee',
    color: 'from-blue-500 to-cyan-600',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    docsUrl: 'https://app.recruitee.com/#/settings/apps',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    needsSlug: true,
  },
  {
    id: 'smartrecruiters' as const,
    name: 'SmartRecruiters',
    color: 'from-green-500 to-emerald-600',
    textColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    docsUrl: 'https://careers.smartrecruiters.com/',
    apiKeyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    needsSlug: false,
  },
]

type PlatformId = 'teamtailor' | 'recruitee' | 'smartrecruiters'

function HowToTooltip({ steps, docsUrl, openLabel }: { steps: readonly string[]; docsUrl: string; openLabel: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
            <HelpCircle size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 p-3">
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ol>
          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-blue-300 hover:text-blue-200 underline text-[11px]"
            onClick={e => e.stopPropagation()}>
            {openLabel} <ExternalLink size={9} />
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex text-gray-400 hover:text-blue-500 transition-colors">
            <HelpCircle size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function IntegrationsClient({ initialIntegrations }: { initialIntegrations: Integration[] }) {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, { apiKey: string; companySlug: string }>>({})
  const [syncAll, setSyncAll] = useState(false)

  const { t } = useLanguage()
  const ti = t.dashboard.integrations

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform)
  const connectedCount = integrations.length

  const getPlatformText = (id: PlatformId) => ti.platforms[id]

  const handleConnect = async (platformId: string) => {
    const f = form[platformId] || { apiKey: '', companySlug: '' }
    if (!f.apiKey.trim()) { toast({ title: ti.apiKeyRequired, variant: 'destructive' }); return }
    setConnecting(platformId)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, apiKey: f.apiKey.trim(), companySlug: f.companySlug.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setIntegrations(prev => [...prev.filter(i => i.platform !== platformId), data])
        setForm(prev => ({ ...prev, [platformId]: { apiKey: '', companySlug: '' } }))
        setExpanded(null)
        const p = PLATFORM_STATIC.find(p => p.id === platformId)
        toast({
          title: `${p?.name} ${ti.connected}`,
          description: data.company ? `${ti.companyFound}${data.company}` : ti.connectionSuccess,
        })
      } else {
        toast({ title: ti.connectionFailed, description: data.error, variant: 'destructive' })
      }
    } finally { setConnecting(null) }
  }

  const handleSync = async (integrationId: string, platformId: string) => {
    setSyncing(integrationId)
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setIntegrations(prev => prev.map(i => i.id === integrationId
          ? { ...i, lastSyncAt: new Date().toISOString(), syncCount: i.syncCount + (data.imported || 0), status: 'active' }
          : i))
        const p = PLATFORM_STATIC.find(p => p.id === platformId)
        toast({
          title: `${p?.name} ${ti.syncDone}`,
          description: [
            data.imported ? `${data.imported} ${ti.imported}` : null,
            data.updated ? `${data.updated} ${ti.updated}` : null,
            data.skipped ? `${data.skipped} ${ti.skipped}` : null,
            data.errors?.length ? `${data.errors.length} ${ti.errorsCount}` : null,
          ].filter(Boolean).join(' · ') || ti.noNewCandidates,
        })
      } else {
        toast({ title: ti.syncError, description: data.error, variant: 'destructive' })
      }
    } finally { setSyncing(null) }
  }

  const handleSyncAll = async () => {
    setSyncAll(true)
    let totalImported = 0
    for (const integration of integrations) {
      try {
        const res = await fetch(`/api/integrations/${integration.id}/sync`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          totalImported += data.imported || 0
          setIntegrations(prev => prev.map(i => i.id === integration.id
            ? { ...i, lastSyncAt: new Date().toISOString(), syncCount: i.syncCount + (data.imported || 0), status: 'active' }
            : i))
        }
      } catch { /* continue other platforms */ }
    }
    setSyncAll(false)
    toast({
      title: ti.syncAllDone,
      description: totalImported > 0
        ? `${totalImported} ${ti.syncAllImported}`
        : ti.upToDate,
    })
  }

  const handleDisconnect = async (integrationId: string, platformId: string) => {
    const p = PLATFORM_STATIC.find(p => p.id === platformId)
    if (!confirm(ti.disconnectConfirm.replace('{name}', p?.name ?? ''))) return
    setDeleting(integrationId)
    try {
      const res = await fetch(`/api/integrations/${integrationId}`, { method: 'DELETE' })
      if (res.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== integrationId))
        toast({ title: `${p?.name} ${ti.disconnected}`, description: ti.candidatesKept })
      }
    } finally { setDeleting(null) }
  }

  return (
    <div className="space-y-6">

      {/* Explainer banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{ti.bannerTitle}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">{ti.bannerDesc}</p>
        </div>
      </div>

      {/* Sync All button — only shown when at least 1 is connected */}
      {connectedCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{ti.syncAll}</p>
              <InfoTooltip text={ti.syncAllTooltip} />
            </div>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              {ti.atsConnectedLabel.replace('{count}', String(connectedCount))}
            </p>
          </div>
          <Button
            onClick={handleSyncAll}
            disabled={syncAll || !!syncing}
            size="sm"
            className="gradient-bg shrink-0 gap-1.5"
          >
            {syncAll
              ? <><Loader2 size={13} className="animate-spin" /> {ti.syncing}</>
              : <><RefreshCw size={13} /> {ti.syncAllBtn}</>}
          </Button>
        </div>
      )}

      {/* How it works cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Link2, title: ti.howItWorksConnect, desc: ti.howItWorksConnectDesc },
          { icon: Users, title: ti.howItWorksImport, desc: ti.howItWorksImportDesc },
          { icon: Briefcase, title: ti.howItWorksJobs, desc: ti.howItWorksJobsDesc },
        ].map((item, i) => (
          <Card key={i} className="border-0 shadow-sm dark:bg-gray-900">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center mb-3">
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform cards */}
      <Card className="border-0 shadow-sm dark:bg-gray-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="w-4 h-4 text-blue-500" /> {ti.platformsTitle}
            </CardTitle>
            {connectedCount > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full font-medium">
                {ti.connectedCount.replace('{count}', String(connectedCount))}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {PLATFORM_STATIC.map(platform => {
            const pt = getPlatformText(platform.id)
            const connected = getIntegration(platform.id)
            const isExpanded = expanded === platform.id
            const f = form[platform.id] || { apiKey: '', companySlug: '' }
            const isSyncing = connected && syncing === connected.id

            return (
              <div
                key={platform.id}
                className={`rounded-xl border transition-all ${
                  connected
                    ? `${platform.borderColor} ${platform.bgColor}`
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                {/* Platform row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Logo */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {platform.name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{platform.name}</span>
                      {connected ? (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium cursor-default">
                                <CheckCircle size={11} /> {ti.connectedStatus}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{ti.activeConnection}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-gray-400">{ti.notConnected}</span>
                      )}
                      {connected?.status === 'error' && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-xs text-red-500 font-medium cursor-default">
                                <XCircle size={11} /> {ti.errorStatus}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{ti.errorTooltip}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pt.tagline}</p>
                    {connected && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {connected.lastSyncAt
                          ? ti.syncCountLabel.replace('{time}', formatRelativeTime(new Date(connected.lastSyncAt))).replace('{count}', String(connected.syncCount))
                          : ti.neverSynced}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {connected ? (
                      <>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSync(connected.id, platform.id)}
                                disabled={!!syncing || syncAll}
                                className="gap-1.5 h-8 text-xs"
                              >
                                {isSyncing
                                  ? <><Loader2 size={12} className="animate-spin" /> {ti.inProgressBtn}</>
                                  : <><RefreshCw size={12} /> {ti.syncBtn}</>}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {ti.syncTooltip.replace('{name}', platform.name)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDisconnect(connected.id, platform.id)}
                                disabled={deleting === connected.id}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              >
                                {deleting === connected.id
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <Trash2 size={14} />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {ti.disconnectTooltip.replace('{name}', platform.name)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setExpanded(isExpanded ? null : platform.id)}
                        className="gap-1.5 h-8 text-xs gradient-bg"
                      >
                        <Link2 size={12} />
                        {ti.connectBtn}
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connection form */}
                {!connected && isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-800 space-y-3 mt-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 pt-3">{pt.whatItDoes}</p>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs text-gray-500">{pt.apiKeyLabel}</Label>
                        <HowToTooltip steps={pt.howToGet} docsUrl={platform.docsUrl} openLabel={ti.openInAts} />
                      </div>
                      <Input
                        type="password"
                        placeholder={platform.apiKeyPlaceholder}
                        value={f.apiKey}
                        onChange={e => setForm(prev => ({ ...prev, [platform.id]: { ...f, apiKey: e.target.value } }))}
                        className="text-sm h-9 font-mono"
                      />
                    </div>

                    {platform.needsSlug && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Label className="text-xs text-gray-500">{ti.slugLabel}</Label>
                          <InfoTooltip text={ti.slugTooltip} />
                        </div>
                        <Input
                          placeholder="acme-corp"
                          value={f.companySlug}
                          onChange={e => setForm(prev => ({ ...prev, [platform.id]: { ...f, companySlug: e.target.value } }))}
                          className="text-sm h-9"
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">{ti.securityNote}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setExpanded(null)} className="text-xs h-8">
                        {ti.cancelBtn}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        disabled={connecting === platform.id || !f.apiKey.trim()}
                        className="text-xs h-8 gradient-bg gap-1.5"
                      >
                        {connecting === platform.id
                          ? <><Loader2 size={12} className="animate-spin" /> {ti.testingBtn}</>
                          : <><CheckCircle size={12} /> {ti.connectTestBtn}</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-gray-400 dark:text-gray-600 text-center">{ti.footerNote}</p>
    </div>
  )
}
