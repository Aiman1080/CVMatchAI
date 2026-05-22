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
    tagline: 'Le plus utilisé en Belgique et Benelux',
    color: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    docsUrl: 'https://app.teamtailor.com/settings/api',
    apiKeyLabel: 'Clé API Teamtailor',
    apiKeyPlaceholder: 'tt-v1-xxxxxxxxxxxxxxxxxxxx',
    needsSlug: false,
    howToGet: [
      'Connectez-vous à Teamtailor',
      'Allez dans Settings (⚙️) → Integrations → API',
      'Cliquez "Generate new API key"',
      'Copiez la clé et collez-la ici',
    ],
    whatItDoes: 'Importe automatiquement tous vos candidats et offres depuis Teamtailor. CVMatch AI télécharge chaque CV et le fait analyser par l\'IA.',
  },
  {
    id: 'recruitee',
    name: 'Recruitee',
    tagline: 'Populaire en Belgique et Pays-Bas',
    color: 'from-blue-500 to-cyan-600',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    docsUrl: 'https://app.recruitee.com/#/settings/apps',
    apiKeyLabel: 'API Token Recruitee',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    needsSlug: true,
    howToGet: [
      'Connectez-vous à Recruitee',
      'Allez dans Settings → API Tokens',
      'Cliquez "New API token", donnez un nom',
      'Copiez le token et votre company slug (l\'URL : app.recruitee.com/c/MON-SLUG)',
    ],
    whatItDoes: 'Synchronise tous vos candidats Recruitee avec leur CV et leur poste. Le "company slug" est le nom de votre société dans l\'URL Recruitee.',
  },
  {
    id: 'smartrecruiters',
    name: 'SmartRecruiters',
    tagline: 'ATS enterprise pour moyennes et grandes entreprises',
    color: 'from-green-500 to-emerald-600',
    textColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    docsUrl: 'https://careers.smartrecruiters.com/',
    apiKeyLabel: 'Smart Token',
    apiKeyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    needsSlug: false,
    howToGet: [
      'Connectez-vous à SmartRecruiters',
      'Allez dans Admin → Apps & Integrations → API',
      'Créez un nouveau token avec les permissions "candidates:read" et "jobs:read"',
      'Copiez le Smart Token et collez-le ici',
    ],
    whatItDoes: 'Importe vos candidats et offres depuis SmartRecruiters. Idéal si vous gérez plusieurs entités ou pays depuis une seule plateforme.',
  },
]

