'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { LayoutDashboard, LogOut, Sun, Moon, ArrowLeft, ShieldCheck, Menu, X, Users, LifeBuoy, Settings } from 'lucide-react'
import { LogoAdmin } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = session?.user as any
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'
  const isDark = theme === 'dark'
  const currentTab = searchParams.get('tab')
  const isAdmin = pathname === '/admin'

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <LogoAdmin size={36} />
          <div>
            <span className="font-bold text-white text-lg leading-tight block">CVMatch</span>
            <span className="text-xs text-purple-400 font-semibold leading-tight">Admin Panel</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-gray-400 hover:text-gray-200 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-3 mb-2">Admin</p>
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isAdmin && !currentTab
              ? 'bg-purple-900/50 text-purple-300'
              : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
          )}
        >
          <LayoutDashboard size={18} className={isAdmin && !currentTab ? 'text-purple-400' : 'text-gray-500'} />
          Dashboard
        </Link>
        <Link
          href="/admin?tab=users"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isAdmin && currentTab === 'users'
              ? 'bg-purple-900/50 text-purple-300'
              : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
          )}
        >
          <Users size={18} className={isAdmin && currentTab === 'users' ? 'text-purple-400' : 'text-gray-500'} />
          Users
        </Link>
        <Link
          href="/admin?tab=support"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isAdmin && currentTab === 'support'
              ? 'bg-purple-900/50 text-purple-300'
              : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
          )}
        >
          <LifeBuoy size={18} className={isAdmin && currentTab === 'support' ? 'text-purple-400' : 'text-gray-500'} />
          Support Tickets
        </Link>
        <Link
          href="/admin?tab=actions"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isAdmin && currentTab === 'actions'
              ? 'bg-purple-900/50 text-purple-300'
              : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
          )}
        >
          <Settings size={18} className={isAdmin && currentTab === 'actions' ? 'text-purple-400' : 'text-gray-500'} />
          Admin Actions
        </Link>

        <div className="pt-4 mt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-3 mb-2">Application</p>
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-gray-200 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-500" />
            Back to App
          </Link>
        </div>
      </nav>

      {/* Theme toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          <span className="text-xs font-medium text-gray-400">
            {isDark ? 'Dark mode' : 'Light mode'}
          </span>
          <div className="flex items-center gap-1">
            <Sun size={13} className={isDark ? 'text-gray-500' : 'text-amber-400'} />
            <div className={cn('w-8 h-4 rounded-full transition-colors relative', isDark ? 'bg-purple-600' : 'bg-gray-700')}>
              <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all', isDark ? 'left-4' : 'left-0.5')} />
            </div>
            <Moon size={13} className={isDark ? 'text-purple-400' : 'text-gray-500'} />
          </div>
        </button>
      </div>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-purple-600 text-white font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name || 'Admin'}</p>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-purple-900/60 text-purple-300">
              Administrator
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-sm text-gray-300 hover:bg-gray-800 transition-colors"
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
          'fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:z-40',
          mobileOpen ? 'translate-x-0 z-[51]' : '-translate-x-full z-[51]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
