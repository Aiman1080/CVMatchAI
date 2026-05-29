'use client'
import { useState } from 'react'
import { User, Shield, Save, Trash2, Lock, Eye, EyeOff, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface Props {
  user: { id?: string; name?: string; email?: string; company?: string; subscription?: string; image?: string }
  isDemo?: boolean
}

const PLANS = [
  { id: 'free', name: 'Free', price: '€0', features: ['3 vacancies', '20 candidates/mo', 'AI analysis'] },
  { id: 'pro', name: 'Pro', price: '€55/mo', features: ['Unlimited vacancies', 'Unlimited candidates', 'AI interview questions', 'AI hiring reports', 'Email scanning', '14 ATS integrations', 'Analytics & export'], popular: true },
]

export function SettingsClient({ user, isDemo }: Props) {
  const { t } = useLanguage()
  // emailSignature is now managed in the Email tab (EmailClient) so it's
  // intentionally not part of this form — saving here would overwrite the
  // value the user just set in the dedicated Email tab card.
  const [form, setForm] = useState({ name: user.name || '', company: user.company || '', image: user.image || '' })
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  // Confirm dialog for the destructive "delete all candidates" action
  const [deleteAllDialog, setDeleteAllDialog] = useState(false)

  // Inline validation for the profile form — keeps users from losing context on errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const sp = (t.dashboard as any).settingsProfile
  const nameRequiredMsg = sp?.nameRequired || 'Please enter your name'
  const nameTooShortMsg = sp?.nameTooShort || 'Name must be at least 2 characters'

  const validateProfile = (f: typeof form): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!f.name.trim()) next.name = nameRequiredMsg
    else if (f.name.trim().length < 2) next.name = nameTooShortMsg
    return next
  }

  const setProfileField = (key: keyof typeof form, value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (touched[key]) {
      const all = validateProfile(next)
      setErrors(prev => {
        const n = { ...prev }
        if (all[key]) n[key] = all[key]
        else delete n[key]
        return n
      })
    }
  }

  const markProfileTouched = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const all = validateProfile(form)
    setErrors(prev => {
      const n = { ...prev }
      if (all[key]) n[key] = all[key]
      else delete n[key]
      return n
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true })
    const all = validateProfile(form)
    if (Object.keys(all).length > 0) {
      setErrors(all)
      toast({ title: sp?.fixErrors || 'Please fix the highlighted fields', description: sp?.fixErrorsDesc || 'Some required fields are missing or invalid.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t.dashboard.settingsPage.errorSaving)
      }
      toast({ title: t.dashboard.settingsProfile.saved })
    } catch (err: any) {
      toast({
        title: t.dashboard.settingsPage.errorSaving,
        description: err.message && err.message !== t.dashboard.settingsPage.errorSaving ? err.message : undefined,
        variant: 'destructive',
      })
    } finally { setSaving(false) }
  }

  // Password strength helpers — match the server-side requirements (min 8, uppercase, number, symbol)
  const pwHasLength = pwForm.newPassword.length >= 8
  const pwHasUpper = /[A-Z]/.test(pwForm.newPassword)
  const pwHasNumber = /[0-9]/.test(pwForm.newPassword)
  const pwHasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwForm.newPassword)
  const pwIsStrong = pwHasLength && pwHasUpper && pwHasNumber && pwHasSymbol
  const pwIsMedium = pwHasLength && ((pwHasUpper && pwHasNumber) || (pwHasUpper && pwHasSymbol) || (pwHasNumber && pwHasSymbol))

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) {
      toast({
        title: t.dashboard.settingsPassword.noMatch,
        description: (sp as any)?.passwordMismatchDesc || 'Make sure both new password fields match exactly.',
        variant: 'destructive',
      })
      return
    }
    if (!pwIsStrong) {
      toast({
        title: t.dashboard.settingsPassword.tooShort,
        description: (sp as any)?.passwordRequirementsDesc || 'Password must be at least 8 characters and include an uppercase letter, a number, and a symbol.',
        variant: 'destructive',
      })
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
        throw new Error(data.error || t.dashboard.settingsPage.errorChangingPassword)
      }
      toast({ title: t.dashboard.settingsPassword.updated })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err: any) {
      toast({
        title: t.dashboard.settingsPage.errorChangingPassword,
        description: err.message && err.message !== t.dashboard.settingsPage.errorChangingPassword ? err.message : undefined,
        variant: 'destructive',
      })
    } finally { setPwSaving(false) }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="dark:bg-gray-800 flex-wrap h-auto gap-1">
        <TabsTrigger value="profile" className="whitespace-normal text-center leading-tight h-auto py-1.5">{t.dashboard.settingsTabs.profile}</TabsTrigger>
        <TabsTrigger value="subscription" className="whitespace-normal text-center leading-tight h-auto py-1.5">{t.dashboard.settingsTabs.subscription}</TabsTrigger>
        <TabsTrigger value="privacy" className="whitespace-normal text-center leading-tight h-auto py-1.5">{t.dashboard.settingsTabs.privacy}</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        {/* Profile info */}
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white min-w-0"><User className="w-4 h-4 shrink-0" /><span className="break-words min-w-0">{t.dashboard.settingsProfile.title}</span></CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {isDemo && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-400 break-words">
                  {(sp as any)?.demoCannotModify || 'Demo accounts cannot modify profile settings.'}
                </div>
              )}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {form.image && <AvatarImage src={form.image} alt={form.name || 'Avatar'} />}
                  <AvatarFallback className="text-lg gradient-bg text-white font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Camera size={14} /> {(sp as any)?.profilePhotoUrl || 'Profile Photo URL'}</Label>
                  <Input
                    value={form.image}
                    onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    disabled={isDemo}
                    className={isDemo ? 'opacity-60' : ''}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">{t.dashboard.settingsProfile.fullName}</Label>
                <Input
                  value={form.name}
                  onChange={e => setProfileField('name', e.target.value)}
                  onBlur={() => markProfileTouched('name')}
                  aria-invalid={!!errors.name}
                  disabled={isDemo}
                  className={`${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''} ${isDemo ? 'opacity-60' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500" role="alert">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">{t.dashboard.settingsProfile.email}</Label>
                <Input value={user.email || ''} disabled className="opacity-60" />
                <p className="text-xs text-gray-400">{t.dashboard.settingsProfile.emailNote}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">{t.dashboard.settingsProfile.company}</Label>
                <Input
                  value={form.company}
                  onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  placeholder={t.dashboard.settingsProfile.companyPlaceholder}
                  disabled={isDemo}
                  className={isDemo ? 'opacity-60' : ''}
                />
              </div>
              <Button type="submit" disabled={saving || isDemo} className="gradient-bg gap-2 h-auto py-2 whitespace-normal text-center leading-tight"><Save size={14} className="shrink-0" />{saving ? t.dashboard.settingsProfile.saving : t.dashboard.settingsProfile.saveChanges}</Button>
            </form>
          </CardContent>
        </Card>

        {/* Your personal account — security and personalization */}
        {(() => {
          const pw = (t.dashboard as any).personalWorkspace || {}
          const explanationTemplate = pw.explanation || 'This is your unique workspace identifier. Other users {bold} access your vacancies or candidates — every page is protected by your session and personalized to you.'
          const explanationParts = explanationTemplate.split('{bold}')
          return (
            <Card className="border border-gray-100 dark:border-gray-800 shadow-none max-w-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" /> {pw.title || 'Your personal workspace'}
                </CardTitle>
                <CardDescription>
                  {pw.description || 'Your data is fully isolated from other users. Each account has its own unique secure workspace.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{pw.accountIdLabel || 'Your account ID'}</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                      {user.id || '—'}
                    </code>
                    {user.id && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.id!)
                          toast({ title: pw.copied || 'Copied to clipboard' })
                        }}
                        className="px-3 py-2 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 font-medium shrink-0"
                      >
                        {pw.copy || 'Copy'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {explanationParts[0]}<strong>{pw.explanationBold || 'cannot'}</strong>{explanationParts[1] ?? ''}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <span>✓</span> {pw.encryptedData || 'Encrypted data'}
                  </div>
                  <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <span>✓</span> {pw.privateWorkspace || 'Private workspace'}
                  </div>
                  <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <span>✓</span> {pw.sessionProtected || 'Session-protected'}
                  </div>
                  <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <span>✓</span> {pw.gdprCompliant || 'GDPR compliant'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Language */}
        <Card className="border border-gray-100 dark:border-gray-800 shadow-none max-w-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-lg">🌐</span> {t.dashboard.settings.language}
            </CardTitle>
            <CardDescription>{t.dashboard.settings.languageDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        {/* Password change — hidden for demo accounts */}
        {!isDemo && <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white min-w-0">
              <Lock className="w-4 h-4 shrink-0" /> <span className="break-words min-w-0">{t.dashboard.settingsPassword.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">{t.dashboard.settingsPassword.current}</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder={t.dashboard.settingsPassword.currentPlaceholder}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">{t.dashboard.settingsPassword.new}</Label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder={t.dashboard.settingsPassword.newPlaceholder}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwForm.newPassword.length > 0 && (
                  <div className="space-y-1 mt-1">
                    <p className={`text-xs ${pwIsStrong ? 'text-green-600' : pwIsMedium ? 'text-amber-500' : 'text-red-500'}`}>
                      {!pwHasLength ? t.auth.tooShort : pwIsStrong ? t.auth.strong : t.auth.weak}
                    </p>
                    <div className="flex gap-1 text-xs text-gray-400">
                      <span className={pwHasUpper ? 'text-green-500' : ''}>ABC</span>
                      <span>·</span>
                      <span className={pwHasNumber ? 'text-green-500' : ''}>123</span>
                      <span>·</span>
                      <span className={pwHasSymbol ? 'text-green-500' : ''}>!@#</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">{t.dashboard.settingsPassword.confirm}</Label>
                <Input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder={t.dashboard.settingsPassword.confirmPlaceholder}
                />
              </div>
              <Button type="submit" variant="outline" disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm} className="gap-2 dark:border-gray-700 dark:text-gray-300 h-auto py-2 whitespace-normal text-center leading-tight">
                <Lock size={14} className="shrink-0" />{pwSaving ? t.dashboard.settingsPassword.updating : t.dashboard.settingsPassword.update}
              </Button>
            </form>
          </CardContent>
        </Card>}
      </TabsContent>

      <TabsContent value="subscription">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 break-words">{t.dashboard.settingsPage.currentPlan} <span className="font-semibold text-blue-600 capitalize">{user.subscription || 'free'}</span></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANS.map(plan => (
              <Card key={plan.id} className={`border-0 shadow-sm ${(plan as any).popular ? 'ring-2 ring-blue-500' : ''} ${user.subscription === plan.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white break-words">{plan.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1 break-words">{plan.price}</p>
                  <ul className="space-y-2 my-4">{plan.features.map((f, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2 break-words"><span className="text-green-500 shrink-0">✓</span><span className="min-w-0">{f}</span></li>)}</ul>
                  {user.subscription === plan.id ? <Button variant="outline" className="w-full dark:border-gray-700 h-auto py-2 whitespace-normal text-center leading-tight" disabled>{t.dashboard.settingsPage.currentPlanBtn}</Button> : <Link href="/upgrade"><Button className="w-full gradient-bg h-auto py-2 whitespace-normal text-center leading-tight">{t.dashboard.settingsPage.upgradeBtn}</Button></Link>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="privacy">
        <div className="max-w-2xl space-y-4">
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white min-w-0"><Shield className="w-4 h-4 shrink-0" /><span className="break-words min-w-0">{t.dashboard.settingsPage.gdprTitle}</span></CardTitle>
              <CardDescription className="break-words">{t.dashboard.settingsPage.gdprDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1 break-words">{t.dashboard.settingsPage.gdprCompliance}</p>
                <p className="text-sm text-green-700 dark:text-green-400 break-words">{t.dashboard.settingsPage.gdprComplianceDesc}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 break-words">{t.dashboard.settingsPage.dataRetention}</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800"><span className="min-w-0 break-words">{t.dashboard.settingsPage.cvFiles}</span><span className="font-medium shrink-0 break-words">{t.dashboard.settingsPage.cvFilesRetention}</span></div>
                  <div className="flex justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800"><span className="min-w-0 break-words">{t.dashboard.settingsPage.contactData}</span><span className="font-medium shrink-0 break-words">{t.dashboard.settingsPage.contactDataRetention}</span></div>
                  <div className="flex justify-between gap-2 py-2"><span className="min-w-0 break-words">{t.dashboard.settingsPage.aiResults}</span><span className="font-medium shrink-0 break-words">{t.dashboard.settingsPage.aiResultsRetention}</span></div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2 break-words">{t.dashboard.settingsPage.dataRights}</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="w-full justify-start dark:border-gray-700 dark:text-gray-300 h-auto py-2 whitespace-normal text-left leading-tight"
                    onClick={async () => {
                      setExporting(true)
                      try {
                        const res = await fetch('/api/user/export')
                        if (!res.ok) throw new Error('Export failed')
                        const blob = await res.blob()
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = `deltamatch-export-${new Date().toISOString().slice(0, 10)}.json`
                        a.click()
                        toast({ title: t.dashboard.settingsPage.dataExported })
                      } catch {
                        toast({
                          title: t.dashboard.settingsPage.exportFailed,
                          description: (t.dashboard.settingsPage as any).checkConnectionRetry || 'Please check your connection and try again.',
                          variant: 'destructive',
                        })
                      } finally { setExporting(false) }
                    }}
                  >
                    {exporting ? t.dashboard.settingsPage.exportingData : t.dashboard.settingsPage.exportAllData}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingAll || isDemo}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-300 dark:border-gray-700 h-auto py-2 whitespace-normal text-left leading-tight"
                    onClick={() => setDeleteAllDialog(true)}
                  >
                    <Trash2 size={14} className="mr-2 shrink-0" />
                    {deletingAll ? t.dashboard.settingsPage.deletingData : t.dashboard.settingsPage.deleteAllData}
                  </Button>
                  {isDemo && <p className="text-xs text-amber-600 break-words">{(sp as any)?.demoCannotModify || 'Demo accounts cannot modify data.'}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Confirm dialog for the destructive "delete all candidates" action */}
      <ConfirmDialog
        open={deleteAllDialog}
        onConfirm={async () => {
          setDeleteAllDialog(false)
          setDeletingAll(true)
          try {
            const res = await fetch('/api/candidates/delete-all', { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
              toast({
                title: t.dashboard.settingsPage.candidatesDeletedDesc.replace('{count}', String(data.deleted)),
                description: t.dashboard.settingsPage.allDataRemoved,
              })
            } else {
              toast({
                title: t.dashboard.settingsPage.deleteFailed,
                description: data.error || (t.dashboard.settingsPage as any).refreshRetry || 'Please refresh the page and try again.',
                variant: 'destructive',
              })
            }
          } catch {
            toast({
              title: t.dashboard.settingsPage.deleteFailed,
              description: (t.dashboard.settingsPage as any).checkConnectionRetry || 'Please check your connection and try again.',
              variant: 'destructive',
            })
          } finally { setDeletingAll(false) }
        }}
        onCancel={() => setDeleteAllDialog(false)}
        title={(t.dashboard.settingsPage as any).deleteAllTitle || 'Delete all candidate data?'}
        description={(t.dashboard.settingsPage as any).deleteAllDescription || t.dashboard.settingsPage.deleteConfirm}
        confirmText={(t.dashboard.settingsPage as any).deleteAllConfirm || 'Delete all data'}
        variant="destructive"
      />
    </Tabs>
  )
}