function HowToTooltip({ steps, docsUrl }: { steps: string[]; docsUrl: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
            <HelpCircle size={13} /> Comment obtenir ma clé ?
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
            Ouvrir dans l'ATS <ExternalLink size={9} />
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

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform)
  const connectedCount = integrations.length

  const handleConnect = async (platformId: string) => {
    const f = form[platformId] || { apiKey: '', companySlug: '' }
    if (!f.apiKey.trim()) { toast({ title: 'Clé API requise', variant: 'destructive' }); return }
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
        const p = PLATFORMS.find(p => p.id === platformId)
        toast({ title: `${p?.name} connecté !`, description: data.company ? `Société détectée : ${data.company}` : 'Connexion réussie — vous pouvez synchroniser maintenant.' })
      } else {
        toast({ title: 'Connexion échouée', description: data.error, variant: 'destructive' })
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
        const p = PLATFORMS.find(p => p.id === platformId)
        toast({
          title: `Synchronisation ${p?.name} terminée`,
          description: [
            data.imported ? `${data.imported} nouveau(x) candidat(s) importé(s)` : null,
            data.updated ? `${data.updated} mis à jour` : null,
            data.skipped ? `${data.skipped} déjà présent(s)` : null,
            data.errors?.length ? `${data.errors.length} erreur(s)` : null,
          ].filter(Boolean).join(' · ') || 'Aucun nouveau candidat depuis la dernière synchro.',
        })
      } else {
        toast({ title: 'Erreur de synchronisation', description: data.error, variant: 'destructive' })
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
      title: 'Synchronisation complète',
      description: totalImported > 0
        ? `${totalImported} nouveau(x) candidat(s) importé(s) depuis vos ATS.`
        : 'Tous les candidats sont déjà à jour.',
    })
  }

  const handleDisconnect = async (integrationId: string, platformId: string) => {
    const p = PLATFORMS.find(p => p.id === platformId)
    if (!confirm(`Déconnecter ${p?.name} ?\n\nLes candidats déjà importés resteront dans CVMatch AI.`)) return
    setDeleting(integrationId)
    try {
      const res = await fetch(`/api/integrations/${integrationId}`, { method: 'DELETE' })
      if (res.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== integrationId))
        toast({ title: `${p?.name} déconnecté`, description: 'Vos candidats importés sont conservés.' })
      }
    } finally { setDeleting(null) }
  }

  return (
    <div className="space-y-6">

      {/* Explainer banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Importez vos candidats depuis votre ATS</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
            Connectez Teamtailor, Recruitee ou SmartRecruiters. CVMatch AI importe tous vos candidats et postes,
            télécharge chaque CV et le fait analyser par l'IA — exactement comme si vous les aviez uploadés manuellement.
            Cliquez <strong>Synchroniser</strong> pour récupérer les nouveaux candidats à tout moment.
          </p>
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
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Tout synchroniser</p>
              <InfoTooltip text="Récupère tous les nouveaux candidats depuis chaque ATS connecté en une seule fois. Seuls les nouveaux candidats sont importés — pas de doublons." />
            </div>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              {connectedCount} ATS connecté{connectedCount > 1 ? 's' : ''} · Met à jour tous vos pipelines en un clic
            </p>
          </div>
          <Button
            onClick={handleSyncAll}
            disabled={syncAll || !!syncing}
            size="sm"
            className="gradient-bg shrink-0 gap-1.5"
          >
            {syncAll
              ? <><Loader2 size={13} className="animate-spin" /> Synchronisation…</>
              : <><RefreshCw size={13} /> Synchroniser tout</>}
          </Button>
        </div>
      )}

      {/* How it works cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Link2,
            title: 'Connecter l\'ATS',
            desc: 'Entrez votre clé API. CVMatch AI teste la connexion immédiatement pour vérifier qu\'elle fonctionne.',
          },
          {
            icon: Users,
            title: 'Import automatique',
            desc: 'CVMatch AI récupère vos candidats et leurs CVs. L\'IA analyse chaque dossier et génère un score de correspondance.',
          },
          {
            icon: Briefcase,
            title: 'Postes synchronisés',
            desc: 'Vos offres d\'emploi ATS sont créées dans CVMatch AI. Chaque candidat est rattaché au bon poste automatiquement.',
          },
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
              <Plug className="w-4 h-4 text-blue-500" /> Plateformes ATS
            </CardTitle>
            {connectedCount > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full font-medium">
                {connectedCount} connecté{connectedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {PLATFORMS.map(platform => {
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
                                <CheckCircle size={11} /> Connecté
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Connexion active — votre clé API est valide et fonctionne.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-gray-400">Non connecté</span>
                      )}
                      {connected?.status === 'error' && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-xs text-red-500 font-medium cursor-default">
                                <XCircle size={11} /> Erreur
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              La dernière synchronisation a échoué. Vérifiez votre clé API ou reconnectez.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{platform.tagline}</p>
                    {connected && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {connected.lastSyncAt
                          ? `Dernière synchro : ${formatRelativeTime(new Date(connected.lastSyncAt))} · ${connected.syncCount} candidat(s) importé(s) au total`
                          : 'Jamais synchronisé — cliquez "Synchroniser" pour importer vos candidats'}
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
                                  ? <><Loader2 size={12} className="animate-spin" /> En cours…</>
                                  : <><RefreshCw size={12} /> Synchroniser</>}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Importe les nouveaux candidats depuis {platform.name} depuis la dernière synchronisation.
                              Les candidats déjà présents ne sont pas dupliqués.
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
                              Déconnecter {platform.name}. Vos candidats importés ne seront pas supprimés.
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
                        Connecter
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connection form */}
                {!connected && isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-800 space-y-3 mt-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 pt-3">{platform.whatItDoes}</p>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs text-gray-500">{platform.apiKeyLabel}</Label>
                        <HowToTooltip steps={platform.howToGet} docsUrl={platform.docsUrl} />
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
                          <Label className="text-xs text-gray-500">Company Slug</Label>
                          <InfoTooltip text="Le slug est le nom de votre société dans l'URL Recruitee. Exemple : si votre URL est app.recruitee.com/c/acme-corp, le slug est 'acme-corp'." />
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
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Votre clé API est chiffrée et stockée de façon sécurisée. CVMatch AI ne lit que les candidats — aucune modification ne sera faite dans votre ATS.
                      </p>
                    </div>

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
                        {connecting === platform.id
                          ? <><Loader2 size={12} className="animate-spin" /> Test en cours…</>
                          : <><CheckCircle size={12} /> Connecter et tester</>}
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
      <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
        Vous n'avez pas d'ATS ? Utilisez l'onglet <strong>Email</strong> pour scanner vos candidatures reçues par email,
        ou uploadez les CVs directement depuis la page <strong>Candidats</strong>.
      </p>
    </div>
  )
}
