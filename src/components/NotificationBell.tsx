'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, FileText, MessageSquare, UserPlus, Scan, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

const POLL_INTERVAL = 30_000 // 30 seconds

const typeIcons: Record<string, typeof Bell> = {
  cv_analyzed: FileText,
  ticket_reply: MessageSquare,
  new_candidate: UserPlus,
  scan_complete: Scan,
}

const typeColors: Record<string, string> = {
  cv_analyzed: 'text-blue-500',
  ticket_reply: 'text-purple-500',
  new_candidate: 'text-green-500',
  scan_complete: 'text-amber-500',
}

export function NotificationBell() {
  const { t } = useLanguage()
  const n = t.dashboard.notifications

  // Builds a localized "x time ago" string from translation keys
  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return n.justNow
    if (minutes < 60) return n.minutesAgo.replace('{count}', String(minutes))
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return n.hoursAgo.replace('{count}', String(hours))
    const days = Math.floor(hours / 24)
    return n.daysAgo.replace('{count}', String(days))
  }

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // Silently fail — next poll will retry
    }
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: 'all' }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    }
  }

  const deleteOne = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], action: 'delete' }),
      })
    } catch {}
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
        aria-label={n.ariaLabel}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 md:absolute md:left-0 md:right-auto md:top-full md:mt-2 w-auto md:w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[100] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <Check size={12} />
                {n.markAllRead}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className={cn('overflow-y-auto', showAll ? 'max-h-[500px]' : 'max-h-80')}>
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Bell size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{n.noNotifications}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 max-w-[260px] mx-auto leading-relaxed">{(n as any).noNotificationsDesc}</p>
              </div>
            ) : (
              notifications.map(notification => {
                const Icon = typeIcons[notification.type] || Bell
                const iconColor = typeColors[notification.type] || 'text-gray-400'

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                      !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                  >
                    <button
                      onClick={() => { if (!notification.read) markOneRead(notification.id) }}
                      className="flex items-start gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className={cn('mt-0.5 shrink-0', iconColor)}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm',
                          notification.read
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white font-medium'
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteOne(notification.id)}
                      className="mt-1 shrink-0 p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 rounded transition-colors"
                      title={n.delete}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* View history */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { setShowAll(!showAll); }}
              className="w-full text-xs text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium py-1"
            >
              {showAll ? n.showRecent : n.viewAllHistory}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
