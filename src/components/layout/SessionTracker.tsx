'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function SessionTracker() {
  const { data: session } = useSession()
  useEffect(() => {
    if (!session) return
    const ping = () => fetch('/api/auth/ping', { method: 'POST' }).catch(() => {})
    ping()
    const interval = setInterval(ping, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [session])
  return null
}
