'use client'

import { Fragment, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Users, Briefcase, UserCheck, MessageSquare, Activity,
  Shield, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Trash2, Send, TrendingUp, Database, Mail, Loader2,
  Brain, Link2, Inbox, BarChart3, KeyRound,
  CalendarDays, UserPlus, Zap, FileText, Bot,
  Building2, Cpu, Network, GitBranch, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle2, Clock, RefreshCw,
  Search, Download, Bell, Eye,
  Megaphone, Table2, Filter, CreditCard,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AdminSystemTab } from './AdminSystemTab'
import type { UpstashUsage, SentryUsage } from '@/lib/service-usage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { formatDate, cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { BroadcastDialog } from './BroadcastDialog'

// ── helpers ───────────────────────────────────────────────────────────────────

function subEndColor(end: Date | string | null | undefined): string {
  if (!end) return 'text-gray-400'
  const diff = new Date(end).getTime() - Date.now()
  if (diff < 0) return 'text-red-600 font-semibold'
  if (diff < 7 * 24 * 60 * 60 * 1000) return 'text-amber-600'
  return 'text-green-600'
}

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  in_progress: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  resolved: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  closed: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

const PRIORITY_BG: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Users; color: string; bg: string }> = {
  new_user: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  new_vacancy: { icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  analysis: { icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
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
  lastSeenAt: Date | null
  _count: { vacancies: number; candidates: number; supportTickets: number }
}

interface WeeklySignup {
  label: string
  start: string
  end: string
  count: number
}

interface RecentActivityItem {
  type: 'new_user' | 'new_vacancy' | 'analysis'
  description: string
  createdAt: string
}

// Admin sees the full ticket including the requester user's identity fields.
interface AdminTicket {
  id: string
  userId: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string
  priority: 'low' | 'normal' | 'high' | 'urgent' | string
  adminReply: string | null
  repliedAt: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  user: {
    name: string | null
    email: string | null
    company: string | null
    subscription: string | null
  }
}

interface Props {
  users: UserRow[]
  tickets: AdminTicket[]
  subscriptions: Array<{ subscription: string; _count: number }>
  counts: { users: number; vacancies: number; candidates: number; openTickets: number }
  hasAiKey: boolean
  hasSmtp: boolean
  hasSentry: boolean
  hasUpstash: boolean
  hasStripe: boolean
  hasGa: boolean
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
  activeToday: number
  weeklySignups: WeeklySignup[]
  recentActivity: RecentActivityItem[]
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
  upstashUsage: UpstashUsage
  sentryUsage: SentryUsage
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminClient({
  users: initialUsers, tickets: initialTickets, subscriptions, counts, hasAiKey, hasSmtp,
  hasSentry, hasUpstash, hasStripe, hasGa,
  aiAnalysesCount, integrationsCount, emailInboxesCount, candidateStatusDist,
  latestVacancies, newUsersThisWeek, candidatesThisWeek, candidatesToday,
  integrationsByPlatform, candidatesBySource, activeVacanciesCount,
  activeToday, weeklySignups, recentActivity,
  aiUsageStats, dbStats, upstashUsage, sentryUsage,
}: Props) {
  const { t } = useLanguage()
  const ta = (t.dashboard as any).admin || {}
  // Tab state is driven by the sidebar's `admin-tab-change` custom event so tab
  // switches are purely client-side (no server re-render, no extra DB queries).
  // We still seed the initial value from the URL on first mount.
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab') || 'accounts'
  const [activeTab, setActiveTab] = useState(tabParam)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string
      setActiveTab(detail || 'accounts')
    }
    window.addEventListener('admin-tab-change', handler)
    return () => window.removeEventListener('admin-tab-change', handler)
  }, [])
  // Mirror local tab changes (from clicking inside content) back to the URL so
  // refresh/share preserves the active tab.
  useEffect(() => {
    const url = activeTab && activeTab !== 'accounts' ? `/admin?tab=${activeTab}` : '/admin'
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== url) {
      window.history.replaceState({}, '', url)
    }
  }, [activeTab])

  const [users, setUsers] = useState(initialUsers)
  const [tickets, setTickets] = useState(initialTickets)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [subEndEdit, setSubEndEdit] = useState<Record<string, string>>({})
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({})

  // Email Users state
  const [emailFilter, setEmailFilter] = useState<'all' | 'free' | 'pro'>('all')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const [senderEmail, setSenderEmail] = useState('contact@mydeltamatch.com')

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: filteredEmailUsers.map(u => u.id),
          subject: emailSubject,
          body: emailBody,
          fromName: senderEmail.includes('@') ? senderEmail.split('@')[0] : 'DeltaMatch',
        }),
      })
      if (res.ok) {
        setEmailSent(true)
        toast({ title: (ta.emailSentTo || 'Email sent to {count} user(s)').replace('{count}', String(filteredEmailUsers.length)) })
      } else {
        toast({ title: ta.failedSendEmails || 'Failed to send emails', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.failedSendEmails || 'Failed to send emails', variant: 'destructive' })
    } finally {
      setSendingEmail(false)
    }
  }
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Search & filter state
  const [userSearch, setUserSearch] = useState('')
  const [userPlanFilter, setUserPlanFilter] = useState<'all' | 'free' | 'pro' | 'admin' | 'suspended'>('all')
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all')
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('all')

  // Broadcast dialog state
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)

  const DEMO_EMAILS = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'free@cvmatch.ai']
  const realUsers = users.filter(u => !DEMO_EMAILS.includes(u.email || ''))
  const realProUsers = realUsers.filter(u => u.subscription === 'pro')
  const demoCount = users.length - realUsers.length

  const mrr = realProUsers.length * 55
  const arr = mrr * 12
  const nextPaymentDate = realProUsers.length > 0
    ? new Date(Math.min(...realProUsers.filter(u => u.subscriptionEnd).map(u => new Date(u.subscriptionEnd!).getTime()))).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (ta.overview?.noActiveSubscriptions || 'No active subscriptions')

  // Tickets that still need attention (drives the alerts counter in the sidebar
  // and the "Open Tickets" cards). Includes both `open` AND `in_progress` so
  // the badge stays raised until the admin actually resolves the work.
  const activeTickets = tickets.filter((t: AdminTicket) => t.status === 'open' || t.status === 'in_progress')
  const openCount = activeTickets.length
  const proCount = realProUsers.length
  const [resolvingAll, setResolvingAll] = useState(false)

  const handleResolveAll = async () => {
    if (resolvingAll || openCount === 0) return
    if (!confirm((ta.resolveAllConfirm || 'Mark all {count} open/in-progress tickets as resolved?').replace('{count}', String(openCount)))) return
    setResolvingAll(true)
    try {
      const res = await fetch('/api/admin/support/resolve-all', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        // Sync local state so the counter drops to 0 immediately without a reload
        setTickets((prev: AdminTicket[]) => prev.map(t =>
          t.status === 'open' || t.status === 'in_progress'
            ? { ...t, status: 'resolved', repliedAt: new Date().toISOString() }
            : t
        ))
        toast({ title: (ta.resolveAllDone || '{count} tickets resolved').replace('{count}', String(data.resolved ?? openCount)) })
      } else {
        toast({ title: data.error || ta.resolveAllFailed || 'Failed to resolve tickets', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.resolveAllFailed || 'Failed to resolve tickets', variant: 'destructive' })
    } finally {
      setResolvingAll(false)
    }
  }

  const filteredEmailUsers = realUsers.filter(u => {
    if (emailFilter === 'free') return u.subscription === 'free'
    if (emailFilter === 'pro') return u.subscription === 'pro'
    return true
  })

  // Filtered users by search + plan filter
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users.filter(u => {
      if (userPlanFilter === 'admin' && u.role !== 'admin') return false
      if (userPlanFilter === 'free' && u.subscription !== 'free') return false
      if (userPlanFilter === 'pro' && u.subscription !== 'pro') return false
      if (userPlanFilter === 'suspended' && !u.suspended) return false
      if (q) {
        return (
          (u.name?.toLowerCase().includes(q)) ||
          (u.email?.toLowerCase().includes(q)) ||
          (u.company?.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [users, userSearch, userPlanFilter])

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t: AdminTicket) => {
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false
      if (ticketPriorityFilter !== 'all' && t.priority !== ticketPriorityFilter) return false
      return true
    })
  }, [tickets, ticketStatusFilter, ticketPriorityFilter])

  // ── Actions ───────────────────────────────────────────────────────────────

  const updateUser = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
        toast({ title: ta.accountUpdated || 'Account updated' })  // Admin-only
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: err.error || ta.updateFailed || 'Update failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.updateFailed || 'Update failed', variant: 'destructive' })
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm(ta.deleteAccountConfirm || 'Permanently delete this account? All associated data will be lost. This action is irreversible.')) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id))
        toast({ title: ta.accountDeleted || 'Account permanently deleted' })
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: err.error || ta.deleteFailed || 'Delete failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.deleteFailed || 'Delete failed', variant: 'destructive' })
    }
  }

  const resetPassword = async (id: string) => {
    setLoading(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
      if (res.ok) {
        const { tempPassword } = await res.json()
        setTempPasswords(p => ({ ...p, [id]: tempPassword }))
        toast({ title: ta.tempPasswordGenerated || 'Temporary password generated' })
      } else {
        toast({ title: ta.resetFailed || 'Reset failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.resetFailed || 'Reset failed', variant: 'destructive' })
    } finally {
      setLoading(p => ({ ...p, [id]: false }))
    }
  }

  const saveSubEnd = async (id: string) => {
    await updateUser(id, { subscriptionEnd: subEndEdit[id] || null })
    setSubEndEdit(p => { const n = { ...p }; delete n[id]; return n })
  }

  const updateTicket = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const updated = await res.json()
        setTickets((prev: AdminTicket[]) => prev.map(t => t.id === id ? { ...t, ...updated } : t))
        if (data.adminReply) setReplyText(p => ({ ...p, [id]: '' }))
        toast({ title: ta.ticketUpdated || 'Ticket updated' })
      } else {
        toast({ title: ta.updateFailed || 'Update failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.updateFailed || 'Update failed', variant: 'destructive' })
    }
  }

  const exportUsersCSV = async () => {
    try {
      const res = await fetch('/api/admin/export-users')
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: ta.usersExported || 'Users exported successfully' })
    } catch {
      toast({ title: ta.exportFailed || 'Export failed', variant: 'destructive' })
    }
  }

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return
    setBroadcastSending(true)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage }),
      })
      if (res.ok) {
        const { sent } = await res.json()
        toast({ title: (ta.broadcastSent || 'Broadcast sent to {count} users').replace('{count}', String(sent)) })
        setBroadcastOpen(false)
        setBroadcastTitle('')
        setBroadcastMessage('')
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: err.error || ta.broadcastFailed || 'Broadcast failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: ta.broadcastFailed || 'Broadcast failed', variant: 'destructive' })
    } finally {
      setBroadcastSending(false)
    }
  }

  // ── Plan limits (mirrored from plans.ts for display) ───────────────────
  const planLimits = [
    { plan: 'Free', price: '0', maxVacancies: '3', maxCandidates: `25${ta.actions?.perMonthShort || '/mo'}`, aiAnalysis: true, emailInbox: false, atsIntegrations: false, analytics: false },
    { plan: 'Pro', price: '55', maxVacancies: ta.actions?.unlimited || 'Unlimited', maxCandidates: ta.actions?.unlimited || 'Unlimited', aiAnalysis: true, emailInbox: true, atsIntegrations: true, analytics: true },
  ]

  // ── AI features definition (static) ───────────────────────────────────────

  const taf = ta.aiTab?.features || {}
  const aiFeatures = [
    {
      name: taf.cvAnalysisName || 'CV Analysis & Scoring', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30',
      status: hasAiKey ? 'live' : 'demo', model: 'gemini-2.5-flash', thinking: taf.cvAnalysisThinking || 'Function calling mode',
      details: [taf.cvAnalysisD1 || 'Extraction of skills, experience, degrees', taf.cvAnalysisD2 || 'Match score 0-100 against the job posting', taf.cvAnalysisD3 || 'Detailed strengths & weaknesses', taf.cvAnalysisD4 || 'Executive summary of the candidate', taf.cvAnalysisD5 || 'Automatic language detection from CV'],
      stat: ((aiAnalysesCount !== 1 ? (taf.analysesPerformed || '{count} analyses performed') : (taf.oneAnalysisPerformed || '{count} analysis performed')).replace('{count}', String(aiAnalysesCount))),
    },
    {
      name: taf.emailGenName || 'AI Email Generator', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30',
      status: hasAiKey ? 'live' : 'demo', model: 'gemini-2.5-flash', thinking: taf.emailGenThinking || 'Fast inference',
      details: [taf.emailGenD1 || 'Interview invitation', taf.emailGenD2 || 'Rejection - worded with respect', taf.emailGenD3 || 'Follow-up - re-engagement after interview', taf.emailGenD4 || 'Language auto-detected from candidate CV', taf.emailGenD5 || 'Personalized with name, position and company'],
      stat: taf.emailGenStat || '3 email types supported',
    },
    {
      name: taf.imapName || 'IMAP Email Scanner', icon: Inbox, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30',
      status: emailInboxesCount > 0 ? 'live' : 'configured', model: taf.imapModel || 'Rule-based detection + AI', thinking: taf.imapThinking || 'Heuristics first, Gemini as fallback',
      details: [taf.imapD1 || 'Secure IMAP/IMAPS connection', taf.imapD2 || 'Automatic CV attachment detection', taf.imapD3 || 'Anti-spam filtering by subject analysis', taf.imapD4 || 'Candidate name extraction from email', taf.imapD5 || 'Automatic candidate profile creation'],
      stat: (taf.inboxesConnected || '{count} inbox(es) connected').replace('{count}', String(emailInboxesCount)),
    },
    {
      name: taf.atsName || 'ATS Integrations', icon: Network, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30',
      status: integrationsCount > 0 ? 'live' : 'available', model: taf.atsModel || 'REST API + synchronization', thinking: taf.atsThinking || 'Sync one-way to DeltaMatch',
      details: [taf.atsD1 || 'Teamtailor: import candidates & jobs via API', taf.atsD2 || 'Recruitee: sync applications and statuses', taf.atsD3 || 'SmartRecruiters: bulk import', taf.atsD4 || 'AI analyzes each imported CV automatically', taf.atsD5 || 'Intelligent deduplication of candidates'],
      stat: (taf.integrations || '{count} integration(s)').replace('{count}', String(integrationsCount)),
    },
    {
      name: taf.parserName || 'Document Parser', icon: GitBranch, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30',
      status: 'live', model: taf.parserModel || 'pdf-parse + mammoth', thinking: taf.parserThinking || 'Text extraction pre-AI',
      details: [taf.parserD1 || 'PDF: extraction via pdf-parse (native)', taf.parserD2 || 'DOCX/DOC: extraction via mammoth', taf.parserD3 || 'TXT/paste: direct', taf.parserD4 || 'Automatic formatting artifact cleanup', taf.parserD5 || 'Sends raw text to Gemini for analysis'],
      stat: taf.parserStat || 'PDF, DOCX, TXT supported',
    },
    {
      name: taf.pipelineName || 'Pipeline & Kanban', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      status: 'live', model: taf.pipelineModel || 'Application logic (no AI)', thinking: taf.pipelineThinking || 'No AI - manual management',
      details: [taf.pipelineD1 || 'List view and drag-and-drop Kanban view', taf.pipelineD2 || 'Statuses: New, Reviewing, Shortlisted, Hired, Rejected', taf.pipelineD3 || 'Talent pool: keep the best candidates', taf.pipelineD4 || 'Filters by score, status, source, language', taf.pipelineD5 || 'CSV / PDF export of candidate list'],
      stat: (taf.candidatesOnPlatform || '{count} candidates on the platform').replace('{count}', String(counts.candidates)),
    },
  ]

  // Growth chart max
  const maxSignup = Math.max(...weeklySignups.map(w => w.count), 1)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {[
          { label: ta.kpi?.realUsers || 'Real users', value: realUsers.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: ta.kpi?.activeToday || 'Active today', value: activeToday, icon: Eye, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
          { label: ta.kpi?.payingPro || 'Paying Pro', value: proCount, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: ta.kpi?.mrr || 'MRR', value: `€${mrr}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: ta.kpi?.aiAnalyses || 'AI Analyses', value: aiAnalysesCount, icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
          { label: ta.kpi?.newUsers7d || 'New users 7d', value: newUsersThisWeek, icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
          { label: ta.kpi?.openTickets || 'Open tickets', value: openCount, icon: MessageSquare, color: openCount > 0 ? 'text-red-600' : 'text-gray-400', bg: openCount > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-800' },
        ].map(s => (
          <Card key={s.label} className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
      <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{ta.health?.title || 'System Status'}</span>
            {[
              { label: ta.health?.database || 'Database', ok: true },
              { label: hasAiKey ? (ta.health?.aiLive || 'AI - Live (gemini-2.5-flash)') : (ta.health?.aiDemo || 'AI - Demo mode'), ok: hasAiKey },
              { label: hasSmtp ? (ta.health?.smtpConfigured || 'SMTP - Configured') : (ta.health?.smtpNotConfigured || 'SMTP - Not configured'), ok: hasSmtp },
              { label: (ta.health?.emailInboxes || 'Email - {count} inbox(es)').replace('{count}', String(emailInboxesCount)), ok: true },
              { label: (ta.health?.supportOpen || 'Support - {count} open').replace('{count}', String(openCount)), ok: openCount === 0 },
              { label: (ta.health?.atsConnections || 'ATS - {count} connection(s)').replace('{count}', String(integrationsCount)), ok: true },
              { label: (ta.health?.activeJobs || '{count} active job(s)').replace('{count}', String(activeVacanciesCount)), ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-amber-400'}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Tabs (controlled by sidebar) ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden">
          <TabsTrigger value="accounts">{ta.tabs?.accounts || 'Accounts'}</TabsTrigger>
          <TabsTrigger value="support">{ta.tabs?.support || 'Support'}</TabsTrigger>
          <TabsTrigger value="overview">{ta.tabs?.overview || 'Overview'}</TabsTrigger>
          <TabsTrigger value="ai">{ta.tabs?.ai || 'AI'}</TabsTrigger>
          <TabsTrigger value="stats">{ta.tabs?.stats || 'Statistics'}</TabsTrigger>
          <TabsTrigger value="email">{ta.tabs?.email || 'Email Users'}</TabsTrigger>
          <TabsTrigger value="actions">{ta.tabs?.actions || 'Admin Actions'}</TabsTrigger>
          <TabsTrigger value="system">{ta.tabs?.system || 'System'}</TabsTrigger>
        </TabsList>

        {/* ══ Accounts tab ══ */}
        <TabsContent value="accounts" className="mt-4 space-y-4">
          {/* User stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: ta.kpi?.totalUsers || 'Total users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
              { label: ta.kpi?.activeToday || 'Active today', value: activeToday, icon: Activity, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
              { label: ta.kpi?.proUsers || 'Pro users', value: proCount, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg}`}>
                <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                <div className="min-w-0 flex-1">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={ta.users?.searchPlaceholder || 'Search users by name, email, or company...'}
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-10 h-10"
            />
            {userSearch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {(ta.users?.searchResults || '{filtered} of {total} users').replace('{filtered}', String(filteredUsers.length)).replace('{total}', String(users.length))}
              </span>
            )}
          </div>

          {/* Plan filter chips - quick filter by Free / Pro / Admin / Suspended */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {([
              { key: 'all', label: ta.filterAll || 'All', count: users.length },
              { key: 'free', label: ta.filterFree || 'Free', count: users.filter(u => u.subscription === 'free').length },
              { key: 'pro', label: ta.filterPro || 'Pro', count: users.filter(u => u.subscription === 'pro').length },
              { key: 'admin', label: ta.filterAdmin || 'Admin', count: users.filter(u => u.role === 'admin').length },
              { key: 'suspended', label: ta.filterSuspended || 'Suspended', count: users.filter(u => u.suspended).length },
            ] as const).map(chip => {
              const active = userPlanFilter === chip.key
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setUserPlanFilter(chip.key)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-normal text-center leading-tight',
                    active
                      ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  {chip.label} <span className="opacity-60">({chip.count})</span>
                </button>
              )
            })}
            {(userPlanFilter !== 'all' || userSearch) && (
              <span className="text-xs text-gray-400 ml-auto">
                {filteredUsers.length} {ta.filterMatching || 'matching'}
              </span>
            )}
          </div>

          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{ta.users?.colName || 'Name'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">{ta.users?.colEmail || 'Email'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">{ta.users?.colCompany || 'Company'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{ta.users?.colPlan || 'Plan'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">{ta.users?.colRole || 'Role'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{ta.users?.colStatus || 'Status'}</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">{ta.users?.colCreated || 'Created'}</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredUsers.map(user => {
                      const isExpanded = expandedUser === user.id
                      return (
                        <Fragment key={user.id}>
                          <tr
                            className={cn('hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer', user.suspended && 'opacity-60')}
                            onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                          >
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                {user.name || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] block">{user.email || '-'}</span>
                            </td>
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                {user.company ? <><Building2 size={10} />{user.company}</> : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[user.subscription]}`}>
                                {user.subscription}
                              </span>
                              {user.subscriptionEnd && (
                                <div className={`text-xs mt-1 ${subEndColor(user.subscriptionEnd)}`}>
                                  {ta.users?.expPrefix || 'Exp.'} {formatDate(user.subscriptionEnd)}
                                </div>
                              )}
                              {/* Quick action buttons for fast plan changes - admin only */}
                              <div className="flex gap-1 mt-1.5">
                                {user.subscription !== 'pro' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateUser(user.id, { subscription: 'pro' }) }}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 font-medium"
                                    title={ta.users?.upgradeToProTitle || 'Manually upgrade to Pro (no payment)'}
                                  >
                                    ↑ Pro
                                  </button>
                                )}
                                {user.subscription !== 'free' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateUser(user.id, { subscription: 'free' }) }}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
                                    title={ta.users?.downgradeToFreeTitle || 'Manually downgrade to Free'}
                                  >
                                    ↓ Free
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 hidden xl:table-cell">
                              <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                {user.role === 'admin' ? (ta.users?.roleAdmin || 'Admin') : (ta.users?.roleRecruiter || 'Recruiter')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {user.suspended ? (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full w-fit">{ta.users?.statusSuspended || 'Suspended'}</span>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full w-fit">{ta.users?.statusActive || 'Active'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 hidden lg:table-cell">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-400 dark:text-gray-500">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </td>
                          </tr>

                          {/* ── Expanded detail row ── */}
                          {isExpanded && (
                            <tr className="bg-blue-50/40 dark:bg-blue-950/10">
                              <td colSpan={8} className="px-5 py-5" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                                  {/* Col 1: Subscription */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <CalendarDays size={12} /> {ta.users?.subscriptionHeading || 'Subscription'}
                                    </p>
                                    <div className="space-y-2.5">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">{ta.users?.planLabel || 'Plan'}</label>
                                        <Select value={user.subscription} onValueChange={val => updateUser(user.id, { subscription: val })}>
                                          <SelectTrigger className="h-8 text-xs w-44 dark:bg-gray-800 dark:border-gray-700">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="free">{ta.users?.planFree || 'Free - EUR 0/mo'}</SelectItem>
                                            <SelectItem value="pro">{ta.users?.planPro || 'Pro - EUR 55/mo'}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">{ta.users?.expiryLabel || 'Expiry'}</label>
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="date"
                                            value={subEndEdit[user.id] !== undefined ? subEndEdit[user.id] : user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString().split('T')[0] : ''}
                                            onChange={e => setSubEndEdit(p => ({ ...p, [user.id]: e.target.value }))}
                                            className="h-8 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                          {subEndEdit[user.id] !== undefined && (
                                            <Button size="sm" className="h-8 text-xs gradient-bg px-3" onClick={() => saveSubEnd(user.id)}>{ta.users?.save || 'Save'}</Button>
                                          )}
                                        </div>
                                        {user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date() && (
                                          <p className="text-xs text-red-500 mt-1">{ta.users?.expired || 'Expired'}</p>
                                        )}
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">{ta.users?.companyLabel || 'Company'}</label>
                                        <Input
                                          className="h-8 text-xs w-44 dark:bg-gray-800 dark:border-gray-700"
                                          defaultValue={user.company || ''}
                                          placeholder={ta.users?.companyPlaceholder || 'Company name'}
                                          onBlur={e => {
                                            const val = e.target.value.trim()
                                            if (val !== (user.company || '')) updateUser(user.id, { company: val || null })
                                          }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-400">{(ta.users?.joinedOn || 'Joined on {date}').replace('{date}', formatDate(user.createdAt))}</p>
                                    </div>
                                  </div>

                                  {/* Col 2: Role */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <Shield size={12} /> {ta.users?.roleAccessHeading || 'Role & Access'}
                                    </p>
                                    <div className="space-y-2.5">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">{ta.users?.accountRoleLabel || 'Account Role'}</label>
                                        <Select value={user.role} onValueChange={val => updateUser(user.id, { role: val })}>
                                          <SelectTrigger className="h-8 text-xs w-44 dark:bg-gray-800 dark:border-gray-700">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="recruiter">{ta.users?.roleSelectRecruiter || 'Recruiter'}</SelectItem>
                                            <SelectItem value="admin">{ta.users?.roleSelectAdmin || 'Administrator'}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="pt-1">
                                        <label className="text-xs text-gray-500 block mb-1">{ta.users?.accountStatusLabel || 'Account Status'}</label>
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
                                            ? <><CheckCircle size={12} /> {ta.users?.reactivateAccount || 'Reactivate account'}</>
                                            : <><XCircle size={12} /> {ta.users?.suspendAccount || 'Suspend account'}</>
                                          }
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Col 3: Utilisation */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <BarChart3 size={12} /> {ta.users?.utilisationHeading || 'Utilisation'}
                                    </p>
                                    <div className="space-y-2">
                                      {[
                                        { label: ta.users?.vacanciesPosted || 'Vacancies posted', value: user._count.vacancies, icon: Briefcase },
                                        { label: ta.users?.candidates || 'Candidates', value: user._count.candidates, icon: UserCheck },
                                        { label: ta.users?.supportTickets || 'Support tickets', value: user._count.supportTickets, icon: MessageSquare },
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

                                  {/* Col 4: Actions */}
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                                      <Cpu size={12} /> {ta.users?.adminActionsHeading || 'Admin Actions'}
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
                                        {loading[user.id] ? (ta.users?.generating || 'Generating...') : (ta.users?.resetPassword || 'Reset password')}
                                      </Button>
                                      {tempPasswords[user.id] && (
                                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">{ta.users?.tempPasswordLabel || 'Temporary password:'}</p>
                                          <code className="text-sm font-mono text-amber-900 dark:text-amber-300 select-all break-all">{tempPasswords[user.id]}</code>
                                        </div>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs gap-1.5 w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                        onClick={() => deleteUser(user.id)}
                                      >
                                        <Trash2 size={12} /> {ta.users?.deletePermanently || 'Delete permanently'}
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
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">
                          {userSearch ? (ta.users?.noMatch || 'No users match your search') : (ta.users?.noUsers || 'No users found')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Support tab ══ */}
        <TabsContent value="support" className="mt-4 space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">{ta.support?.filter || 'Filter:'}</span>
            </div>
            <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-36 dark:bg-gray-800 dark:border-gray-700">
                <SelectValue placeholder={ta.support?.statusPlaceholder || 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ta.support?.allStatuses || 'All statuses'}</SelectItem>
                <SelectItem value="open">{ta.support?.statusOpen || 'Open'}</SelectItem>
                <SelectItem value="in_progress">{ta.support?.statusInProgress || 'In Progress'}</SelectItem>
                <SelectItem value="resolved">{ta.support?.statusResolved || 'Resolved'}</SelectItem>
                <SelectItem value="closed">{ta.support?.statusClosed || 'Closed'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ticketPriorityFilter} onValueChange={setTicketPriorityFilter}>
              <SelectTrigger className="h-8 text-xs w-36 dark:bg-gray-800 dark:border-gray-700">
                <SelectValue placeholder={ta.support?.priorityPlaceholder || 'Priority'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ta.support?.allPriorities || 'All priorities'}</SelectItem>
                <SelectItem value="low">{ta.support?.priorityLow || 'Low'}</SelectItem>
                <SelectItem value="normal">{ta.support?.priorityNormal || 'Normal'}</SelectItem>
                <SelectItem value="high">{ta.support?.priorityHigh || 'High'}</SelectItem>
                <SelectItem value="urgent">{ta.support?.priorityUrgent || 'Urgent'}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolveAll}
              disabled={resolvingAll || openCount === 0}
              className="h-8 gap-1.5 text-xs ml-auto whitespace-normal text-center leading-tight"
              title={ta.resolveAllTooltip || 'Mark every open/in-progress ticket as resolved'}
            >
              {resolvingAll ? <Loader2 size={12} className="animate-spin shrink-0" /> : <CheckCircle2 size={12} className="shrink-0" />}
              {resolvingAll
                ? (ta.resolveAllResolving || 'Resolving...')
                : openCount > 0
                  ? (ta.resolveAllBtn || 'Mark all {count} resolved').replace('{count}', String(openCount))
                  : (ta.resolveAllDoneAll || 'All resolved')}
            </Button>
            <span className="text-xs text-gray-400">
              {(ta.support?.ticketCount || '{filtered} of {total} tickets').replace('{filtered}', String(filteredTickets.length)).replace('{total}', String(tickets.length))}
            </span>
          </div>

          {filteredTickets.length === 0 ? (
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {tickets.length === 0 ? (ta.support?.noTickets || 'No support tickets') : (ta.support?.noMatch || 'No tickets match your filters')}
                </p>
              </CardContent>
            </Card>
          ) : filteredTickets.map((ticket: AdminTicket) => (
            <Card
              key={ticket.id}
              className={cn('border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all cursor-pointer hover:shadow-md',
                (ticket.status === 'resolved' || ticket.status === 'closed') && 'opacity-70'
              )}
              onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${ticket.priority === 'urgent' ? 'bg-red-500' : ticket.priority === 'high' ? 'bg-amber-500' : ticket.priority === 'normal' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{ticket.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_BG[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      {ticket.user?.subscription && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLAN_COLORS[ticket.user.subscription] || ''}`}>
                          {ticket.user.subscription}
                        </span>
                      )}
                    </div>
                    {/* User info */}
                    {ticket.user && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Users size={10} />
                        <span>{ticket.user.name || (ta.support?.unknownUser || 'Unknown')}</span>
                        {ticket.user.email && (
                          <span className="text-gray-300 dark:text-gray-600">({ticket.user.email})</span>
                        )}
                        {ticket.user.company && (
                          <span className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
                            <Building2 size={9} />{ticket.user.company}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-2 border-blue-300">
                        <p className="text-xs font-semibold text-blue-600 mb-1">{ta.support?.adminReply || 'Admin reply'} {ticket.repliedAt ? `- ${formatDate(ticket.repliedAt)}` : ''}</p>
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
                      <textarea rows={2} placeholder={ta.support?.replyPlaceholder || 'Reply to this ticket...'} value={replyText[ticket.id] || ''}
                        onChange={e => setReplyText(p => ({ ...p, [ticket.id]: e.target.value }))}
                        className="flex-1 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button size="sm" onClick={() => updateTicket(ticket.id, { adminReply: replyText[ticket.id], status: 'in_progress' })}
                        disabled={!replyText[ticket.id]?.trim()} className="gradient-bg gap-1.5 self-end">
                        <Send size={13} /> {ta.support?.reply || 'Reply'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ══ Overview / Dashboard tab ══ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue & Payments */}
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> {ta.overview?.revenueTitle || 'Revenue & Payments'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{ta.overview?.payingProUsers || 'Paying Pro users'}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{proCount} x €55/mo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{ta.overview?.freeUsersReal || 'Free users (real)'}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{realUsers.length - realProUsers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{ta.overview?.demoAccountsExcluded || 'Demo accounts (excluded)'}</span>
                  <span className="text-gray-400">{(ta.overview?.notCounted || '{count} (not counted)').replace('{count}', String(demoCount))}</span>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{ta.overview?.mrrMonthly || 'MRR (Monthly)'}</span>
                    <span className="text-2xl font-bold text-emerald-600">€{mrr}/mo</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{ta.overview?.arrAnnual || 'ARR (Annual)'}</span>
                    <span className="text-sm font-semibold text-emerald-500">€{arr}/yr</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{ta.overview?.nextPaymentExpected || 'Next payment expected'}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{nextPaymentDate}</span>
                  </div>
                  {realProUsers.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase">{ta.overview?.activeProSubscriptions || 'Active Pro subscriptions'}</p>
                      {realProUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{u.name || u.email}</span>
                            <span className="text-gray-400 ml-2">{u.email}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-600 font-medium">€55/mo</span>
                            {u.subscriptionEnd && (
                              <span className="text-gray-400 ml-2">{(ta.overview?.until || 'until {date}').replace('{date}', new Date(u.subscriptionEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Growth chart - signups per week */}
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-500" /> {ta.overview?.signupsTitle || 'Signups (Last 4 Weeks)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-32">
                  {weeklySignups.map((w, i) => {
                    const pct = maxSignup > 0 ? (w.count / maxSignup) * 100 : 0
                    const weekStart = new Date(w.start)
                    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{w.count}</span>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-md relative" style={{ height: '80px' }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-600 rounded-t-md transition-all duration-300"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{label}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Usage */}
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" /> {ta.overview?.aiUsageTitle || 'AI Usage'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{ta.overview?.totalCvAnalyses || 'Total CV analyses'}</span>
                  <span className="text-2xl font-bold text-violet-600">{aiAnalysesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{ta.overview?.totalCandidates || 'Total candidates'}</span>
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{counts.candidates}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{ta.overview?.analysisRate || 'Analysis rate'}</span>
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {counts.candidates > 0 ? Math.round((aiAnalysesCount / counts.candidates) * 100) : 0}%
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${hasAiKey ? 'bg-green-400' : 'bg-amber-400'}`} />
                    {hasAiKey ? (ta.overview?.aiEngineLive || 'AI Engine: Live (gemini-2.5-flash)') : (ta.overview?.aiEngineDemo || 'AI Engine: Demo mode')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> {ta.overview?.systemHealthTitle || 'System Health'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: ta.overview?.hcDatabase || 'Database', status: ta.overview?.hcConnected || 'Connected', ok: true, icon: Database },
                  { label: ta.overview?.hcAiKey || 'AI API Key', status: hasAiKey ? (ta.overview?.hcConfigured || 'Configured') : (ta.overview?.hcMissing || 'Missing'), ok: hasAiKey, icon: Brain },
                  { label: ta.overview?.hcSmtp || 'SMTP Email', status: hasSmtp ? (ta.overview?.hcConfigured || 'Configured') : (ta.overview?.hcNotConfigured || 'Not configured'), ok: hasSmtp, icon: Mail },
                  { label: ta.overview?.hcOpenTickets || 'Open Tickets', status: (ta.overview?.hcPending || '{count} pending').replace('{count}', String(openCount)), ok: openCount === 0, icon: MessageSquare },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-amber-400'}`} />
                      <span className={`text-xs font-medium ${item.ok ? 'text-green-600' : 'text-amber-600'}`}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent activity feed */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> {ta.overview?.recentActivityTitle || 'Recent Activity'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-gray-400 px-5 py-4">{ta.noRecentActivity || 'No recent activity'}</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recentActivity.map((item, i) => {
                    const meta = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.new_user
                    const Icon = meta.icon
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <div className={`p-1.5 rounded-lg ${meta.bg} shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.description}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.createdAt)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ AI tab ══ */}
        <TabsContent value="ai" className="mt-4 space-y-6">
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-500" /> {ta.aiTab?.modelInProduction || 'AI Model in production'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: ta.aiTab?.model || 'Model', value: 'gemini-2.5-flash', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
                  { label: ta.aiTab?.mode || 'Mode', value: ta.aiTab?.modeFunctionCalling || 'Function calling', icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                  { label: ta.aiTab?.geminiApiKey || 'Gemini API Key', value: hasAiKey ? (ta.aiTab?.configured || 'Configured') : (ta.aiTab?.missing || 'Missing'), icon: hasAiKey ? CheckCircle2 : AlertCircle, color: hasAiKey ? 'text-green-600' : 'text-red-500', bg: hasAiKey ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30' },
                  { label: ta.aiTab?.operationalMode || 'Operational mode', value: hasAiKey ? (ta.aiTab?.liveAi || 'Live AI') : (ta.aiTab?.simulatedDemo || 'Simulated demo'), icon: hasAiKey ? ToggleRight : ToggleLeft, color: hasAiKey ? 'text-green-600' : 'text-amber-600', bg: hasAiKey ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30' },
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">{ta.aiTab?.totalAnalysesPerformed || 'Total AI analyses performed on the platform'}</span>
                  <span className="text-2xl font-bold text-violet-600">{aiAnalysesCount}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: ta.aiTab?.provider || 'Provider', value: 'Google AI' },
                  { label: ta.aiTab?.model || 'Model', value: 'gemini-2.5-flash' },
                  { label: ta.aiTab?.rateLimit || 'Rate limit', value: ta.aiTab?.rateLimitValue || '15 req/min (free tier)' },
                  { label: ta.aiTab?.cost || 'Cost', value: ta.aiTab?.costValue || 'Free tier / ~$0.01/1M tokens' },
                ].map(item => (
                  <div key={item.label} className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-400 dark:text-gray-500">{item.label}</div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {aiFeatures.map(feature => (
              <Card key={feature.name} className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
                      {feature.status === 'live' ? (ta.aiTab?.statusLive || 'Live') : feature.status === 'demo' ? (ta.aiTab?.statusDemo || 'Demo') : feature.status === 'configured' ? (ta.aiTab?.statusConfigured || 'Configured') : (ta.aiTab?.statusAvailable || 'Available')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Cpu size={10} /> <span className="font-medium">{ta.aiTab?.engine || 'Engine:'}</span> {feature.model}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Brain size={10} /> <span className="font-medium">{ta.aiTab?.thinking || 'Thinking:'}</span> {feature.thinking}
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

        {/* ══ Statistics tab ══ */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> {ta.stats?.subscriptionDistribution || 'Subscription Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriptions.map(s => {
                  const total = subscriptions.reduce((acc, x) => acc + x._count, 0)
                  const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
                  const prices: Record<string, number> = { free: 0, pro: 55 }
                  return (
                    <div key={s.subscription} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[s.subscription]}`}>{s.subscription}</span>
                        <span className="text-gray-500 dark:text-gray-400">{(ta.stats?.accountsPctMonth || '{count} accounts - {pct}% - EUR {amount}/month').replace('{count}', String(s._count)).replace('{pct}', String(pct)).replace('{amount}', String(prices[s.subscription] * s._count))}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${s.subscription === 'free' ? 'bg-gray-400' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{ta.stats?.estimatedMrr || 'Estimated MRR'}</span>
                  <span className="font-bold text-emerald-600 text-lg">{(ta.stats?.mrrPerMonth || 'EUR {amount}/month').replace('{amount}', String(mrr))}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" /> {ta.stats?.candidatePipeline || 'Candidate Pipeline'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidateStatusDist.length === 0 ? (
                  <p className="text-xs text-gray-400">{ta.noCandidates || 'No candidates'}</p>
                ) : candidateStatusDist.map(s => {
                  const total = candidateStatusDist.reduce((acc, x) => acc + x._count, 0)
                  const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
                  const barColors: Record<string, string> = { new: 'bg-blue-400', reviewing: 'bg-amber-400', shortlisted: 'bg-purple-400', hired: 'bg-green-500', rejected: 'bg-red-400' }
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

            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-orange-500" /> {ta.stats?.candidateSources || 'Candidate Sources'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidatesBySource.length === 0 ? (
                  <p className="text-xs text-gray-400">{ta.noData || 'No data'}</p>
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

            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> {ta.stats?.recentActivity || 'Recent Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: ta.stats?.candidatesToday || 'Candidates today', value: candidatesToday, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                    { label: ta.stats?.candidatesThisWeek || 'Candidates this week', value: candidatesThisWeek, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                    { label: ta.stats?.newAccounts7d || 'New accounts 7d', value: newUsersThisWeek, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                  ].map(item => (
                    <div key={item.label} className={`text-center p-3 rounded-xl ${item.bg} min-w-0`}>
                      <div className={`text-2xl font-bold ${item.color} break-words`}>{item.value}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight break-words">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ Admin Actions tab ══ */}
        {/* ══ Email Users tab ══ */}
        <TabsContent value="email" className="mt-4 space-y-4">
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" /> {ta.emailUsers?.title || 'Send Email to Users'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{ta.emailUsers?.sendFrom || 'Send from'}</label>
                <input
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="contact@mydeltamatch.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400">{ta.emailUsers?.sendFromHint || 'This must match your configured SMTP email address'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{ta.emailUsers?.filterRecipients || 'Filter recipients (demo accounts excluded)'}</label>
                <div className="flex gap-2">
                  {[
                    { id: 'all' as const, label: (ta.emailUsers?.allUsers || 'All users ({count})').replace('{count}', String(users.length)), color: 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30' },
                    { id: 'free' as const, label: (ta.emailUsers?.free || 'Free ({count})').replace('{count}', String(users.filter(u => u.subscription === 'free').length)), color: 'border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-800' },
                    { id: 'pro' as const, label: (ta.emailUsers?.pro || 'Pro ({count})').replace('{count}', String(users.filter(u => u.subscription === 'pro').length)), color: 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/30' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setEmailFilter(f.id); setEmailSent(false) }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        emailFilter === f.id ? f.color : 'border-gray-200 dark:border-gray-700 text-gray-400'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{(ta.emailUsers?.recipients || 'Recipients ({count})').replace('{count}', String(filteredEmailUsers.length))}</p>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {filteredEmailUsers.slice(0, 20).map(u => (
                    <span key={u.id} className="text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {u.email}
                    </span>
                  ))}
                  {filteredEmailUsers.length > 20 && (
                    <span className="text-xs text-gray-400">{(ta.emailUsers?.more || '+{count} more').replace('{count}', String(filteredEmailUsers.length - 20))}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{ta.emailUsers?.subject || 'Subject'}</label>
                <input
                  value={emailSubject}
                  onChange={e => { setEmailSubject(e.target.value); setEmailSent(false) }}
                  placeholder={ta.emailUsers?.subjectPlaceholder || 'e.g. New feature: AI Interview Questions'}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{ta.emailUsers?.message || 'Message'}</label>
                <textarea
                  value={emailBody}
                  onChange={e => { setEmailBody(e.target.value); setEmailSent(false) }}
                  rows={6}
                  placeholder={ta.emailUsers?.messagePlaceholder || 'Write your email message here...'}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              {emailSent ? (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">{(ta.emailUsers?.sentTo || 'Email sent to {count} user(s)').replace('{count}', String(filteredEmailUsers.length))}</p>
                </div>
              ) : (
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim() || filteredEmailUsers.length === 0}
                  className="w-full gradient-bg gap-2"
                >
                  {sendingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> {ta.emailUsers?.sending || 'Sending...'}</> : <><Mail className="w-4 h-4" /> {(ta.emailUsers?.sendTo || 'Send to {count} user(s)').replace('{count}', String(filteredEmailUsers.length))}</>}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Broadcast notification */}
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-orange-500" /> {ta.actions?.broadcastTitle || 'Broadcast Notification'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ta.actions?.broadcastDesc || 'Send a notification to all active (non-suspended) users on the platform.'}
                </p>
                <Button variant="outline" className="gap-2 w-full" onClick={() => setBroadcastOpen(true)}>
                  <Bell size={14} /> {ta.actions?.composeBroadcast || 'Compose Broadcast'}
                </Button>
              </CardContent>
            </Card>

            {/* Export users */}
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" /> {ta.actions?.exportUsers || 'Export Users'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ta.actions?.exportUsersDesc || 'Download a CSV file with all users, their subscriptions, and usage stats.'}
                </p>
                <Button variant="outline" className="gap-2 w-full" onClick={exportUsersCSV}>
                  <Download size={14} /> {ta.actions?.downloadCsv || 'Download CSV'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Plan limits table */}
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Table2 className="w-4 h-4 text-purple-500" /> {ta.actions?.planLimits || 'Plan Limits'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{ta.actions?.feature || 'Feature'}</th>
                      {planLimits.map(p => (
                        <th key={p.plan} className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{p.plan}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    <tr>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-medium">{ta.actions?.pricePerMonth || 'Price/month'}</td>
                      {planLimits.map(p => (
                        <td key={p.plan} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">EUR {p.price}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-medium">{ta.actions?.maxVacancies || 'Max Vacancies'}</td>
                      {planLimits.map(p => (
                        <td key={p.plan} className="px-4 py-3 text-center text-xs text-gray-700 dark:text-gray-300">{p.maxVacancies}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-medium">{ta.actions?.maxCandidates || 'Max Candidates'}</td>
                      {planLimits.map(p => (
                        <td key={p.plan} className="px-4 py-3 text-center text-xs text-gray-700 dark:text-gray-300">{p.maxCandidates}</td>
                      ))}
                    </tr>
                    {([
                      { label: ta.actions?.aiAnalysis || 'AI Analysis', key: 'aiAnalysis' },
                      { label: ta.actions?.emailInbox || 'Email Inbox', key: 'emailInbox' },
                      { label: ta.actions?.atsIntegrations || 'ATS Integrations', key: 'atsIntegrations' },
                      { label: ta.actions?.analytics || 'Analytics', key: 'analytics' },
                    ] as const).map(feature => (
                      <tr key={feature.key}>
                        <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-medium">{feature.label}</td>
                        {planLimits.map(p => (
                          <td key={p.plan} className="px-4 py-3 text-center">
                            {p[feature.key] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-semibold">{ta.actions?.currentUsers || 'Current users'}</td>
                      {['free', 'pro'].map(plan => {
                        const count = subscriptions.find(s => s.subscription === plan)?._count || 0
                        return (
                          <td key={plan} className="px-4 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300">{count}</td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ System tab ══ */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <AdminSystemTab
            counts={counts}
            hasAiKey={hasAiKey}
            hasSmtp={hasSmtp}
            hasSentry={hasSentry}
            hasUpstash={hasUpstash}
            hasStripe={hasStripe}
            hasGa={hasGa}
            integrationsByPlatform={integrationsByPlatform}
            integrationsCount={integrationsCount}
            emailInboxesCount={emailInboxesCount}
            activeVacanciesCount={activeVacanciesCount}
            openCount={openCount}
            latestVacancies={latestVacancies}
            aiUsageStats={aiUsageStats}
            dbStats={dbStats}
            ta={ta}
            upstashUsage={upstashUsage}
            sentryUsage={sentryUsage}
          />
        </TabsContent>
      </Tabs>

      <BroadcastDialog
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        title={broadcastTitle}
        message={broadcastMessage}
        sending={broadcastSending}
        onTitleChange={setBroadcastTitle}
        onMessageChange={setBroadcastMessage}
        onSend={sendBroadcast}
        labels={ta}
      />
    </div>
  )
}
