'use client'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

const DEMO_EMAILS = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'admin@cvmatch.ai', 'free@cvmatch.ai']

export function useDemoMode() {
  const { data: session } = useSession()
  const email = (session?.user as any)?.email
  return DEMO_EMAILS.includes(email || '')
}

export function showDemoToast(action?: string) {
  const messages: Record<string, { title: string; description: string }> = {
    delete: { title: 'Version Demo', description: 'La suppression est desactivee en mode demo. Creez un vrai compte pour utiliser toutes les fonctionnalites.' },
    upload: { title: 'Version Demo', description: "L'upload de CV est desactive en mode demo. Creez un vrai compte pour uploader des CV." },
    email: { title: 'Version Demo', description: "L'envoi d'emails est desactive en mode demo. Creez un vrai compte pour envoyer des emails." },
    modify: { title: 'Version Demo', description: 'Les modifications sont desactivees en mode demo. Creez un vrai compte pour modifier les donnees.' },
    default: { title: 'Version Demo', description: 'Cette action est desactivee en mode demo. Creez un vrai compte pour acceder a toutes les fonctionnalites.' },
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
