'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LayoutDashboard, Briefcase, Users, BarChart3, Settings, Mail, LogOut, Zap, ShieldCheck, ChevronRight, LifeBuoy, Sun, Moon, Plug, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  const user = session?.user as any
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'

  const isDark = theme === 'dark'
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

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col z-40">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-lg leading-tight block">CVMatch</span>
            <span className="text-xs text-blue-600 font-semibold leading-tight">AI Platform</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, locked }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                locked && 'opacity-60',
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

      {/* Language switcher */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
          {LOCALES.map(l => (
            <button
              key={l.id}
              onClick={() => setLocale(l.id)}
              className={cn(
                'flex-1 text-xs font-semibold py-1 rounded-md transition-all',
                locale === l.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

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
            <a href="/settings" className="block text-center text-xs bg-blue-600 text-white rounded-lg py-1.5 font-semibold hover:bg-blue-700 transition-colors">Upgrade →</a>
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
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
            title={t.dashboard.nav.signOut}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
