'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { LayoutDashboard, LogOut, Sun, Moon, ArrowLeft, ShieldCheck, Menu, X, Users, LifeBuoy, Settings, BarChart3, Brain, Database, Mail } from 'lucide-react'
import { LogoAdmin } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

export function AdminSidebar() {
  const { t } = useLanguage()
  const ta = (t.dashboard as any).adminSidebar || {}
  const nav = t.dashboard.nav
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') || ''
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const user = session?.user as any
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? theme === 'dark' : false
  const isAdmin = pathname === '/admin'

  const navItems = [
    { href: '/admin', tab: '', icon: LayoutDashboard, label: ta.navDashboard || 'Dashboard' },
    { href: '/admin?tab=accounts', tab: 'accounts', icon: Users, label: ta.navUsers || 'Users' },
    { href: '/admin?tab=support', tab: 'support', icon: LifeBuoy, label: ta.navSupport || 'Support' },
    { href: '/admin?tab=email', tab: 'email', icon: Mail, label: ta.navEmailUsers || 'Email Users' },
    { href: '/admin?tab=overview', tab: 'overview', icon: BarChart3, label: ta.navOverview || 'Overview' },
    { href: '/admin?tab=ai', tab: 'ai', icon: Brain, label: ta.navAiUsage || 'AI Usage' },
    { href: '/admin?tab=actions', tab: 'actions', icon: Settings, label: ta.navActions || 'Actions' },
    { href: '/admin?tab=system', tab: 'system', icon: Database, label: ta.navSystem || 'System' },
  ]

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <LogoAdmin size={36} />
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-lg leading-tight block">DeltaMatch</span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold leading-tight">{ta.panelLabel || 'Admin Panel'}</span>
          </div>
        </Link>
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wide px-3 mb-2">{ta.sectionAdmin || 'Admin'}</p>
        {navItems.map(item => {
          const active = isAdmin && currentTab === item.tab
          const className = cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left',
            active ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
          )
          const content = (
            <>
              <item.icon size={18} className={cn('shrink-0', active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500')} />
              <span className="truncate flex-1 min-w-0">{item.label}</span>
            </>
          )
          // When already on /admin, switch tabs purely client-side: update the URL via
          // history.replaceState and emit an event AdminClient listens for. This avoids
          // re-running the server component (which fires 20+ DB queries per nav).
          if (isAdmin) {
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  const url = item.tab ? `/admin?tab=${item.tab}` : '/admin'
                  window.history.replaceState({}, '', url)
                  window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: item.tab }))
                }}
                className={className}
              >
                {content}
              </button>
            )
          }
          return (
            <Link key={item.tab} href={item.href} onClick={() => setMobileOpen(false)} className={className}>
              {content}
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wide px-3 mb-2">{ta.sectionApplication || 'Application'}</p>
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="truncate flex-1 min-w-0">{ta.backToApp || 'Back to App'}</span>
          </Link>
        </div>
      </nav>

      <div className="px-4 pb-2">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate min-w-0 text-left">{isDark ? (nav.darkMode || 'Dark mode') : (nav.lightMode || 'Light mode')}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Sun size={13} className={isDark ? 'text-gray-500' : 'text-amber-400'} />
            <div className={cn('w-8 h-4 rounded-full transition-colors relative', isDark ? 'bg-purple-600' : 'bg-gray-700')}>
              <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all', isDark ? 'left-4' : 'left-0.5')} />
            </div>
            <Moon size={13} className={isDark ? 'text-purple-400' : 'text-gray-500'} />
          </div>
        </button>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-purple-600 text-white font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{user?.name || (ta.adminFallback || 'Admin')}</p>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 inline-block max-w-full truncate">{ta.administrator || 'Administrator'}</span>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors shrink-0" title={nav.signOut || 'Sign out'}>
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
            <DialogTitle>{nav.signOutConfirmTitle || 'Sign out?'}</DialogTitle>
            <DialogDescription>{nav.signOutConfirmDesc || 'Are you sure you want to sign out?'}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>{nav.cancel || 'Cancel'}</Button>
            <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>{nav.signOutConfirm || 'Sign out'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" aria-label={nav.openMenu || 'Open menu'}>
        <Menu size={20} />
      </button>
      {mobileOpen && <div className="md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out', 'md:translate-x-0 md:z-40', mobileOpen ? 'translate-x-0 z-[51]' : '-translate-x-full z-[51]')}>
        {sidebarContent}
      </aside>
    </>
  )
}
