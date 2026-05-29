'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Props {
  open: boolean
  onClose: () => void
  inboxId: string
}

export function EmailDiagnoseDialog({ open, onClose, inboxId }: Props) {
  const [senderEmail, setSenderEmail] = useState('')
  const [subjectContains, setSubjectContains] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runDiagnose = async () => {
    if (!senderEmail && !subjectContains) {
      toast({ title: 'Provide a sender email or subject keyword', variant: 'destructive' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/email/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxId, senderEmail, subjectContains }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Diagnostic failed')
      setResult(data)
    } catch (err: any) {
      toast({ title: 'Diagnostic failed', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    toast({ title: 'Diagnostic copied to clipboard' })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email scan diagnostic</DialogTitle>
          <DialogDescription>
            Find a specific email in your inbox and see EXACTLY why the scan does or doesn&apos;t pick it up.
            Useful to debug a missing application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="senderEmail">Sender email</Label>
              <Input
                id="senderEmail"
                type="email"
                placeholder="candidate@example.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
              <p className="text-xs text-gray-400">Match by sender address (partial OK)</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subjectContains">Subject contains</Label>
              <Input
                id="subjectContains"
                placeholder="Application Senior Dev"
                value={subjectContains}
                onChange={(e) => setSubjectContains(e.target.value)}
              />
              <p className="text-xs text-gray-400">Or filter by subject keyword</p>
            </div>
          </div>

          <Button
            onClick={runDiagnose}
            disabled={loading || (!senderEmail && !subjectContains)}
            className="gradient-bg gap-2 w-full sm:w-auto"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Diagnosing...' : 'Run diagnostic'}
          </Button>

          {result && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-semibold">
                  Found {result.meta?.totalMatches || 0} matching email(s). Showing up to 3 most recent.
                </p>
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2">
                  <Copy size={14} /> Copy raw report
                </Button>
              </div>

              {result.reports?.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  ⚠️ No emails matched your filter in the last 30 days. Check the sender address spelling
                  or try a subject keyword instead.
                </div>
              )}

              {result.reports?.map((r: any, idx: number) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                      📧 {r.subject || '(no subject)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      From: <code>{r.from}</code> · {new Date(r.date).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Final verdict */}
                    <div className={`p-3 rounded-lg border ${r.reasonsForRejection.length === 0
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-900 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'}`}>
                      <p className="font-semibold flex items-center gap-2">
                        {r.reasonsForRejection.length === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {r.finalVerdict}
                      </p>
                      {r.reasonsForRejection.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-sm">
                          {r.reasonsForRejection.map((reason: string, i: number) => (
                            <li key={i}>• {reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* MIME tree */}
                    <details className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                      <summary className="text-xs font-semibold cursor-pointer">📁 MIME tree</summary>
                      <pre className="text-[10px] mt-2 overflow-x-auto p-2 bg-white dark:bg-gray-950 rounded font-mono">{r.mimeTree}</pre>
                    </details>

                    {/* AI classification */}
                    <details className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2" open>
                      <summary className="text-xs font-semibold cursor-pointer">🧠 AI classification</summary>
                      <div className="mt-2 space-y-1 text-xs">
                        {r.ai?.error ? (
                          <p className="text-red-600">Error: {r.ai.error}</p>
                        ) : (
                          <>
                            <p><b>Input body length:</b> {r.ai?.input?.bodyLen} chars</p>
                            <p><b>Attachment names sent:</b> {r.ai?.input?.attachmentNames?.join(', ') || '(none)'}</p>
                            <p><b>isRelevant:</b> <code className={r.ai?.output?.isRelevant ? 'text-green-700' : 'text-red-700'}>{String(r.ai?.output?.isRelevant)}</code></p>
                            <p><b>Confidence:</b> {r.ai?.output?.confidence}</p>
                            <p><b>Intent:</b> {r.ai?.output?.intent}</p>
                            <p><b>Candidate name:</b> {r.ai?.output?.candidateName || '—'}</p>
                            <p><b>CV attachment:</b> {r.ai?.output?.cvAttachmentName || '—'}</p>
                          </>
                        )}
                      </div>
                    </details>

                    {/* Each part diagnostic */}
                    <details className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2" open>
                      <summary className="text-xs font-semibold cursor-pointer">📎 Parts ({r.parts?.length || 0})</summary>
                      <div className="mt-2 space-y-2">
                        {r.parts?.map((p: any, i: number) => (
                          <div key={i} className="bg-white dark:bg-gray-950 p-2 rounded text-xs space-y-1">
                            <p className="font-semibold">[{p.path}] {p.type}/{p.subtype} {p.name ? `"${p.name}"` : ''} {p.size ? `(${p.size} bytes)` : ''}</p>
                            {typeof p.download === 'string' && (
                              <p className="text-red-600 text-xs">{p.download}</p>
                            )}
                            {typeof p.download === 'object' && p.download && (
                              <div className="ml-2 space-y-0.5 text-[10px] font-mono">
                                <p>Bytes: {p.download.bytes}</p>
                                <p>Head hex: {p.download.headHex?.slice(0, 50)}...</p>
                                <p>Head utf8: <code>{p.download.headUtf8?.slice(0, 50)}</code></p>
                                {p.download.headBase64Decoded && <p>Head base64-decoded (hex): {p.download.headBase64Decoded?.slice(0, 40)}</p>}
                                <p>%PDF magic: {p.download.isPDF ? '✓ at position 0' : p.download.pdfMagicAt != null ? `found at byte ${p.download.pdfMagicAt}` : '✗ not found'}</p>
                                <p>ZIP magic: {p.download.isZIP ? '✓ at position 0' : p.download.zipMagicAt != null ? `found at byte ${p.download.zipMagicAt}` : '✗ not found'}</p>
                                <p>Parse PDF: {p.download.parsePDF?.ok ? `✓ ${p.download.parsePDF.chars} chars` : `✗ ${p.download.parsePDF?.error || 'fail'}`}</p>
                                <p>Parse DOCX: {p.download.parseDOCX?.ok ? `✓ ${p.download.parseDOCX.chars} chars` : `✗ ${p.download.parseDOCX?.error || 'fail'}`}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
