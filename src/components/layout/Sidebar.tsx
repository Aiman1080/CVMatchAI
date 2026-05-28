'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Briefcase, Users, BarChart3, Settings, Mail, LogOut, ShieldCheck, ChevronRight, LifeBuoy, Sun, Moon, Plug, Lock, Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { NotificationBell } from '@/components/NotificationBell'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Locale } from '@/lib/i18n'

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

const LOCALES: { id: Locale; label: string }[] = [
  { id: 'fr', label: 'FR' },
  { id: 'nl', label: 'NL' },
  { id: 'en', label: 'EN' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { t, locale, setLocale } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const user = session?.user as any
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'

  useEffect(() => setMounted(true), [])
  const isDark = mounted ? theme === 'dark' : false
  const subscription = user?.subscription || 'free'
  const isFree = subscription === 'free'

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.dashboard.nav.dashboard },
    { href: '/vacancies', icon: Briefcase, label: t.dashboard.nav.vacancies },
    { href: '/candidates', icon: Users, label: t.dashboard.nav.candidates },
    { href: '/email', icon: Mail, label: t.dashboard.nav.email, locked: isFree },
    { href: '/integrations', icon: Plug, label: t.dashboard.nav.integrations, locked: isFree },
    { href: '/analytics', icon: BarChart3, label: t.dashboard.nav.analytics, locked: isFree },
    { href: '/settings', icon: Settings, label: t.dashboard.nav.settings },
    { href: '/support', icon: LifeBuoy, label: t.dashboard.nav.support },
  ]

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <Logo size={36} />
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-lg leading-tight block">DeltaMatch</span>
            <span className="text-xs text-blue-600 font-semibold leading-tight">AI Platform</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, locked }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={locked ? '#' : href}
              onClick={(e) => { if (locked) e.preventDefault(); else setMobileOpen(false); }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                locked && 'opacity-60 pointer-events-none cursor-not-allowed',
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon className={cn(active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600')} size={18} />
              {label}
              {active && !locked && <ChevronRight className="ml-auto w-3.5 h-3.5 text-blue-400" />}
              {locked && <Lock className="ml-auto w-3 h-3 text-gray-400 dark:text-gray-600" />}
            </Link>
          )
        })}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mt-2',
              pathname.startsWith('/admin')
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
            )}
          >
            <ShieldCheck size={18} className="text-gray-400 dark:text-gray-600" />
            {t.dashboard.nav.admin}
          </Link>
        )}
      </nav>

      {/* Theme toggle — manual light/dark, ignores OS setting */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {isDark ? t.dashboard.nav.darkMode : t.dashboard.nav.lightMode}
          </span>
          <div className="flex items-center gap-1">
            <Sun size={13} className={isDark ? 'text-gray-500' : 'text-amber-500'} />
            <div className={cn('w-8 h-4 rounded-full transition-colors relative', isDark ? 'bg-blue-600' : 'bg-gray-300')}>
              <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all', isDark ? 'left-4' : 'left-0.5')} />
            </div>
            <Moon size={13} className={isDark ? 'text-blue-400' : 'text-gray-400'} />
          </div>
        </button>
      </div>

      {isFree && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t.dashboard.upgrade.planFree}</p>
          <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 rounded-xl border border-blue-100 dark:border-blue-900">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">{t.dashboard.nav.upgradeTitle}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">{t.dashboard.nav.upgradeDesc}</p>
            <a href="/settings" onClick={() => setMobileOpen(false)} className="block text-center text-xs bg-blue-600 text-white rounded-lg py-1.5 font-semibold hover:bg-blue-700 transition-colors">Upgrade →</a>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name || 'User'}</p>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium capitalize', planColors[user?.subscription || 'free'])}>
              {user?.subscription || 'free'}
            </span>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
            title={t.dashboard.nav.signOut}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>Are you sure you want to sign out?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:z-40',
          mobileOpen ? 'translate-x-0 z-[51]' : '-translate-x-full z-[51]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
