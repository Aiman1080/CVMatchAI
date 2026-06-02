import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDemoAccount } from '@/lib/demo-guard'
import { syncDemoAts } from '@/lib/integrations/sync'

// Fabricated ATS sync so a user can see the full integration pipeline (jobs +
// candidates + AI analysis + kanban) without any external ATS account or API key.
// Not Pro-gated on purpose: it is a "try it / show it" experience. Read-only demo
// accounts are blocked (they have their own seeded data). Idempotent.
export const maxDuration = 300

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id

  try {
    const result = await syncDemoAts(userId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Demo sync failed' }, { status: 500 })
  }
}
