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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: <AlertCircle size={12} /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle2 size={12} /> },
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent',
}

export function SupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })

  useEffect(() => {
    fetch('/api/support')
      .then(r => r.json())
      .then(data => { setTickets(data); setLoading(false) })
  }, [])

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast({ title: 'Please fill in subject and message', variant: 'destructive' })
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
      toast({ title: 'Support ticket submitted', description: 'We\'ll reply within 24 hours.' })
    } else {
      toast({ title: 'Failed to submit ticket', variant: 'destructive' })
    }
    setSubmitting(false)
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  return (
    <div className="max-w-3xl space-y-6">
      {/* SLA banner */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <LifeBuoy className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">24-hour response guarantee</p>
          <p className="text-xs text-blue-600">Our support team replies to every ticket within 24 hours on business days.</p>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white gap-2"
          size="sm"
        >
          <Plus size={14} /> New Ticket
        </Button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              New Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Subject</label>
              <Input
                placeholder="Briefly describe your issue…"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Message</label>
              <Textarea
                placeholder="Describe your issue in detail. Include screenshots or steps to reproduce if applicable."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — general question</SelectItem>
                    <SelectItem value="normal">Normal — something not working</SelectItem>
                    <SelectItem value="high">High — impacting my workflow</SelectItem>
                    <SelectItem value="urgent">Urgent — production issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={submit} disabled={submitting} className="gap-2">
                  <Send size={14} /> {submitting ? 'Sending…' : 'Submit Ticket'}
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
            <CardTitle className="text-base">Your Tickets</CardTitle>
            {openCount > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {openCount} open
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No support tickets yet</p>
              <p className="text-xs text-gray-400 mt-1">Submit a ticket above if you need help.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map(ticket => {
                const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open
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
                            <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', status.color)}>
                              {status.icon}{status.label}
                            </span>
                            <span className="text-xs text-gray-400">{PRIORITY_LABELS[ticket.priority]}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Submitted {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {ticket.repliedAt && ` · Replied ${new Date(ticket.repliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 font-medium mb-1">Your message</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                        </div>
                        {ticket.adminReply ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <LifeBuoy size={12} className="text-blue-600" />
                              <p className="text-xs text-blue-700 font-medium">Support Team reply</p>
                              {ticket.repliedAt && (
                                <span className="text-xs text-blue-400 ml-auto">
                                  {new Date(ticket.repliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-blue-900 whitespace-pre-wrap">{ticket.adminReply}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                            <Clock size={12} />
                            Awaiting reply — our team will respond within 24 hours
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
