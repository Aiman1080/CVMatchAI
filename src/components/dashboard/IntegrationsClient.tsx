'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, RefreshCw, Trash2, Link2, ExternalLink, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'

interface Integration {
  id: string
  platform: string
  apiKey: string
  companySlug: string | null
  status: string
  lastSyncAt: string | null
  syncCount: number
}

const PLATFORMS = [
  {
    id: 'teamtailor',
    name: 'Teamtailor',
    description: 'ATS populaire en Belgique et Benelux',
    color: 'from-violet-500 to-purple-600',
    docsUrl: 'https://app.teamtailor.com/settings/api',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'tt-v1-...',
    needsSlug: false,
    hint: 'Teamtailor Settings → API → Générer une clé',
  },
  {
    id: 'recruitee',
    name: 'Recruitee',
    description: 'ATS utilisé en Belgique et Pays-Bas',
    color: 'from-blue-500 to-cyan-600',
    docsUrl: 'https://app.recruitee.com/#/settings/apps',
    apiKeyLabel: 'API Token',
    apiKeyPlaceholder: 'rec_...',
    needsSlug: true,
    hint: 'Recruitee Settings → API Tokens',
  },
  {
    id: 'smartrecruiters',
    name: 'SmartRecruiters',
    description: 'ATS enterprise pour mid-market',
    color: 'from-green-500 to-emerald-600',
    docsUrl: 'https://partner.smartrecruiters.com/',
    apiKeyLabel: 'Smart Token',
    apiKeyPlaceholder: 'smrt_...',
    needsSlug: false,
    hint: 'SmartRecruiters → Apps & Integrations → API',
  },
]

