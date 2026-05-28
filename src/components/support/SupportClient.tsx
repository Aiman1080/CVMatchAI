'use client'

import { useState, useEffect } from 'react'
import { LifeBuoy, Send, Clock, CheckCircle2, AlertCircle, MessageSquare, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { AISupportChat } from './AISupportChat'

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  adminReply: string | null
  repliedAt: string | null
  createdAt: string
}

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  open: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: <Clock size={12} /> },
  in_progress: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', icon: <AlertCircle size={12} /> },
  resolved: { color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400', icon: <CheckCircle2 size={12} /> },
  closed: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: <CheckCircle2 size={12} /> },
}

export function SupportClient() {
  const { t } = useLanguage()
  const ts = t.dashboard.support
  const STATUS_LABELS: Record<string, string> = {
    open: ts.statusOpen, in_progress: ts.statusInProgress, resolved: ts.statusResolved, closed: ts.statusClosed,
  }
  const PRIORITY_LABELS: Record<string, string> = {
    low: ts.priorityLowLabel, normal: ts.priorityNormalLabel, high: ts.priorityHighLabel, urgent: ts.priorityUrgentLabel,
  }
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })

  useEffect(() => {
    fetch('/api/support')
      .then(r => r.json())
      .then(data => { setTickets(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast({ title: ts.fillRequired, variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const ticket = await res.json()
      setTickets(prev => [ticket, ...prev])
      setForm({ subject: '', message: '', priority: 'normal' })
      setShowForm(false)
      toast({ title: ts.ticketSubmitted, description: ts.ticketSubmittedDesc })
    } else {
      toast({ title: ts.submitFailed, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  const handleChatCreateTicket = (context: string) => {
    setForm(f => ({
      ...f,
      subject: f.subject || 'Support request from AI chat',
      message: context ? `--- Chat history ---\n${context}\n--- End chat history ---\n\n${f.message}` : f.message,
    }))
    setShowForm(true)
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  return (
    <div className="max-w-3xl space-y-6">
      {/* AI Support Chat */}
      <AISupportChat onCreateTicket={handleChatCreateTicket} />

      {/* SLA banner */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <LifeBuoy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{ts.slaBanner}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">{ts.slaDesc}</p>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white gap-2"
          size="sm"
        >
          <Plus size={14} /> {ts.newTicket}
        </Button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              {ts.newSupportTicket}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1.5">{ts.subject}</label>
              <Input
                placeholder={ts.subjectPlaceholder}
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1.5">{ts.message}</label>
              <Textarea
                placeholder={ts.messagePlaceholder}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.message.length} characters</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1.5">{ts.priority}</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{ts.priorityLow}</SelectItem>
                    <SelectItem value="normal">{ts.priorityNormal}</SelectItem>
                    <SelectItem value="high">{ts.priorityHigh}</SelectItem>
                    <SelectItem value="urgent">{ts.priorityUrgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 sm:mt-5">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1 sm:flex-none">{ts.cancel}</Button>
                <Button size="sm" onClick={submit} disabled={submitting} className="gap-2 flex-1 sm:flex-none">
                  <Send size={14} /> {submitting ? ts.sending : ts.submitTicket}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{ts.yourTickets}</CardTitle>
            {openCount > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                {openCount} {ts.open}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">{ts.loadingTickets}</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">{ts.noTickets}</p>
              <p className="text-xs text-gray-400 mt-1">{ts.noTicketsDesc}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {tickets.map(ticket => {
                const statusStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.open
                const statusLabel = STATUS_LABELS[ticket.status] || ticket.status
                const isExpanded = expanded === ticket.id
                return (
                  <div key={ticket.id} className="py-3">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpanded(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</p>
                            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', statusStyle.color)}>
                              {statusStyle.icon}{statusLabel}
                            </span>
                            <span className="text-xs text-gray-400">{PRIORITY_LABELS[ticket.priority]}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ts.submitted} {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {ticket.repliedAt && ` · ${ts.replied} ${new Date(ticket.repliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{ts.yourMessage}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.message}</p>
                        </div>
                        {ticket.adminReply ? (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <LifeBuoy size={12} className="text-blue-600 dark:text-blue-400" />
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{ts.supportReply}</p>
                              {ticket.repliedAt && (
                                <span className="text-xs text-blue-400 ml-auto">
                                  {new Date(ticket.repliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap">{ticket.adminReply}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                            <Clock size={12} />
                            {ts.awaitingReply}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
