'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X, User, Mail, Link2 } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Notification {
  id: string
  type: string
  title: string
  subtitle: string
  score: number | null
  source: string
  createdAt: string
  href: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState(0)
  const [seen, setSeen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const tn = t.dashboard.notifications

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setCount(data.count)
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60 * 1000) // poll every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
    setSeen(true)
  }

  const sourceIcon = (source: string) => {
    if (source === 'email') return <Mail size={11} className="text-blue-400" />
    if (source === 'ats') return <Link2 size={11} className="text-orange-400" />
    return <User size={11} className="text-gray-400" />
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {count > 0 && !seen && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tn.title}</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">{tn.empty}</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {n.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</span>
                        {sourceIcon(n.source)}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{n.subtitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {n.score && <div className={`text-sm font-bold ${n.score >= 75 ? 'text-green-600' : n.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{n.score}%</div>}
                      <div className="text-xs text-gray-400">{formatRelativeTime(new Date(n.createdAt))}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
