'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Send, Loader2, Bug, Lightbulb, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

const CONTACT_EMAIL = 'support@mydeltamatch.com'

export function FeedbackButton() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const tf = (t as any).dashboard?.feedback || {
    button: 'Feedback',
    title: 'Send us your feedback',
    description: 'Have a bug to report or an idea for improvement? Let us know.',
    typeLabel: 'Type',
    bug: 'Bug',
    feature: 'Feature request',
    general: 'General feedback',
    messagePlaceholder: 'Tell us what you think...',
    send: 'Send feedback',
    sending: 'Sending...',
    success: 'Thanks for your feedback!',
    successDesc: 'We will review it as soon as possible.',
    error: 'Could not send feedback',
    errorDesc: 'Please try again or email us directly at',
    cancel: 'Cancel',
    close: 'Close',
  }

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send')
      }
      toast({ title: tf.success, description: tf.successDesc })
      setMessage('')
      setOpen(false)
    } catch (err: any) {
      toast({
        title: tf.error,
        description: `${tf.errorDesc} ${CONTACT_EMAIL}`,
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label={tf.button}
      >
        <MessageSquarePlus size={18} />
        <span className="text-sm font-medium hidden sm:inline">{tf.button}</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tf.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tf.description}</p>
              </div>
              <button
                onClick={() => !sending && setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label={tf.close || 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {tf.typeLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setType('bug')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      type === 'bug'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Bug size={18} />
                    <span className="text-xs font-medium">{tf.bug}</span>
                  </button>
                  <button
                    onClick={() => setType('feature')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      type === 'feature'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Lightbulb size={18} />
                    <span className="text-xs font-medium">{tf.feature}</span>
                  </button>
                  <button
                    onClick={() => setType('general')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      type === 'general'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <MessageCircle size={18} />
                    <span className="text-xs font-medium">{tf.general}</span>
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={tf.messagePlaceholder}
                  rows={5}
                  maxLength={3000}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{message.length}/3000</p>
              </div>

              {/* Contact email hint */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {tf.errorDesc} <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>
              </p>
            </div>

            <div className="flex gap-2 p-5 pt-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="flex-1"
              >
                {tf.cancel}
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex-1 gradient-bg gap-2"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? tf.sending : tf.send}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
