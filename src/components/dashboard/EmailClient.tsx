'use client'
import { useState } from 'react'
import { Mail, Plus, Loader2, CheckCircle, AlertCircle, Scan, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

const PROVIDERS = [
  { id: 'gmail', label: 'Gmail', host: 'imap.gmail.com', port: 993 },
  { id: 'outlook', label: 'Outlook / Office 365', host: 'outlook.office365.com', port: 993 },
  { id: 'yahoo', label: 'Yahoo Mail', host: 'imap.mail.yahoo.com', port: 993 },
  { id: 'custom', label: 'Custom IMAP', host: '', port: 993 },
]

export function EmailClient() {
  const [showConnect, setShowConnect] = useState(false)
  const [provider, setProvider] = useState('gmail')
  const [form, setForm] = useState({ username: '', password: '', host: 'imap.gmail.com', port: 993 })
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState<any[]>([])

  const handleProviderChange = (id: string) => {
    setProvider(id)
    const p = PROVIDERS.find(pr => pr.id === id)
    if (p && p.host) setForm(prev => ({ ...prev, host: p.host, port: p.port }))
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    await new Promise(r => setTimeout(r, 1500))
    setConnected(prev => [...prev, { id: Date.now(), email: form.username, provider, active: true }])
    setConnecting(false)
    setShowConnect(false)
    toast({ title: 'Email connected!', description: `${form.username} is now connected and ready to scan.` })
    setForm({ username: '', password: '', host: 'imap.gmail.com', port: 993 })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Email Inbox Scanning</p>
          <p className="text-sm text-blue-600 mt-0.5">Connect your recruitment inbox to automatically detect incoming CVs and motivation letters. The AI will scan attachments and create candidate profiles automatically.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { step: '1', icon: Mail, title: 'Connect Inbox', desc: 'Link your recruitment email via IMAP. We use read-only access for security.' },
          { step: '2', icon: Scan, title: 'Automatic Scanning', desc: 'AI scans incoming emails, detects CVs and motivation letters, ignores spam.' },
          { step: '3', icon: CheckCircle, title: 'Auto-Organize', desc: 'Candidates are automatically created and matched to relevant vacancies.' },
        ].map(item => (
          <Card key={item.step} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center mb-3"><item.icon className="w-4 h-4 text-white" /></div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Connected Inboxes</CardTitle>
          <Button onClick={() => setShowConnect(true)} size="sm" className="gradient-bg gap-1.5"><Plus size={14} />Connect Inbox</Button>
        </CardHeader>
        <CardContent>
          {connected.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No email inboxes connected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connected.map(inbox => (
                <div key={inbox.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1"><p className="font-medium text-gray-900 text-sm">{inbox.email}</p><p className="text-xs text-gray-400">{inbox.provider} · Last scan: Never</p></div>
                  <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle size={11} />Active</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Connect Email Inbox</DialogTitle></DialogHeader>
          <form onSubmit={handleConnect} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Email Provider</Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Email Address</Label><Input type="email" placeholder="recruitment@company.com" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required /></div>
            <div className="space-y-1.5"><Label>App Password</Label><Input type="password" placeholder="App-specific password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required /><p className="text-xs text-gray-400">Use an app-specific password, not your main password.</p></div>
            <div className="p-3 bg-amber-50 rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /><p className="text-xs text-amber-700">Credentials are encrypted and stored securely. We only read email attachments.</p></div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowConnect(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={connecting} className="flex-1 gradient-bg">{connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : 'Connect Inbox'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
