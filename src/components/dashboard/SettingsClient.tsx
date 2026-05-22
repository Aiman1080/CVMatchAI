'use client'
import { useState } from 'react'
import { User, Shield, Save, Trash2, Plug, Lock, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { IntegrationsClient } from './IntegrationsClient'

interface Props {
  user: { name?: string; email?: string; company?: string; subscription?: string }
  integrations: any[]
}

const PLANS = [
  { id: 'free', name: 'Free', price: '€0', features: ['5 vacancies', '50 candidates', 'AI analysis'] },
  { id: 'pro', name: 'Pro', price: '€49/mo', features: ['Unlimited vacancies', '500 candidates/mo', 'Email scanning', 'Priority support'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Unlimited everything', 'Custom AI models', 'API access', 'Dedicated support'] },
]

export function SettingsClient({ user, integrations }: Props) {
  const [form, setForm] = useState({ name: user.name || '', company: user.company || '' })
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Save failed')
      }
      toast({ title: 'Settings saved!' })
    } catch (err: any) {
      toast({ title: err.message || 'Error saving settings', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Password change failed')
      }
      toast({ title: 'Password updated!' })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err: any) {
      toast({ title: err.message || 'Error changing password', variant: 'destructive' })
    } finally { setPwSaving(false) }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="dark:bg-gray-800">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="integrations" className="gap-1.5"><Plug size={13} />Intégrations ATS</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
        <TabsTrigger value="privacy">Privacy & GDPR</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        {/* Profile info */}
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white"><User className="w-4 h-4" />Profile Settings</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Full Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                <Input value={user.email || ''} disabled className="opacity-60" />
                <p className="text-xs text-gray-400">Email cannot be changed</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Company</Label>
                <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Your company name" />
              </div>
              <Button type="submit" disabled={saving} className="gradient-bg gap-2"><Save size={14} />{saving ? 'Saving...' : 'Save Changes'}</Button>
            </form>
          </CardContent>
        </Card>

        {/* Password change */}
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
              <Lock className="w-4 h-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Minimum 8 characters"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Confirm New Password</Label>
                <Input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat your new password"
                />
              </div>
              <Button type="submit" variant="outline" disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm} className="gap-2 dark:border-gray-700 dark:text-gray-300">
                <Lock size={14} />{pwSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations">
        <div className="max-w-2xl">
          <IntegrationsClient initialIntegrations={integrations} />
        </div>
      </TabsContent>

      <TabsContent value="subscription">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Current plan: <span className="font-semibold text-blue-600 capitalize">{user.subscription || 'free'}</span></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <Card key={plan.id} className={`border-0 shadow-sm ${(plan as any).popular ? 'ring-2 ring-blue-500' : ''} ${user.subscription === plan.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{plan.price}</p>
                  <ul className="space-y-2 my-4">{plan.features.map((f, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>)}</ul>
                  {user.subscription === plan.id ? <Button variant="outline" className="w-full dark:border-gray-700" disabled>Current Plan</Button> : <Link href="/upgrade"><Button className="w-full gradient-bg">Upgrade</Button></Link>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="privacy">
        <div className="max-w-2xl space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white"><Shield className="w-4 h-4" />GDPR & Data Privacy</CardTitle>
              <CardDescription>Manage how candidate data is stored and processed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">GDPR Compliance</p>
                <p className="text-sm text-green-700 dark:text-green-400">CVMatch AI is fully GDPR compliant. All candidate data is encrypted, stored securely in EU data centers, and automatically deleted after your configured retention period.</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Data Retention Policy</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800"><span>CV Files</span><span className="font-medium">90 days after rejection</span></div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800"><span>Contact Data</span><span className="font-medium">1 year from last activity</span></div>
                  <div className="flex justify-between py-2"><span>AI Analysis Results</span><span className="font-medium">2 years</span></div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Data Processing Rights</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start dark:border-gray-700 dark:text-gray-300">Export All My Data (GDPR Article 20)</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-300 dark:border-gray-700"><Trash2 size={14} className="mr-2" />Delete All Candidate Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
