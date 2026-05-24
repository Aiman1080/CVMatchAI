'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LayoutDashboard, LogOut, Sun, Moon, ArrowLeft, ShieldCheck } from 'lucide-react'
import { LogoAdmin } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const user = session?.user as any
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'
  const isDark = theme === 'dark'

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoAdmin size={36} />
          <div>
            <span className="font-bold text-white text-lg leading-tight block">CVMatch</span>
            <span className="text-xs text-purple-400 font-semibold leading-tight">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            pathname === '/admin'
              ? 'bg-purple-900/50 text-purple-300'
              : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
          )}
        >
          <ShieldCheck size={18} className={pathname === '/admin' ? 'text-purple-400' : 'text-gray-500'} />
          Admin Panel
        </Link>

        <div className="pt-4 mt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-3 mb-2">Application</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-gray-200 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-500" />
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-gray-200 transition-all"
          >
            <LayoutDashboard size={18} className="text-gray-500" />
            Recruiter Space
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
    </aside>
  )
}
