'use client'

// Self-contained broadcast notification dialog — was inlined inside
// AdminClient.tsx (which is north of 2000 lines). Extracted here so the
// parent is easier to navigate and this concern (compose+send announcement
// to all users) can be tested in isolation.

import { Megaphone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'

interface Labels {
  broadcastTitle?: string
  broadcastDesc?: string
  broadcastTitleLabel?: string
  broadcastTitlePlaceholder?: string
  broadcastMessageLabel?: string
  broadcastMessagePlaceholder?: string
  cancel?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  sending: boolean
  onTitleChange: (s: string) => void
  onMessageChange: (s: string) => void
  onSend: () => void
  labels: Labels
}

export function BroadcastDialog({
  open, onOpenChange, title, message, sending,
  onTitleChange, onMessageChange, onSend, labels,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-500" /> {labels.broadcastTitle || 'Broadcast Notification'}
          </DialogTitle>
          <DialogDescription>
            {labels.broadcastDesc || 'This notification will be sent to all active (non-suspended) users on the platform.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              {labels.broadcastTitleLabel || 'Title'}
            </label>
            <Input
              placeholder={labels.broadcastTitlePlaceholder || 'e.g., Platform Update'}
              value={title}
              onChange={e => onTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
              {labels.broadcastMessageLabel || 'Message'}
            </label>
            <Textarea
              placeholder={labels.broadcastMessagePlaceholder || 'Write your message to all users...'}
              value={message}
              onChange={e => onMessageChange(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{labels.cancel || 'Cancel'}</Button>
          </DialogClose>
          <Button
            className="gradient-bg gap-2"
            onClick={onSend}
            disabled={sending || !title.trim() || !message.trim()}
          >
            <Send size={14} />
            {sending ? 'Sending...' : 'Send to all users'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
