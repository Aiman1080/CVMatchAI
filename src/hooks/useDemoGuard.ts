'use client'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

// Admin is a REAL admin with full rights, not a demo account
const DEMO_EMAILS = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'free@cvmatch.ai']

export function useDemoMode() {
  const { data: session } = useSession()
  const email = (session?.user as any)?.email
  return DEMO_EMAILS.includes(email || '')
}

export function showDemoToast(action?: string) {
  const messages: Record<string, { title: string; description: string }> = {
    delete: { title: 'Demo account — read only', description: 'Deletion is disabled in demo mode. Create a real account to use all features.' },
    upload: { title: 'Demo account — read only', description: 'CV upload is disabled in demo mode. Create a real account to upload CVs.' },
    email: { title: 'Demo account — read only', description: 'Sending emails is disabled in demo mode. Create a real account to send emails.' },
    modify: { title: 'Demo account — read only', description: 'Modification is disabled in demo mode. Create a real account to modify data.' },
    default: { title: 'Demo account — read only', description: 'This action is disabled in demo mode. Create a real account to access all features.' },
  }
  const msg = messages[action || 'default'] || messages.default
  toast({ title: msg.title, description: msg.description, variant: 'destructive' })
}

export function handleDemoResponse(res: Response, action?: string): boolean {
  if (res.status === 403) {
    res.json().then(data => {
      if (data?.demo) {
        showDemoToast(action)
      }
    }).catch(() => {})
    return true
  }
  return false
}
