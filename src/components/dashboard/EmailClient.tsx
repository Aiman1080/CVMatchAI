'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Plus, Loader2, CheckCircle, AlertCircle, Scan, Info, Trash2, RefreshCw, Zap, Eraser, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { useDemoMode } from '@/hooks/useDemoGuard'
import { formatRelativeTime } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

// Preset IMAP settings for common providers
const PROVIDER_PRESETS = {
  gmail: { label: 'Gmail', host: 'imap.gmail.com', port: 993, providerKey: 'gmail' },
  outlook: { label: 'Outlook / Office 365', host: 'outlook.office365.com', port: 993, providerKey: 'outlook' },
  other: { label: 'Other', host: '', port: 993, providerKey: 'custom' },
} as const

type ProviderChoice = keyof typeof PROVIDER_PRESETS

interface Inbox {
  id: string
  email: string
  provider: string
  active: boolean
  lastScan: string | null
  createdAt: string
}

export function EmailClient() {
  const { t } = useLanguage()
  const te = t.dashboard.email
  const isDemo = useDemoMode()
  const [showConnect, setShowConnect] = useState(false)
  // Step 1: choose provider, Step 2: enter credentials
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedProvider, setSelectedProvider] = useState<ProviderChoice | null>(null)
  const [form, setForm] = useState({ email: '', password: '', host: '', port: 993 })
  const [connecting, setConnecting] = useState(false)
  const [scanning, setScanning] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanTimer, setScanTimer] = useState<number>(0)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [demoScanning, setDemoScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [inboxes, setInboxes] = useState<Inbox[]>([])
  const [loading, setLoading] = useState(true)
  // Email signature / footer — managed here so recruiters can configure it in the Email tab
  const [signature, setSignature] = useState('')
  const [signatureSaved, setSignatureSaved] = useState(true)
  const [savingSignature, setSavingSignature] = useState(false)

  // Load connected inboxes + current signature on mount — no auto demo scan (user triggers manually)
  useEffect(() => {
    fetchInboxes()
    fetch('/api/user')
      .then(r => (r.ok ? r.json() : null))
      .then(u => { if (u?.emailSignature !== undefined) setSignature(u.emailSignature || '') })
      .catch(() => {})
  }, [])

  const fetchInboxes = async () => {
    try {
      const res = await fetch('/api/email/connect')
      if (res.ok) setInboxes(await res.json())
    } catch { /* silent — user sees empty list */ } finally { setLoading(false) }
  }

  const handleSaveSignature = async () => {
    if (isDemo) { toast({ title: (te as any).demoCannotSave || 'Demo mode — cannot save', variant: 'destructive' }); return }
    setSavingSignature(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSignature: signature }),
      })
      if (res.ok) {
        setSignatureSaved(true)
        toast({ title: (te as any).signatureSaved || 'Email signature saved' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || (te as any).saveFailed || 'Save failed', variant: 'destructive' })
      }
    } finally {
      setSavingSignature(false)
    }
  }

  const openConnectDialog = () => {
    setStep(1)
    setSelectedProvider(null)
    setForm({ email: '', password: '', host: '', port: 993 })
    setShowConnect(true)
  }

  const selectProvider = (choice: ProviderChoice) => {
    setSelectedProvider(choice)
    const preset = PROVIDER_PRESETS[choice]
    setForm(prev => ({ ...prev, host: preset.host, port: preset.port }))
    setStep(2)
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider) return
    setConnecting(true)
    const preset = PROVIDER_PRESETS[selectedProvider]
    // For Gmail/Outlook username = email; for Other the user can enter independently
    const username = form.email
    try {
      const res = await fetch('/api/email/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          provider: preset.providerKey,
          host: form.host,
          port: form.port,
          username,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInboxes(prev => [data, ...prev])
      setShowConnect(false)
      toast({ title: te.inboxConnected, description: te.readyToScan.replace('{email}', form.email) })
      setForm({ email: '', password: '', host: '', port: 993 })
      setStep(1)
      setSelectedProvider(null)
    } catch (err: any) {
      // Surface why the connection failed and what to do
      const description = err?.message
        ? `${err.message} — ${te.connectionErrorTip}`
        : te.connectionGenericError
      toast({ title: te.connectionFailed, description, variant: 'destructive' })
    } finally { setConnecting(false) }
  }

  const handleScan = async (inboxId: string) => {
    setScanning(inboxId)
    setScanProgress(0)
    setScanTimer(0)
    // Fake progress: slowly fills to 95% while the scan is running. Reaches 100%
    // only when the server actually responds. Estimated scan duration: ~90s.
    const startTime = Date.now()
    scanIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setScanTimer(elapsed)
      // Approach 95% asymptotically — never quite reach it from progress alone
      setScanProgress(prev => Math.min(95, prev + (95 - prev) * 0.02))
    }, 500)

    // Warn user if they try to leave during scan
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)

    try {
      const res = await fetch('/api/email/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setScanProgress(100)
      // Show the diagnostic from the server — it explains 0-result cases clearly
      toast({
        title: te.scanComplete,
        description: data.diagnostic || te.scanDesc.replace('{scanned}', data.scanned).replace('{relevant}', data.relevant).replace('{processed}', data.processed),
      })
      fetchInboxes()
    } catch (err: any) {
      const description = err?.message
        ? `${err.message} — ${te.scanCredentialsTip}`
        : te.scanGenericError
      toast({ title: te.scanFailed, description, variant: 'destructive' })
    } finally {
      window.removeEventListener('beforeunload', beforeUnload)
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      // Small delay so user sees 100% before the bar disappears
      setTimeout(() => {
        setScanning(null)
        setScanProgress(0)
        setScanTimer(0)
      }, 800)
    }
  }

  // Demo scan is safe to run multiple times — the server uses upsert so no duplicates
  const runDemoScan = async () => {
    setDemoScanning(true)
    try {
      const res = await fetch('/api/email/demo-scan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.processed > 0) {
        toast({ title: te.demoScanComplete, description: te.demoNewCandidates.replace('{count}', String(data.processed)) })
      } else {
        toast({ title: te.demoScanComplete, description: te.demoAllExist })
      }
    } catch (err: any) {
      toast({ title: te.demoScanFailed, description: err.message, variant: 'destructive' })
    } finally { setDemoScanning(false) }
  }

  const cleanDuplicates = async () => {
    setCleaning(true)
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.deleted > 0) {
        toast({ title: te.duplicatesRemoved, description: te.duplicatesRemovedDesc.replace('{count}', String(data.deleted)) })
      } else {
        toast({ title: te.noDuplicates, description: te.noDuplicatesDesc })
      }
    } catch (err: any) {
      toast({ title: te.cleanupFailed, description: err.message, variant: 'destructive' })
    } finally { setCleaning(false) }
  }

  const handleDelete = async (inboxId: string) => {
    try {
      const res = await fetch('/api/email/connect', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: inboxId }) })
      if (res.ok) {
        setInboxes(prev => prev.filter(i => i.id !== inboxId))
        toast({ title: te.inboxRemoved })
      } else {
        toast({ title: te.removeInboxFailed, description: te.removeInboxRefresh, variant: 'destructive' })
      }
    } catch {
      toast({ title: te.removeInboxFailed, description: te.removeInboxConnection, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800 break-words">{te.bannerTitle}</p>
          <p className="text-sm text-blue-600 mt-0.5 break-words">
            {te.bannerDesc}
          </p>
        </div>
      </div>

      {/* Demo scan — only visible for demo accounts */}
      {isDemo && <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 flex flex-wrap items-center gap-4">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 break-words">{te.demoTitle}</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 break-words">
            {te.demoDesc}
          </p>
        </div>
        <Button
          onClick={runDemoScan}
          disabled={demoScanning}
          size="sm"
          className="gradient-bg shrink-0 gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight"
        >
          {demoScanning ? <><Loader2 size={13} className="animate-spin shrink-0" /> {te.scanning}</> : <><Scan size={13} className="shrink-0" /> {te.runDemoScan}</>}
        </Button>
      </div>}

      {/* One-click duplicate cleanup — fixes databases that accumulated duplicates before the dedup fix */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 flex flex-wrap items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
          <Eraser className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 break-words">{te.cleanTitle}</p>
          <p className="text-sm text-amber-700 break-words">
            {te.cleanDesc}
          </p>
        </div>
        <Button
          onClick={cleanDuplicates}
          disabled={cleaning}
          size="sm"
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0 gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight"
        >
          {cleaning ? <><Loader2 size={13} className="animate-spin shrink-0" /> {te.cleaning}</> : <><Eraser size={13} className="shrink-0" /> {te.cleanDuplicates}</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Mail, title: te.connectInboxTitle, desc: te.connectInboxDesc },
          { icon: Scan, title: te.aiScansTitle, desc: te.aiScansDesc },
          { icon: CheckCircle, title: te.autoMatchTitle, desc: te.autoMatchDesc },
        ].map((item, i) => (
          <Card key={i} className="border border-gray-200 shadow-sm dark:border-gray-800">
            <CardContent className="p-5">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center mb-3">
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 break-words">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed break-words">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live scan progress — appears only while a scan is in flight */}
      {scanning && (
        <Card className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-950/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 break-words">
                  Scanning your inbox… please don&apos;t close this page
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 break-words">
                  Connecting to IMAP, downloading attachments, and running AI analysis on each application.
                  This typically takes 30 seconds to 3 minutes depending on inbox size.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-blue-700 dark:text-blue-300">Elapsed</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-200 font-mono">
                  {Math.floor(scanTimer / 60).toString().padStart(2, '0')}:{(scanTimer % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 text-right">
              {Math.round(scanProgress)}%
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-2">
          <CardTitle className="text-base break-words min-w-0">{te.connectedInboxes}</CardTitle>
          <Button onClick={openConnectDialog} size="sm" className="gradient-bg gap-1.5 w-full sm:w-auto h-auto py-2 whitespace-normal text-center leading-tight">
            <Plus size={14} className="shrink-0" /> {te.connectInbox}
          </Button>
        </CardHeader>
        {inboxes.length > 0 && (
          <div className="px-6 pb-3 -mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed break-words">
              ℹ️ {(te as any).scanInfo || 'Each scan reads the 25 most recent emails. Detected candidates are assigned to the active vacancy with the highest AI fit score.'}
            </p>
          </div>
        )}
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <p className="text-xs text-gray-400">{te.loadingInboxes}</p>
            </div>
          ) : inboxes.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 break-words">{te.noInboxes}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4 break-words">{te.noInboxesDesc}</p>
              <Button onClick={openConnectDialog} size="sm" className="gradient-bg gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight">
                <Plus size={14} className="shrink-0" /> {(te as any).connectFirstInbox || te.connectInbox}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxes.map(inbox => (
                <div key={inbox.id} className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{inbox.email}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {inbox.provider} · {te.lastScan} {inbox.lastScan ? formatRelativeTime(new Date(inbox.lastScan)) : te.never}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap ml-auto">
                    <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full break-words">
                      <CheckCircle size={11} className="shrink-0" /> {te.active}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleScan(inbox.id)} disabled={scanning === inbox.id} className="gap-1.5 text-xs h-auto py-1.5 whitespace-normal text-center leading-tight">
                      {scanning === inbox.id ? <><Loader2 size={12} className="animate-spin shrink-0" /> {te.scanning}</> : <><RefreshCw size={12} className="shrink-0" /> {te.scanNow}</>}
                    </Button>
                    <button onClick={() => handleDelete(inbox.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email signature / footer — applied to every email sent to candidates */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" />
            {(te as any).signatureTitle || 'Email signature & logo'}
          </CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
            {(te as any).signatureDesc || 'Appended to every email you send to candidates. Supports HTML — paste an <img> tag to add your company logo.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={signature}
            onChange={e => { setSignature(e.target.value); setSignatureSaved(false) }}
            placeholder={(te as any).signaturePlaceholder || 'Best regards,\nJohn Doe | Acme Corp\n+32 471 000 000\n<img src="https://your-company.com/logo.png" width="150" alt="Company Logo">'}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
            disabled={isDemo}
          />
          {signature && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                {(te as any).signaturePreview || 'Preview'}
              </p>
              <div
                className="text-sm text-gray-700 dark:text-gray-300 break-words"
                dangerouslySetInnerHTML={{ __html: signature }}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-400 break-words flex-1 min-w-0">
              {(te as any).signatureHelp || 'Tip: host your logo on a public URL (your website, Imgur, Cloudinary) and reference it with <img src="...">.'}
            </p>
            <Button
              onClick={handleSaveSignature}
              disabled={savingSignature || signatureSaved || isDemo}
              size="sm"
              className="gradient-bg gap-2 h-auto py-2 whitespace-normal text-center leading-tight shrink-0"
            >
              {savingSignature ? <Loader2 size={14} className="animate-spin shrink-0" /> : <CheckCircle size={14} className="shrink-0" />}
              {savingSignature
                ? ((te as any).signatureSaving || 'Saving...')
                : signatureSaved
                  ? ((te as any).signatureSavedLabel || 'Saved')
                  : ((te as any).signatureSave || 'Save signature')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{te.connectEmailInbox}</DialogTitle>
          </DialogHeader>

          {/* --- Step 1: Choose provider --- */}
          {step === 1 && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-gray-500">{te.chooseProvider}</p>
              <div className="grid grid-cols-1 gap-3">
                {/* Gmail card */}
                <button
                  type="button"
                  onClick={() => selectProvider('gmail')}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">G</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white break-words">Gmail</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{te.gmailDesc}</p>
                  </div>
                </button>

                {/* Outlook card */}
                <button
                  type="button"
                  onClick={() => selectProvider('outlook')}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">O</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white break-words">Outlook / Office 365</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{te.outlookDesc}</p>
                  </div>
                </button>

                {/* Other card */}
                <button
                  type="button"
                  onClick={() => selectProvider('other')}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white break-words">{te.otherLabel}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{te.otherDesc}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* --- Step 2: Credentials --- */}
          {step === 2 && selectedProvider && (
            <form onSubmit={handleConnect} className="space-y-4 mt-2">
              {/* Back link */}
              <button
                type="button"
                onClick={() => { setStep(1); setSelectedProvider(null) }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={14} /> {te.changeProvider}
              </button>

              {/* Selected provider badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedProvider === 'gmail' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  selectedProvider === 'outlook' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                  'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {selectedProvider === 'other'
                    ? <Mail className="w-4 h-4 text-white" />
                    : <span className="text-white font-bold text-sm">{selectedProvider === 'gmail' ? 'G' : 'O'}</span>
                  }
                </div>
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {PROVIDER_PRESETS[selectedProvider].label}
                </span>
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <Label>{te.emailAddress}</Label>
                <Input
                  type="email"
                  placeholder="recruitment@company.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <Label>
                  {selectedProvider === 'gmail' ? te.appPassword : te.password}
                </Label>
                <Input
                  type="password"
                  placeholder={selectedProvider === 'gmail' ? te.appPasswordPlaceholder : te.passwordPlaceholder}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>

              {/* Provider-specific help boxes */}
              {selectedProvider === 'gmail' && (
                <HelpGuide
                  title={te.gmailHelpTitle}
                  steps={[
                    <>{te.gmailStep1Prefix}<a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{te.gmailStep1Link}</a></>,
                    te.gmailStep2,
                    <>{te.gmailStep3Prefix}<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{te.gmailStep3Link}</a>{te.gmailStep3Suffix}</>,
                    te.gmailStep4,
                  ]}
                />
              )}
              {selectedProvider === 'outlook' && (
                <HelpGuide
                  title={te.outlookHelpTitle}
                  steps={[
                    te.outlookStep1,
                    te.outlookStep2,
                  ]}
                />
              )}

              {/* Manual IMAP fields + help guide for "Other" */}
              {selectedProvider === 'other' && (
                <>
                  <HelpGuide
                    title={(te as any).imapHelpTitle || 'How to set up custom IMAP'}
                    steps={[
                      (te as any).imapStep1 || 'Enable IMAP access in your email provider settings.',
                      <>
                        {(te as any).imapStep2 || 'Find the IMAP host in your provider docs. Common ones:'}
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed break-words">
                          {(te as any).imapStep2Examples || 'Yahoo: imap.mail.yahoo.com · iCloud: imap.mail.me.com · OVH: ssl0.ovh.net · Infomaniak: mail.infomaniak.com · Zoho: imap.zoho.eu'}
                        </div>
                      </>,
                      (te as any).imapStep3 || 'Port is almost always 993 (SSL/TLS).',
                      (te as any).imapStep4 || 'Username is usually your full email address.',
                      (te as any).imapStep5 || 'Password is your mailbox password (or App Password if 2FA is on).',
                      (te as any).imapStep6 || 'We only read mail (INBOX). Nothing is sent or deleted.',
                    ]}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{te.imapHost}</Label>
                      <Input
                        placeholder={(te as any).imapHostPlaceholder || 'imap.example.com'}
                        value={form.host}
                        onChange={e => setForm(p => ({ ...p, host: e.target.value }))}
                        required
                      />
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 break-words">
                        {(te as any).imapHostHint || 'Example: imap.mail.yahoo.com, ssl0.ovh.net, mail.infomaniak.com'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{te.port}</Label>
                      <Input
                        type="number"
                        value={form.port}
                        onChange={e => setForm(p => ({ ...p, port: parseInt(e.target.value) }))}
                        required
                      />
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 break-words">
                        {(te as any).portHint || '993 (SSL/TLS, recommended) or 143 (STARTTLS)'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Security note */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{te.securityNote}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowConnect(false)} className="flex-1">{te.cancel}</Button>
                <Button type="submit" disabled={connecting} className="flex-1 gradient-bg">
                  {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {te.connecting}</> : te.connectVerify}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

/** Collapsible help guide with numbered steps — used inside the email connect dialog */
function HelpGuide({ title, steps }: { title: string; steps: React.ReactNode[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <Info size={13} className="shrink-0" />
          {title}
        </span>
        {open ? <ChevronUp size={13} className="text-blue-500 shrink-0" /> : <ChevronDown size={13} className="text-blue-500 shrink-0" />}
      </button>
      {open && (
        <ol className="px-3 pb-3 space-y-1.5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs text-blue-700 dark:text-blue-300">
              <span className="shrink-0 w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
