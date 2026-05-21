'use client'

import { useState } from 'react'
import {
  Users, Briefcase, UserCheck, MessageSquare, Activity, Shield,
  CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  Trash2, RefreshCw, Send, TrendingUp, Database, Mail, Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { formatDate, cn } from '@/lib/utils'

const SUBSCRIPTION_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  pro: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
}

const SUBSCRIPTION_PRICES: Record<string, string> = {
  free: '€0/mo',
  pro: '€49/mo',
  enterprise: 'Custom',
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

interface Props {
  users: any[]
  tickets: any[]
  subscriptions: Array<{ subscription: string; _count: number }>
  counts: { users: number; vacancies: number; candidates: number; openTickets: number }
  hasAiKey: boolean
}

export function AdminClient({ users: initialUsers, tickets: initialTickets, subscriptions, counts, hasAiKey }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [tickets, setTickets] = useState(initialTickets)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  // ── User actions ──────────────────────────────────────────────────────────

  const updateUser = async (id: string, data: Record<string, any>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
      toast({ title: 'User updated' })
    } else {
      toast({ title: 'Update failed', variant: 'destructive' })
    }
  }

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}? This is irreversible.`)) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ title: 'User deleted' })
    }
  }

  // ── Ticket actions ─────────────────────────────────────────────────────────

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
      toast({ title: 'Ticket updated' })
    }
  }

  // ── Revenue estimates ──────────────────────────────────────────────────────
  const mrr = subscriptions.reduce((sum, s) => {
    const prices: Record<string, number> = { free: 0, pro: 49, enterprise: 299 }
    return sum + (prices[s.subscription] || 0) * s._count
  }, 0)

  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: counts.users, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Vacancies', value: counts.vacancies, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Candidates', value: counts.candidates, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Open Tickets', value: counts.openTickets, icon: MessageSquare, color: counts.openTickets > 0 ? 'text-red-600' : 'text-gray-400', bg: counts.openTickets > 0 ? 'bg-red-50' : 'bg-gray-50' },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue + Health row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">€{mrr.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Estimated MRR based on subscriptions</p>
            <div className="mt-3 space-y-2">
              {subscriptions.map(s => (
                <div key={s.subscription} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-gray-600">{s.subscription}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className="gradient-bg h-1.5 rounded-full" style={{ width: `${(s._count / counts.users) * 100}%` }} />
                    </div>
                    <span className="font-medium text-gray-700 w-4 text-right">{s._count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> System Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Database', status: 'Operational', ok: true, icon: Database },
                { label: 'AI Engine', status: hasAiKey ? 'Live AI' : 'Demo Mode', ok: true, icon: Shield },
                { label: 'Email Scanning', status: 'Ready', ok: true, icon: Mail },
                { label: 'Support Queue', status: `${openCount} open · ${inProgressCount} in progress`, ok: openCount === 0, icon: MessageSquare },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.status}</p>
                  </div>
                  <item.icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies ({users.length})</TabsTrigger>
          <TabsTrigger value="support">
            Support
            {openCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{openCount}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── Companies tab ── */}
        <TabsContent value="companies" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Activity</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(user => (
                      <tr key={user.id} className={cn('hover:bg-gray-50 transition-colors', user.suspended && 'opacity-60')}>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-gray-900">{user.name || '—'}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.company}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <Select
                              value={user.subscription}
                              onValueChange={val => updateUser(user.id, { subscription: val })}
                            >
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free — €0/mo</SelectItem>
                                <SelectItem value="pro">Pro — €49/mo</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span title="Vacancies">{user._count.vacancies} vac</span>
                            <span title="Candidates">{user._count.candidates} cand</span>
                            <span title="Support tickets">{user._count.supportTickets} tickets</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400 hidden xl:table-cell">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          {user.suspended ? (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>
                          ) : user.role === 'admin' ? (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Admin</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {user.role !== 'admin' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateUser(user.id, { suspended: !user.suspended })}
                                className={cn('text-xs px-2 py-1 rounded border transition-colors',
                                  user.suspended ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                )}
                                title={user.suspended ? 'Reactivate' : 'Suspend'}
                              >
                                {user.suspended ? 'Reactivate' : 'Suspend'}
                              </button>
                              <button
                                onClick={() => deleteUser(user.id, user.email || '')}
                                className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                                title="Delete user"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Support tab ── */}
        <TabsContent value="support" className="mt-4 space-y-3">
          {tickets.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No support tickets yet</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map(ticket => (
              <Card key={ticket.id} className={cn('border-0 shadow-sm transition-all', ticket.status === 'resolved' || ticket.status === 'closed' ? 'opacity-70' : '')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${ticket.priority === 'urgent' ? 'bg-red-500' : ticket.priority === 'high' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{ticket.subject}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                        <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {ticket.user.name} · {ticket.user.email} · {ticket.user.company}
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${SUBSCRIPTION_COLORS[ticket.user.subscription] || ''}`}>{ticket.user.subscription}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{ticket.message}</p>
                      {ticket.adminReply && (
                        <div className="mt-2 p-2.5 bg-blue-50 rounded-lg border-l-2 border-blue-300">
                          <p className="text-xs font-semibold text-blue-600 mb-1">Admin reply · {ticket.repliedAt ? formatDate(ticket.repliedAt) : ''}</p>
                          <p className="text-xs text-blue-800">{ticket.adminReply}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
                      <button
                        onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {expandedTicket === ticket.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {expandedTicket === ticket.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      <div className="flex gap-2">
                        {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                          <button
                            key={s}
                            onClick={() => updateTicket(ticket.id, { status: s })}
                            className={cn('text-xs px-2 py-1 rounded border transition-colors capitalize',
                              ticket.status === s ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            )}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          placeholder="Reply to user (they'll see this in their support page)…"
                          value={replyText[ticket.id] || ''}
                          onChange={e => setReplyText(p => ({ ...p, [ticket.id]: e.target.value }))}
                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateTicket(ticket.id, { adminReply: replyText[ticket.id], status: 'in_progress' })}
                          disabled={!replyText[ticket.id]?.trim()}
                          className="gradient-bg gap-1.5 self-end"
                        >
                          <Send size={13} /> Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
