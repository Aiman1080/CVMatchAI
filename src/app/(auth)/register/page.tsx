'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (login?.ok) router.push('/dashboard')
    } catch (error: any) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-fit"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Start for free</h1>
          <p className="text-gray-500 text-sm mt-1">Create your CVMatch AI account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Work Email <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Password <span className="text-red-500">*</span></Label>
            <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
            {form.password.length > 0 && (
              <p className={`text-xs mt-1 ${
                form.password.length < 8
                  ? 'text-red-500'
                  : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password)
                    ? 'text-green-600'
                    : 'text-amber-500'
              }`}>
                {form.password.length < 8
                  ? 'Too short (min. 8 characters)'
                  : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password)
                    ? 'Strong'
                    : 'Weak'}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400">By signing up you agree to our Terms of Service. Candidate data is processed in compliance with GDPR.</p>
          <Button type="submit" disabled={loading} className="w-full gradient-bg h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Free Account'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