export function IntegrationsClient({ initialIntegrations }: { initialIntegrations: Integration[] }) {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, { apiKey: string; companySlug: string }>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform)

  const handleConnect = async (platform: string) => {
    const f = form[platform] || { apiKey: '', companySlug: '' }
    if (!f.apiKey.trim()) {
      toast({ title: 'Clé API requise', variant: 'destructive' })
      return
    }
    setConnecting(platform)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, apiKey: f.apiKey.trim(), companySlug: f.companySlug.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setIntegrations(prev => {
          const filtered = prev.filter(i => i.platform !== platform)
          return [...filtered, data]
        })
        setForm(prev => ({ ...prev, [platform]: { apiKey: '', companySlug: '' } }))
        setExpanded(null)
        toast({ title: `${PLATFORMS.find(p => p.id === platform)?.name} connecté !`, description: data.company ? `Société : ${data.company}` : undefined })
      } else {
        toast({ title: data.error || 'Connexion échouée', variant: 'destructive' })
      }
    } finally {
      setConnecting(null)
    }
  }

  const handleSync = async (integrationId: string, platform: string) => {
    setSyncing(integrationId)
    try {
      const res = await fetch(`/api/integrations/${integrationId}/sync`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setIntegrations(prev => prev.map(i => i.id === integrationId
          ? { ...i, lastSyncAt: new Date().toISOString(), syncCount: i.syncCount + (data.imported || 0), status: 'active' }
          : i
        ))
        const platformName = PLATFORMS.find(p => p.id === platform)?.name
        toast({
          title: `Synchronisation ${platformName} terminée`,
          description: `${data.imported} importés · ${data.updated} mis à jour · ${data.skipped} ignorés${data.errors?.length ? ` · ${data.errors.length} erreurs` : ''}`,
        })
      } else {
        toast({ title: data.error || 'Erreur de synchronisation', variant: 'destructive' })
      }
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (integrationId: string, platform: string) => {
    if (!confirm(`Déconnecter ${PLATFORMS.find(p => p.id === platform)?.name} ? Les candidats importés ne seront pas supprimés.`)) return
    setDeleting(integrationId)
    try {
      const res = await fetch(`/api/integrations/${integrationId}`, { method: 'DELETE' })
      if (res.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== integrationId))
        toast({ title: 'Intégration déconnectée' })
      }
    } finally {
      setDeleting(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Connecter un ATS</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Importez automatiquement vos candidats et postes depuis votre ATS existant.
          CVMatch AI analyse chaque CV avec l'IA et les ajoute à votre pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PLATFORMS.map(platform => {
          const connected = getIntegration(platform.id)
          const isExpanded = expanded === platform.id
          const f = form[platform.id] || { apiKey: '', companySlug: '' }

          return (
            <Card key={platform.id} className={`border-0 shadow-sm dark:bg-gray-900 ${connected ? 'ring-1 ring-green-200 dark:ring-green-900' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {platform.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{platform.name}</span>
                        {connected ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle size={11} /> Connecté
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Non connecté</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{platform.description}</p>
                      {connected && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {connected.lastSyncAt
                            ? `Dernière synchro : ${formatRelativeTime(new Date(connected.lastSyncAt))} · ${connected.syncCount} candidats importés`
                            : 'Jamais synchronisé'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {connected ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(connected.id, platform.id)}
                          disabled={!!syncing}
                          className="gap-1.5 h-8 text-xs"
                        >
                          {syncing === connected.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <RefreshCw size={12} />}
                          Synchroniser
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDisconnect(connected.id, platform.id)}
                          disabled={deleting === connected.id}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          {deleting === connected.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setExpanded(isExpanded ? null : platform.id)}
                        className="gap-1.5 h-8 text-xs gradient-bg"
                      >
                        <Link2 size={12} /> Connecter
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connection form */}
                {!connected && isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded-lg">
                      <AlertCircle size={12} className="shrink-0" />
                      {platform.hint}
                      <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 underline">
                        Ouvrir <ExternalLink size={10} />
                      </a>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1">{platform.apiKeyLabel}</Label>
                      <Input
                        type="password"
                        placeholder={platform.apiKeyPlaceholder}
                        value={f.apiKey}
                        onChange={e => setForm(prev => ({ ...prev, [platform.id]: { ...f, apiKey: e.target.value } }))}
                        className="text-sm h-8"
                      />
                    </div>

                    {platform.needsSlug && (
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">Company Slug</Label>
                        <Input
                          placeholder="mon-entreprise"
                          value={f.companySlug}
                          onChange={e => setForm(prev => ({ ...prev, [platform.id]: { ...f, companySlug: e.target.value } }))}
                          className="text-sm h-8"
                        />
                        <p className="text-xs text-gray-400 mt-1">Le slug dans votre URL Recruitee : app.recruitee.com/c/<strong>mon-entreprise</strong></p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setExpanded(null)} className="text-xs h-8">
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        disabled={connecting === platform.id || !f.apiKey.trim()}
                        className="text-xs h-8 gradient-bg gap-1.5"
                      >
                        {connecting === platform.id ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                        {connecting === platform.id ? 'Test en cours…' : 'Connecter et tester'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Status error */}
                {connected?.status === 'error' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded-lg">
                    <XCircle size={12} /> Dernière synchronisation échouée — vérifiez votre clé API
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-0 shadow-sm dark:bg-gray-900 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Comment ça marche</h4>
          <ol className="space-y-1.5 text-xs text-blue-600 dark:text-blue-400">
            <li>1. Connectez votre ATS avec votre clé API</li>
            <li>2. CVMatch AI importe vos postes et candidats existants</li>
            <li>3. Chaque CV est analysé automatiquement par l'IA (score, points forts/faibles)</li>
            <li>4. Cliquez "Synchroniser" pour importer les nouveaux candidats à tout moment</li>
          </ol>
          <p className="text-xs text-blue-500 dark:text-blue-500 mt-2">Les candidats déjà présents dans CVMatch AI ne sont pas dupliqués.</p>
        </CardContent>
      </Card>
    </div>
  )
}
