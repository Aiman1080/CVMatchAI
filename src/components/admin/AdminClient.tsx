'use client'

import { Fragment, useState } from 'react'
import {
  Users, Briefcase, UserCheck, MessageSquare, Activity,
  Shield, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Trash2, Send, TrendingUp, Database, Mail, Building2,
  Brain, Link2, Inbox, BarChart3, KeyRound,
  CalendarDays, UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { formatDate, cn } from '@/lib/utils'

// ── helpers ───────────────────────────────────────────────────────────────────

function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Jamais'
  const diff = Date.now() - new Date(date).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "À l'instant"
  const m = Math.floor(s / 60)
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

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
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminClient({
  users: initialUsers, tickets: initialTickets, subscriptions, counts, hasAiKey,
  aiAnalysesCount, integrationsCount, emailInboxesCount, candidateStatusDist,
  latestVacancies, newUsersThisWeek, candidatesThisWeek,
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
    if (!confirm('Supprimer ce compte ? Cette action est irréversible.')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ title: 'Compte supprimé' })
    }
  }

  const resetPassword = async (id: string) => {
    setLoading(p => ({ ...p, [id]: true }))
    const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
    setLoading(p => ({ ...p, [id]: false }))
    if (res.ok) {
      const { tempPassword } = await res.json()
      setTempPasswords(p => ({ ...p, [id]: tempPassword }))
      toast({ title: 'Mot de passe réinitialisé' })
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Comptes', value: counts.users, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Nouveaux 7j', value: newUsersThisWeek, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
          { label: 'Candidats 7j', value: candidatesThisWeek, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'MRR', value: `€${mrr}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Candidats total', value: counts.candidates, icon: UserCheck, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
          { label: 'Tickets ouverts', value: counts.openTickets, icon: MessageSquare, color: counts.openTickets > 0 ? 'text-red-600' : 'text-gray-400', bg: counts.openTickets > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-800' },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm dark:bg-gray-900">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.bg} shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.label}</div>
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
              { label: `IA — ${hasAiKey ? 'Live' : 'Démo'}`, ok: true },
              { label: 'Email', ok: true },
              { label: `Support — ${openCount} ouvert${openCount !== 1 ? 's' : ''}`, ok: openCount === 0 },
              { label: `${integrationsCount} intégration${integrationsCount !== 1 ? 's' : ''}`, ok: true },
              { label: `${emailInboxesCount} boîte${emailInboxesCount !== 1 ? 's' : ''} mail`, ok: true },
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
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Réf.</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Abonnement</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Inscrit le</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Utilisation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
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
                              <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">#{ref}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[user.subscription]}`}>
                                {user.subscription}
                              </span>
                              {user.subscriptionEnd ? (
                                <div className={`text-xs mt-1 ${subEndColor(user.subscriptionEnd)}`}>
                                  Expire {formatDate(user.subscriptionEnd)}
                                </div>
                              ) : user.subscription !== 'free' ? (
                                <div className="text-xs mt-1 text-gray-400">Pas d'expiration</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</span>
                            </td>
                            <td className="px-4 py-3.5 hidden xl:table-cell">
                              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{user._count.vacancies} offres</span>
                                <span>{user._count.candidates} cand.</span>
                                <span>{user._count.supportTickets} tickets</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {user.suspended ? (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspendu</span>
                              ) : user.role === 'admin' ? (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Admin</span>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Actif</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-gray-400 dark:text-gray-500">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr className="bg-blue-50/40 dark:bg-blue-950/10">
                              <td colSpan={6} className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                  {/* Subscription management */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                      <CalendarDays size={12} /> Abonnement
                                    </p>
                                    <div className="space-y-2">
                                      <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Plan</label>
                                        <Select
                                          value={user.subscription}
                                          onValueChange={val => updateUser(user.id, { subscription: val })}
                                        >
                                          <SelectTrigger className="h-8 text-xs w-40 dark:bg-gray-800 dark:border-gray-700">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="free">Free — €0/mois</SelectItem>
                                            <SelectItem value="pro">Pro — €49/mois</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Date d'expiration</label>
                                        <div className="flex gap-2 items-center flex-wrap">
                                          <input
                                            type="date"
                                            value={
                                              subEndEdit[user.id] !== undefined
                                                ? subEndEdit[user.id]
                                                : user.subscriptionEnd
                                                  ? new Date(user.subscriptionEnd).toISOString().split('T')[0]
                                                  : ''
                                            }
                                            onChange={e => setSubEndEdit(p => ({ ...p, [user.id]: e.target.value }))}
                                            className="h-8 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          {subEndEdit[user.id] !== undefined && (
                                            <Button size="sm" className="h-8 text-xs gradient-bg" onClick={() => saveSubEnd(user.id)}>
                                              Sauver
                                            </Button>
                                          )}
                                        </div>
                                        {user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date() && (
                                          <p className="text-xs text-red-500 mt-1">⚠ Abonnement expiré</p>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        Inscrit le {formatDate(user.createdAt)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Usage */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                      <BarChart3 size={12} /> Utilisation
                                    </p>
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <Briefcase size={13} />
                                        <span>{user._count.vacancies} offres d'emploi</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <UserCheck size={13} />
                                        <span>{user._count.candidates} candidats</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <MessageSquare size={13} />
                                        <span>{user._count.supportTickets} tickets support</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Admin actions */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                      <Shield size={12} /> Actions admin
                                    </p>
                                    <div className="flex flex-col gap-2">
                                      <div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-xs gap-1.5 dark:border-gray-700 dark:text-gray-300"
                                          onClick={() => resetPassword(user.id)}
                                          disabled={loading[user.id]}
                                        >
                                          <KeyRound size={12} />
                                          {loading[user.id] ? 'Génération...' : 'Réinitialiser le mot de passe'}
                                        </Button>
                                        {tempPasswords[user.id] && (
                                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">Mot de passe temporaire (affiché une seule fois) :</p>
                                            <code className="text-sm font-mono text-amber-900 dark:text-amber-300 select-all break-all">{tempPasswords[user.id]}</code>
                                          </div>
                                        )}
                                      </div>
                                      {user.role !== 'admin' && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className={cn('h-8 text-xs gap-1.5',
                                              user.suspended
                                                ? 'border-green-200 text-green-600 hover:bg-green-50'
                                                : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                            )}
                                            onClick={() => updateUser(user.id, { suspended: !user.suspended })}
                                          >
                                            {user.suspended
                                              ? <><CheckCircle size={12} /> Réactiver le compte</>
                                              : <><XCircle size={12} /> Suspendre le compte</>
                                            }
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                            onClick={() => deleteUser(user.id)}
                                          >
                                            <Trash2 size={12} /> Supprimer le compte
                                          </Button>
                                        </>
                                      )}
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
                      <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      {ticket.user?.subscription && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLAN_COLORS[ticket.user.subscription] || ''}`}>
                          {ticket.user.subscription}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-2 border-blue-300">
                        <p className="text-xs font-semibold text-blue-600 mb-1">
                          Réponse admin · {ticket.repliedAt ? formatDate(ticket.repliedAt) : ''}
                        </p>
                        <p className="text-xs text-blue-800 dark:text-blue-300">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
                    <span className="p-1 text-gray-400">
                      {expandedTicket === ticket.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </div>
                </div>

                {expandedTicket === ticket.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 flex-wrap">
                      {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateTicket(ticket.id, { status: s })}
                          className={cn('text-xs px-2 py-1 rounded border transition-colors capitalize',
                            ticket.status === s
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                          )}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        placeholder="Répondre à l'utilisateur…"
                        value={replyText[ticket.id] || ''}
                        onChange={e => setReplyText(p => ({ ...p, [ticket.id]: e.target.value }))}
                        className="flex-1 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateTicket(ticket.id, { adminReply: replyText[ticket.id], status: 'in_progress' })}
                        disabled={!replyText[ticket.id]?.trim()}
                        className="gradient-bg gap-1.5 self-end"
                      >
                        <Send size={13} /> Répondre
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ══ Statistiques tab ══ */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subscription breakdown */}
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
                  return (
                    <div key={s.subscription} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[s.subscription]}`}>{s.subscription}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{s._count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${s.subscription === 'free' ? 'bg-gray-400' : s.subscription === 'pro' ? 'bg-blue-500' : 'bg-purple-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">MRR estimé</span>
                  <span className="font-bold text-emerald-600 text-base">€{mrr}/mois</span>
                </div>
              </CardContent>
            </Card>

            {/* Candidate status distribution */}
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
                        <div
                          className={`${barColors[s.status] || 'bg-gray-400'} h-1.5 rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Weekly activity */}
            <Card className="border-0 shadow-sm dark:bg-gray-900 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> Activité cette semaine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                    <div className="text-3xl font-bold text-indigo-600">{newUsersThisWeek}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <UserPlus size={11} /> Nouveaux comptes (7 derniers jours)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">{candidatesThisWeek}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                      <UserCheck size={11} /> Candidats ajoutés (7 derniers jours)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ Système tab ══ */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* IA */}
            <Card className="border-0 shadow-sm dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Intelligence Artificielle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Analyses effectuées', value: aiAnalysesCount },
                  { label: 'Clé API', value: hasAiKey ? 'Configurée ✓' : 'Non configurée' },
                  { label: 'Mode', value: hasAiKey ? 'Live AI' : 'Démo' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* DB */}
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
                  { label: 'Intégrations ATS', value: integrationsCount, icon: Link2 },
                  { label: 'Boîtes mail', value: emailInboxesCount, icon: Inbox },
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

            {/* Latest vacancies */}
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
          </div>

          {/* Email & integrations */}
          <Card className="border-0 shadow-sm dark:bg-gray-900">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-x-8 gap-y-3 items-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Connecteurs</span>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Link2 size={13} className="text-blue-500" />
                  <span>{integrationsCount} intégration{integrationsCount !== 1 ? 's' : ''} ATS active{integrationsCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Mail size={13} className="text-purple-500" />
                  <span>{emailInboxesCount} boîte{emailInboxesCount !== 1 ? 's' : ''} email connectée{emailInboxesCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
