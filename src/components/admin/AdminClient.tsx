'use client'

import { Fragment, useState } from 'react'
import {
  Users, Briefcase, UserCheck, MessageSquare, Activity,
  Shield, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Trash2, Send, TrendingUp, Database, Mail,
  Brain, Link2, Inbox, BarChart3, KeyRound,
  CalendarDays, UserPlus, Zap, FileText, Bot,
  Building2, Cpu, Network, GitBranch, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle2, Clock, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { formatDate, cn } from '@/lib/utils'

// ── helpers ───────────────────────────────────────────────────────────────────

function subEndColor(end: Date | string | null | undefined): string {
  if (!end) return 'text-gray-400'
  const diff = new Date(end).getTime() - Date.now()
  if (diff < 0) return 'text-red-600 font-semibold'
  if (diff < 7 * 24 * 60 * 60 * 1000) return 'text-amber-600'
  return 'text-green-600'
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400',
  normal: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  name: string | null
  email: string | null
  company: string | null
  role: string
  subscription: string
  subscriptionEnd: Date | null
  suspended: boolean
  createdAt: Date
  _count: { vacancies: number; candidates: number; supportTickets: number }
}

interface Props {
  users: UserRow[]
  tickets: any[]
  subscriptions: Array<{ subscription: string; _count: number }>
  counts: { users: number; vacancies: number; candidates: number; openTickets: number }
  hasAiKey: boolean
  aiAnalysesCount: number
  integrationsCount: number
  emailInboxesCount: number
  candidateStatusDist: Array<{ status: string; _count: number }>
  latestVacancies: Array<{ title: string; createdAt: Date; _count: { candidates: number } }>
  newUsersThisWeek: number
  candidatesThisWeek: number
  candidatesToday: number
  integrationsByPlatform: Array<{ platform: string; _count: number }>
  candidatesBySource: Array<{ source: string; _count: number }>
  activeVacanciesCount: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminClient({
  users: initialUsers, tickets: initialTickets, subscriptions, counts, hasAiKey,
  aiAnalysesCount, integrationsCount, emailInboxesCount, candidateStatusDist,
  latestVacancies, newUsersThisWeek, candidatesThisWeek, candidatesToday,
  integrationsByPlatform, candidatesBySource, activeVacanciesCount,
}: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [tickets, setTickets] = useState(initialTickets)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [subEndEdit, setSubEndEdit] = useState<Record<string, string>>({})
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const mrr = subscriptions.reduce((sum, s) => {
    const prices: Record<string, number> = { free: 0, pro: 49, enterprise: 299 }
    return sum + (prices[s.subscription] || 0) * s._count
  }, 0)

  const openCount = tickets.filter(t => t.status === 'open').length
  const proCount = subscriptions.find(s => s.subscription === 'pro')?._count || 0
  const enterpriseCount = subscriptions.find(s => s.subscription === 'enterprise')?._count || 0

  // ── Actions ───────────────────────────────────────────────────────────────

  const updateUser = async (id: string, data: Record<string, any>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
      toast({ title: 'Compte mis à jour' })
    } else {
      toast({ title: 'Erreur lors de la mise à jour', variant: 'destructive' })
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer ce compte définitivement ? Toutes les données associées seront perdues. Cette action est irréversible.')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ title: 'Compte supprimé définitivement' })
    } else {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' })
    }
  }

  const resetPassword = async (id: string) => {
    setLoading(p => ({ ...p, [id]: true }))
    const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
    setLoading(p => ({ ...p, [id]: false }))
    if (res.ok) {
      const { tempPassword } = await res.json()
      setTempPasswords(p => ({ ...p, [id]: tempPassword }))
      toast({ title: 'Mot de passe temporaire généré' })
    } else {
      toast({ title: 'Erreur lors de la réinitialisation', variant: 'destructive' })
    }
  }

  const saveSubEnd = async (id: string) => {
    await updateUser(id, { subscriptionEnd: subEndEdit[id] || null })
    setSubEndEdit(p => { const n = { ...p }; delete n[id]; return n })
  }

  const updateTicket = async (id: string, data: Record<string, any>) => {
    const res = await fetch(`/api/admin/support/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
      if (data.adminReply) setReplyText(p => ({ ...p, [id]: '' }))
      toast({ title: 'Ticket mis à jour' })
    }
  }

  // ── AI features definition (static) ───────────────────────────────────────

  const aiFeatures = [
    {
      name: 'Analyse & Scoring de CV',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      status: hasAiKey ? 'live' : 'demo',
      model: 'claude-opus-4-7',
      thinking: 'Adaptive thinking activé',
      details: [
        'Extraction des compétences, expériences, diplômes',
        'Score de correspondance 0–100 par rapport à l\'offre',
        'Forces & faiblesses détaillées',
        'Résumé exécutif du candidat',
        'Détection automatique de la langue du CV',
      ],
      stat: `${aiAnalysesCount} analyse${aiAnalysesCount !== 1 ? 's' : ''} effectuée${aiAnalysesCount !== 1 ? 's' : ''}`,
    },
    {
      name: 'Générateur d\'e-mails IA',
      icon: Mail,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      status: hasAiKey ? 'live' : 'demo',
      model: 'claude-opus-4-7',
      thinking: 'Sans thinking (rapidité)',
      details: [
        'Type invitation entretien — ton chaleureux & professionnel',
        'Type refus — formulé avec respect',
        'Type suivi — relance après entretien',
        'Langue auto-détectée depuis le CV du candidat',
        'Personnalisé avec le nom, le poste et l\'entreprise',
      ],
      stat: '3 types d\'e-mails supportés',
    },
    {
      name: 'Scanner e-mail IMAP',
      icon: Inbox,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      status: emailInboxesCount > 0 ? 'live' : 'configured',
      model: 'Détection par règles + IA',
      thinking: 'Heuristiques d\'abord, Claude en fallback',
      details: [
        'Connexion IMAP/IMAPS sécurisée',
        'Détection automatique des CV en pièces jointes',
        'Filtrage anti-spam par analyse du sujet',
        'Extraction du nom du candidat depuis l\'e-mail',
        'Création automatique du profil candidat',
      ],
      stat: `${emailInboxesCount} boîte${emailInboxesCount !== 1 ? 's' : ''} connectée${emailInboxesCount !== 1 ? 's' : ''}`,
    },
    {
      name: 'Intégrations ATS',
      icon: Network,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      status: integrationsCount > 0 ? 'live' : 'available',
      model: 'API REST + synchronisation',
      thinking: 'Sync one-way → CVMatch',
      details: [
        'Teamtailor : import candidats & offres via API',
        'Recruitee : sync candidatures et statuts',
        'SmartRecruiters : import en masse',
        'IA analyse chaque CV importé automatiquement',
        'Déduplication intelligente des candidats',
      ],
      stat: `${integrationsCount} intégration${integrationsCount !== 1 ? 's' : ''} · ${integrationsByPlatform.map(p => `${p._count} ${p.platform}`).join(', ') || '—'}`,
    },
    {
      name: 'Parser de documents',
      icon: GitBranch,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      status: 'live',
      model: 'pdf-parse + mammoth',
      thinking: 'Extraction textuelle pré-IA',
      details: [
        'PDF : extraction via pdf-parse (natif)',
        'DOCX/DOC : extraction via mammoth',
        'TXT/copier-coller : direct',
        'Nettoyage automatique des artefacts de formatage',
        'Envoi du texte brut vers Claude pour analyse',
      ],
      stat: 'PDF, DOCX, TXT supportés',
    },
    {
      name: 'Pipeline & Kanban',
      icon: BarChart3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      status: 'live',
      model: 'Logique applicative (pas d\'IA)',
      thinking: 'Sans IA — gestion manuelle',
      details: [
        'Vue liste et vue Kanban par glisser-déposer',
        'Statuts : Nouveau → En cours → Shortlisté → Embauché / Refusé',
        'Vivier de talents : conserver les meilleurs candidats',
        'Filtres par score, statut, source, langue',
        'Export CSV / PDF de la liste de candidats',
      ],
      stat: `${counts.candidates} candidats dans la plateforme`,
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: 'Comptes', value: counts.users, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Pro', value: proCount, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Enterprise', value: enterpriseCount, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'MRR', value: `€${mrr}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Candidats/j', value: candidatesToday, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
          { label: 'Analyses IA', value: aiAnalysesCount, icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
          { label: 'Inscrits 7j', value: newUsersThisWeek, icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
          { label: 'Tickets ouverts', value: counts.openTickets, icon: MessageSquare, color: counts.openTickets > 0 ? 'text-red-600' : 'text-gray-400', bg: counts.openTickets > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-800' },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm dark:bg-gray-900">
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Health bar ── */}
      <Card className="border-0 shadow-sm dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">État système</span>
            {[
              { label: 'Base de données', ok: true },
              { label: `IA — ${hasAiKey ? 'Live (claude-opus-4-7)' : 'Mode démo'}`, ok: hasAiKey },
              { label: `Email — ${emailInboxesCount} boîte${emailInboxesCount !== 1 ? 's' : ''}`, ok: true },
              { label: `Support — ${openCount} ouvert${openCount !== 1 ? 's' : ''}`, ok: openCount === 0 },
              { label: `ATS — ${integrationsCount} connexion${integrationsCount !== 1 ? 's' : ''}`, ok: true },
              { label: `${activeVacanciesCount} offre${activeVacanciesCount !== 1 ? 's' : ''} active${activeVacanciesCount !== 1 ? 's' : ''}`, ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-amber-400'}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Tabs ── */}
      <Tabs defaultValue="accounts">
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="accounts">Comptes ({users.length})</TabsTrigger>
          <TabsTrigger value="support">
            Support
            {openCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{openCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai">Intelligence Artificielle</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        {/* ══ Comptes tab ══ */}
        <TabsContent value="accounts" className="mt-4">
          <Card className="border-0 shadow-sm dark:bg-gray-900">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Compte</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Inscrit le</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Utilisation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut / Rôle</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {users.map(user => {
                      const isExpanded = expandedUser === user.id
                      const ref = user.id.slice(-6).toUpperCase()
                      return (
                        <Fragment key={user.id}>
                          <tr
                            className={cn('hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer', user.suspended && 'opacity-60')}
                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                  {user.name || '—'}
                                </span>
                                {user.email && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{user.email}</span>
                                )}
                                {user.company && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <Building2 size={10} />{user.company}
                                  </span>
                                )}
                                <span className="font-mono text-xs text-gray-400 dark:text-gray-600">#{ref}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[user.subscription]}`}>
                                {user.subscription}
                              </span>
                              {user.subscriptionEnd && (
                                <div className={`text-xs mt-1 ${subEndColor(user.subscriptionEnd)}`}>
                                  Expire {formatDate(user.subscriptionEnd)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</span>
                            </td>
                            <td className="px-4 py-3.5 hidden xl:table-cell">
                              <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1"><Briefcase size={10} />{user._count.vacancies}</span>
                                <span className="flex items-center gap-1"><UserCheck size={10} />{user._count.candidates}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={10} />{user._count.supportTickets}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-col gap-1">
                                {user.suspended ? (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full w-fit">Suspendu</span>
                                ) : (
                                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full w-fit">Actif</span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                  {user.role === 'admin' ? '★ Admin' : 'Utilisateur'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-400 dark:text-gray-500">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </td>
                          </tr>

                          {/* ── Expanded detail row ── */}
                          {isExpanded && (
                            <tr className="bg-blue-50/40 dark:bg-blue-950/10">
                              <td colSpan={6} className="px-5 py-5" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                                  {/* Col 1: Abonnement */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <CalendarDays size={12} /> Abonnement
                                    </p>
                                    <div className="space-y-2.5">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Plan</label>
                                        <Select value={user.subscription} onValueChange={val => updateUser(user.id, { subscription: val })}>
                                          <SelectTrigger className="h-8 text-xs w-44 dark:bg-gray-800 dark:border-gray-700">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="free">Free — €0/mois</SelectItem>
                                            <SelectItem value="pro">Pro — €49/mois</SelectItem>
                                            <SelectItem value="enterprise">Enterprise — €299/mois</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Expiration</label>
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="date"
                                            value={subEndEdit[user.id] !== undefined ? subEndEdit[user.id] : user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString().split('T')[0] : ''}
                                            onChange={e => setSubEndEdit(p => ({ ...p, [user.id]: e.target.value }))}
                                            className="h-8 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          {subEndEdit[user.id] !== undefined && (
                                            <Button size="sm" className="h-8 text-xs gradient-bg px-3" onClick={() => saveSubEnd(user.id)}>✓</Button>
                                          )}
                                        </div>
                                        {user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date() && (
                                          <p className="text-xs text-red-500 mt-1">⚠ Expiré</p>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400">Inscrit le {formatDate(user.createdAt)}</p>
                                    </div>
                                  </div>

                                  {/* Col 2: Rôle */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <Shield size={12} /> Rôle & Accès
                                    </p>
                                    <div className="space-y-2.5">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Rôle du compte</label>
                                        <Select value={user.role} onValueChange={val => updateUser(user.id, { role: val })}>
                                          <SelectTrigger className="h-8 text-xs w-44 dark:bg-gray-800 dark:border-gray-700">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="user">Utilisateur</SelectItem>
                                            <SelectItem value="admin">Administrateur</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="pt-1">
                                        <label className="text-xs text-gray-500 block mb-1">Statut du compte</label>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className={cn('h-8 text-xs gap-1.5 w-full justify-start',
                                            user.suspended
                                              ? 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400'
                                              : 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                                          )}
                                          onClick={() => updateUser(user.id, { suspended: !user.suspended })}
                                        >
                                          {user.suspended
                                            ? <><CheckCircle size={12} /> Réactiver le compte</>
                                            : <><XCircle size={12} /> Suspendre le compte</>
                                          }
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Col 3: Utilisation */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <BarChart3 size={12} /> Utilisation
                                    </p>
                                    <div className="space-y-2">
                                      {[
                                        { label: 'Offres publiées', value: user._count.vacancies, icon: Briefcase },
                                        { label: 'Candidats créés', value: user._count.candidates, icon: UserCheck },
                                        { label: 'Tickets support', value: user._count.supportTickets, icon: MessageSquare },
                                      ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between text-xs">
                                          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                            <item.icon size={11} /> {item.label}
                                          </span>
                                          <span className="font-semibold text-gray-700 dark:text-gray-300">{item.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Col 4: Actions critiques */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <Cpu size={12} /> Actions admin
                                    </p>
                                    <div className="space-y-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs gap-1.5 w-full justify-start dark:border-gray-700 dark:text-gray-300"
                                        onClick={() => resetPassword(user.id)}
                                        disabled={loading[user.id]}
                                      >
                                        <KeyRound size={12} />
                                        {loading[user.id] ? 'Génération...' : 'Réinitialiser le mot de passe'}
                                      </Button>
                                      {tempPasswords[user.id] && (
                                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">Mot de passe temporaire :</p>
                                          <code className="text-sm font-mono text-amber-900 dark:text-amber-300 select-all break-all">{tempPasswords[user.id]}</code>
                                        </div>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs gap-1.5 w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                        onClick={() => deleteUser(user.id)}
                                      >
                                        <Trash2 size={12} /> Supprimer définitivement
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Support tab ══ */}
        <TabsContent value="support" className="mt-4 space-y-3">
          {tickets.length === 0 ? (
            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun ticket support</p>
              </CardContent>
            </Card>
          ) : tickets.map(ticket => (
            <Card
              key={ticket.id}
              className={cn('border-0 shadow-sm dark:bg-gray-900 transition-all cursor-pointer hover:shadow-md',
                (ticket.status === 'resolved' || ticket.status === 'closed') && 'opacity-70'
              )}
              onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${ticket.priority === 'urgent' ? 'bg-red-500' : ticket.priority === 'high' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{ticket.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                      {ticket.user?.subscription && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLAN_COLORS[ticket.user.subscription] || ''}`}>
                          {ticket.user.subscription}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-2 border-blue-300">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Réponse admin · {ticket.repliedAt ? formatDate(ticket.repliedAt) : ''}</p>
                        <p className="text-xs text-blue-800 dark:text-blue-300">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
                    {expandedTicket === ticket.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>
                {expandedTicket === ticket.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 flex-wrap">
                      {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                        <button key={s} onClick={() => updateTicket(ticket.id, { status: s })}
                          className={cn('text-xs px-2 py-1 rounded border transition-colors capitalize',
                            ticket.status === s ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700' : 'border-gray-200 dark:border-gray-700 text-gray-500'
                          )}>
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <textarea rows={2} placeholder="Répondre…" value={replyText[ticket.id] || ''}
                        onChange={e => setReplyText(p => ({ ...p, [ticket.id]: e.target.value }))}
                        className="flex-1 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button size="sm" onClick={() => updateTicket(ticket.id, { adminReply: replyText[ticket.id], status: 'in_progress' })}
                        disabled={!replyText[ticket.id]?.trim()} className="gradient-bg gap-1.5 self-end">
                        <Send size={13} /> Répondre
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ══ Intelligence Artificielle tab ══ */}
        <TabsContent value="ai" className="mt-4 space-y-6">
          {/* Model overview */}
          <Card className="border-0 shadow-sm dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-500" /> Modèle IA en production
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Modèle', value: 'claude-opus-4-7', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
                  { label: 'Mode de réflexion', value: 'Adaptive thinking', icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                  { label: 'Clé API Anthropic', value: hasAiKey ? '✓ Configurée' : '✗ Manquante', icon: hasAiKey ? CheckCircle2 : AlertCircle, color: hasAiKey ? 'text-green-600' : 'text-red-500', bg: hasAiKey ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30' },
                  { label: 'Mode opérationnel', value: hasAiKey ? 'Live AI' : 'Démo simulée', icon: hasAiKey ? ToggleRight : ToggleLeft, color: hasAiKey ? 'text-green-600' : 'text-amber-600', bg: hasAiKey ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${item.bg}`}>
                    <item.icon className={`w-5 h-5 shrink-0 ${item.color}`} />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                      <div className={`text-sm font-semibold ${item.color} truncate`}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total analyses IA effectuées sur la plateforme</span>
                  <span className="text-2xl font-bold text-violet-600">{aiAnalysesCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aiFeatures.map(feature => (
              <Card key={feature.name} className="border-0 shadow-sm dark:bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${feature.bg}`}>
                        <feature.icon className={`w-3.5 h-3.5 ${feature.color}`} />
                      </div>
                      {feature.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      feature.status === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                      feature.status === 'demo' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    }`}>
                      {feature.status === 'live' ? '● Live' : feature.status === 'demo' ? '● Démo' : feature.status === 'configured' ? '● Configuré' : '○ Disponible'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Cpu size={10} /> <span className="font-medium">Moteur :</span> {feature.model}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Brain size={10} /> <span className="font-medium">Thinking :</span> {feature.thinking}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {feature.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-gray-400" /> {d}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {feature.stat}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ══ Statistiques tab ══ */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> Répartition des abonnements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriptions.map(s => {
                  const total = subscriptions.reduce((acc, x) => acc + x._count, 0)
                  const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
                  const prices: Record<string, number> = { free: 0, pro: 49, enterprise: 299 }
                  return (
                    <div key={s.subscription} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[s.subscription]}`}>{s.subscription}</span>
                        <span className="text-gray-500 dark:text-gray-400">{s._count} comptes · {pct}% · €{prices[s.subscription] * s._count}/mois</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${s.subscription === 'free' ? 'bg-gray-400' : s.subscription === 'pro' ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">MRR estimé</span>
                  <span className="font-bold text-emerald-600 text-lg">€{mrr}/mois</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" /> Pipeline candidats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidateStatusDist.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun candidat</p>
                ) : candidateStatusDist.map(s => {
                  const total = candidateStatusDist.reduce((acc, x) => acc + x._count, 0)
                  const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
                  const barColors: Record<string, string> = {
                    new: 'bg-blue-400', reviewing: 'bg-amber-400',
                    shortlisted: 'bg-purple-400', hired: 'bg-green-500', rejected: 'bg-red-400',
                  }
                  return (
                    <div key={s.status} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-gray-600 dark:text-gray-300">{s.status}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{s._count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className={`${barColors[s.status] || 'bg-gray-400'} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500" /> Sources des candidats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidatesBySource.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucune donnée</p>
                ) : candidatesBySource.map(s => {
                  const total = candidatesBySource.reduce((acc, x) => acc + x._count, 0)
                  const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
                  const srcColors: Record<string, string> = { upload: 'bg-blue-400', email: 'bg-purple-400', ats: 'bg-orange-400', manual: 'bg-gray-400' }
                  return (
                    <div key={s.source} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-gray-600 dark:text-gray-300">{s.source || 'upload'}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{s._count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className={`${srcColors[s.source] || 'bg-gray-400'} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Candidats aujourd\'hui', value: candidatesToday, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                    { label: 'Candidats cette semaine', value: candidatesThisWeek, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                    { label: 'Nouveaux comptes 7j', value: newUsersThisWeek, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                  ].map(item => (
                    <div key={item.label} className={`text-center p-3 rounded-xl ${item.bg}`}>
                      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ Système tab ══ */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" /> Base de données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Comptes', value: counts.users, icon: Users },
                  { label: 'Candidats', value: counts.candidates, icon: UserCheck },
                  { label: 'Offres', value: counts.vacancies, icon: Briefcase },
                  { label: 'Offres actives', value: activeVacanciesCount, icon: Briefcase },
                  { label: 'Intégrations ATS', value: integrationsCount, icon: Link2 },
                  { label: 'Boîtes mail', value: emailInboxesCount, icon: Inbox },
                  { label: 'Tickets support', value: counts.openTickets, icon: MessageSquare },
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

            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Network className="w-4 h-4 text-orange-500" /> Intégrations ATS
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
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{count} connexion{count !== 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{integrationsCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-teal-500" /> Stack technique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Framework', value: 'Next.js 15 App Router' },
                  { label: 'Base de données', value: 'PostgreSQL (Neon)' },
                  { label: 'ORM', value: 'Prisma 5.22' },
                  { label: 'Auth', value: 'NextAuth.js v4 JWT' },
                  { label: 'IA', value: 'Anthropic SDK (claude-opus-4-7)' },
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

          <Card className="border-0 shadow-sm dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Dernières offres publiées
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {latestVacancies.length === 0 ? (
                <p className="text-xs text-gray-400 px-5 py-4">Aucune offre</p>
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
                        <p className="text-xs text-gray-400">candidats</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
