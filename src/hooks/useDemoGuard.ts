'use client'
import { useSession } from 'next-auth/react'

const DEMO_EMAILS = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'admin@cvmatch.ai', 'free@cvmatch.ai']

export function useDemoMode() {
  const { data: session } = useSession()
  const email = (session?.user as any)?.email
  return DEMO_EMAILS.includes(email || '')
}
