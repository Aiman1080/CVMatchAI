'use client'

// Email-send dialog extracted out of CandidateDetailClient (which was a
// 1244-line monolith). Owns no state of its own — the parent component
// keeps owning subject/body/teamsLink/etc. so existing callers don't have
// to be restructured.

import { Mail, Loader2, Send, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface CandidateInbox { id: string; email: string }

interface Labels {
  sendEmail: string
  toLabel?: string
  fromYourEmail?: string
  customEmail?: string
  interview: string
  rejection: string
  followup: string
  generateWithAI: string
  emailSubject: string
  emailBody: string
  teamsLink: string
  cancel: string
  send: string
  sending: string
  emailPlaceholder?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: { firstName?: string | null; email?: string | null }
  connectedInboxes: CandidateInbox[]
  // form state — owned by the parent
  emailFrom: string
  onFromChange: (v: string) => void
  emailType: string
  onTypeChange: (v: string) => void
  emailSubject: string
  onSubjectChange: (v: string) => void
  emailBody: string
  onBodyChange: (v: string) => void
  teamsLink: string
  onTeamsLinkChange: (v: string) => void
  // actions
  onGenerateEmail: () => void
  onSendEmail: () => void
  generatingEmail: boolean
  sendingEmail: boolean
  labels: Labels
}

export function CandidateEmailDialog({
  open, onOpenChange, candidate, connectedInboxes,
  emailFrom, onFromChange,
  emailType, onTypeChange,
  emailSubject, onSubjectChange,
  emailBody, onBodyChange,
  teamsLink, onTeamsLinkChange,
  onGenerateEmail, onSendEmail,
  generatingEmail, sendingEmail,
  labels,
}: Props) {
  const typeOptions = [
    { type: 'interview', label: `📅 ${labels.interview}`, color: 'border-blue-300 text-blue-700 bg-blue-50' },
    { type: 'rejection', label: `❌ ${labels.rejection}`, color: 'border-red-300 text-red-700 bg-red-50' },
    { type: 'followup', label: `📩 ${labels.followup}`, color: 'border-gray-300 text-gray-700 bg-gray-50' },
    { type: 'custom', label: `✉️ ${labels.customEmail || 'Free-form email'}`, color: 'border-purple-300 text-purple-700 bg-purple-50' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.sendEmail} — {candidate.firstName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <Mail size={14} className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {labels.toLabel || 'To'}: <strong>{candidate.email}</strong>
              </span>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">
                {labels.fromYourEmail || 'From (your email)'}
              </Label>
              <Input
                value={emailFrom}
                onChange={e => onFromChange(e.target.value)}
                placeholder={labels.emailPlaceholder || 'your-email@company.com'}
                className="text-sm"
                list="connected-inbox-list"
              />
              {connectedInboxes.length > 0 && (
                <datalist id="connected-inbox-list">
                  {connectedInboxes.map(inbox => (
                    <option key={inbox.id} value={inbox.email} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {typeOptions.map(opt => (
              <button
                key={opt.type}
                onClick={() => {
                  onTypeChange(opt.type)
                  onSubjectChange('')
                  onBodyChange('')
                }}
                className={`sm:flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-all ${emailType === opt.type ? opt.color : 'border-gray-200 text-gray-400'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {emailType !== 'custom' && (
            <Button
              onClick={onGenerateEmail}
              disabled={generatingEmail}
              variant="outline"
              className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950"
            >
              {generatingEmail ? <Loader2 size={14} className="animate-spin" /> : <span>✨</span>}
              {generatingEmail ? '...' : labels.generateWithAI}
            </Button>
          )}

          <div>
            <Label className="text-xs text-gray-500 mb-1.5">{labels.emailSubject}</Label>
            <Input value={emailSubject} onChange={e => onSubjectChange(e.target.value)} className="text-sm" />
          </div>

          <div>
            <Label className="text-xs text-gray-500 mb-1.5">{labels.emailBody}</Label>
            <textarea
              value={emailBody}
              onChange={e => onBodyChange(e.target.value)}
              rows={7}
              className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {emailType === 'interview' && (
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                <Video size={12} className="text-blue-500" /> {labels.teamsLink}
              </Label>
              <Input
                value={teamsLink}
                onChange={e => onTeamsLinkChange(e.target.value)}
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                className="text-sm"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {labels.cancel}
            </Button>
            <Button
              onClick={onSendEmail}
              disabled={sendingEmail || !emailSubject || !emailBody}
              className="flex-1 gradient-bg gap-2"
            >
              {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sendingEmail ? labels.sending : labels.send}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
