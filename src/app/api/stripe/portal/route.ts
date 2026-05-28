import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(secretKey, { apiVersion: '2025-04-30.basil' as any })

  const email = session.user?.email
  if (!email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  }

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    // Find existing Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Stripe portal error:', error.message)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
