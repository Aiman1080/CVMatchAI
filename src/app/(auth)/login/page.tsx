'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    if (res?.ok) { router.push('/dashboard') }
    else { toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' }) }
  }

  const fillDemo = (type: 'free' | 'pro' | 'admin') => {
    if (type === 'admin') setForm({ email: 'admin@cvmatch.ai', password: 'admin123' })
    else if (type === 'pro') setForm({ email: 'pro@cvmatch.ai', password: 'pro123' })
    else setForm({ email: 'demo@cvmatch.ai', password: 'recruiter123' })
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8" data-theme="light">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to CVMatch AI</p>
        </div>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => fillDemo('free')}
            title="demo@cvmatch.ai / recruiter123"
            className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            Demo Free
            <span className="block text-blue-400 font-normal" style={{ fontSize: '10px' }}>recruiter123</span>
          </button>
          <button
            onClick={() => fillDemo('pro')}
            title="pro@cvmatch.ai / pro123"
            className="flex-1 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
          >
            Demo Pro
            <span className="block text-green-400 font-normal" style={{ fontSize: '10px' }}>pro123</span>
          </button>
          <button
            onClick={() => fillDemo('admin')}
            title="admin@cvmatch.ai / admin123"
            className="flex-1 text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors font-medium"
          >
            Demo Admin
            <span className="block text-purple-400 font-normal" style={{ fontSize: '10px' }}>admin123</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required className="pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-bg h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          No account? <Link href="/register" className="text-blue-600 font-medium hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
