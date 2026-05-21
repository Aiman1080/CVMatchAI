'use client'

import { useState, useEffect } from 'react'
import { Mail, Plus, Loader2, CheckCircle, AlertCircle, Scan, Info, Trash2, RefreshCw, Zap, Eraser } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'

// Preset IMAP settings for common providers — users can also enter custom host/port
const PROVIDERS = [
  { id: 'gmail', label: 'Gmail', host: 'imap.gmail.com', port: 993 },
  { id: 'outlook', label: 'Outlook / Office 365', host: 'outlook.office365.com', port: 993 },
  { id: 'yahoo', label: 'Yahoo Mail', host: 'imap.mail.yahoo.com', port: 993 },
  { id: 'custom', label: 'Custom IMAP', host: '', port: 993 },
]

interface Inbox {
  id: string
  email: string
  provider: string
  active: boolean
  lastScan: string | null
  createdAt: string
}

export function EmailClient() {
  const [showConnect, setShowConnect] = useState(false)
  const [provider, setProvider] = useState('gmail')
  const [form, setForm] = useState({ username: '', password: '', host: 'imap.gmail.com', port: 993 })
  const [connecting, setConnecting] = useState(false)
  const [scanning, setScanning] = useState<string | null>(null)
  const [demoScanning, setDemoScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [inboxes, setInboxes] = useState<Inbox[]>([])
  const [loading, setLoading] = useState(true)

  // Load connected inboxes on mount — no auto demo scan (user triggers manually)
  useEffect(() => { fetchInboxes() }, [])

  const fetchInboxes = async () => {
    try {
      const res = await fetch('/api/email/connect')
      if (res.ok) setInboxes(await res.json())
    } catch { /* silent — user sees empty list */ } finally { setLoading(false) }
  }

  const handleProviderChange = (id: string) => {
    setProvider(id)
    const p = PROVIDERS.find(pr => pr.id === id)
    if (p?.host) setForm(prev => ({ ...prev, host: p.host, port: p.port }))
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    try {
      const res = await fetch('/api/email/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.username, provider, host: form.host, port: form.port, username: form.username, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInboxes(prev => [data, ...prev])
      setShowConnect(false)
      toast({ title: 'Inbox connected!', description: `${form.username} is ready to scan.` })
      setForm({ username: '', password: '', host: 'imap.gmail.com', port: 993 })
    } catch (err: any) {
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' })
    } finally { setConnecting(false) }
  }

  const handleScan = async (inboxId: string) => {
    setScanning(inboxId)
    try {
      const res = await fetch('/api/email/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Scan complete', description: `Scanned ${data.scanned} emails · ${data.relevant} relevant · ${data.processed} candidates added` })
      fetchInboxes()
    } catch (err: any) {
      toast({ title: 'Scan failed', description: err.message, variant: 'destructive' })
    } finally { setScanning(null) }
  }

  // Demo scan is safe to run multiple times — the server uses upsert so no duplicates
  const runDemoScan = async () => {
    setDemoScanning(true)
    try {
      const res = await fetch('/api/email/demo-scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.processed > 0) {
        toast({ title: 'Demo scan complete', description: `${data.processed} new demo candidates added` })
      } else {
        toast({ title: 'Demo scan complete', description: 'All demo candidates already exist — no duplicates created.' })
      }
    } catch (err: any) {
      toast({ title: 'Demo scan failed', description: err.message, variant: 'destructive' })
    } finally { setDemoScanning(false) }
  }

  const cleanDuplicates = async () => {
    setCleaning(true)
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.deleted > 0) {
        toast({ title: 'Duplicates removed', description: `${data.deleted} duplicate candidate(s) deleted from your database.` })
      } else {
        toast({ title: 'No duplicates found', description: 'Your database is already clean.' })
      }
    } catch (err: any) {
      toast({ title: 'Cleanup failed', description: err.message, variant: 'destructive' })
    } finally { setCleaning(false) }
  }

  const handleDelete = async (inboxId: string) => {
    await fetch('/api/email/connect', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inboxId }) })
    setInboxes(prev => prev.filter(i => i.id !== inboxId))
    toast({ title: 'Inbox removed' })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-800">AI-Powered Email Inbox Scanning</p>
          <p className="text-sm text-blue-600 mt-0.5">
            Connect your recruitment inbox. The Claude AI agent automatically scans emails, identifies CVs and
            motivation letters, extracts candidate data, and matches them to your active vacancies.
          </p>
        </div>
      </div>

      {/* Demo scan — manual only, global email dedup prevents any duplicates */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-indigo-800">Demo Email Scan</p>
          <p className="text-sm text-indigo-600">
            Simulates 4 recruitment emails with attached CVs. Safe to run multiple times — no duplicates will ever be created.
          </p>
        </div>
        <Button
          onClick={runDemoScan}
          disabled={demoScanning}
          size="sm"
          className="gradient-bg shrink-0 gap-1.5"
        >
          {demoScanning ? <><Loader2 size={13} className="animate-spin" /> Scanning...</> : <><Scan size={13} /> Run Demo Scan</>}
        </Button>
      </div>

      {/* One-click duplicate cleanup — fixes databases that accumulated duplicates before the dedup fix */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
          <Eraser className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">Clean Duplicate Candidates</p>
          <p className="text-sm text-amber-700">
            If you see the same candidate multiple times, click here to remove all duplicates in one click.
          </p>
        </div>
        <Button
          onClick={cleanDuplicates}
          disabled={cleaning}
          size="sm"
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0 gap-1.5"
        >
          {cleaning ? <><Loader2 size={13} className="animate-spin" /> Cleaning...</> : <><Eraser size={13} /> Clean Duplicates</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Mail, title: 'Connect Inbox', desc: 'Link your recruitment email via IMAP. We use read-only access for security.' },
          { icon: Scan, title: 'AI Agent Scans', desc: 'Claude AI agent reads emails, detects CVs & motivation letters, ignores spam.' },
          { icon: CheckCircle, title: 'Auto-Match', desc: 'Candidates are created, analyzed, and matched to your active vacancies automatically.' },
        ].map((item, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center mb-3">
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Connected Inboxes</CardTitle>
          <Button onClick={() => setShowConnect(true)} size="sm" className="gradient-bg gap-1.5">
            <Plus size={14} /> Connect Inbox
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : inboxes.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No email inboxes connected yet</p>
              <p className="text-gray-400 text-xs mt-1">Connect a recruitment inbox to start automatic CV scanning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxes.map(inbox => (
                <div key={inbox.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{inbox.email}</p>
                    <p className="text-xs text-gray-400">
                      {inbox.provider} · Last scan: {inbox.lastScan ? formatRelativeTime(new Date(inbox.lastScan)) : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle size={11} /> Active
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleScan(inbox.id)} disabled={scanning === inbox.id} className="gap-1.5 text-xs h-8">
                      {scanning === inbox.id ? <><Loader2 size={12} className="animate-spin" /> Scanning...</> : <><RefreshCw size={12} /> Scan Now</>}
                    </Button>
                    <button onClick={() => handleDelete(inbox.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Email Inbox</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnect} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Email Provider</Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" placeholder="recruitment@company.com" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>App Password</Label>
              <Input type="password" placeholder="App-specific password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              <p className="text-xs text-gray-400">For Gmail: Settings → Security → 2-Step Verification → App Passwords.</p>
            </div>
            {provider === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>IMAP Host</Label>
                  <Input placeholder="imap.example.com" value={form.host} onChange={e => setForm(p => ({ ...p, host: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Port</Label>
                  <Input type="number" value={form.port} onChange={e => setForm(p => ({ ...p, port: parseInt(e.target.value) }))} required />
                </div>
              </div>
            )}
            <div className="p-3 bg-amber-50 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Credentials are stored securely. We only read attachments, never send emails or modify your inbox.</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowConnect(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={connecting} className="flex-1 gradient-bg">
                {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</> : 'Connect & Verify'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
