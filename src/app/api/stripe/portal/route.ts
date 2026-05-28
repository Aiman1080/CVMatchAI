import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDemoAccount } from '@/lib/demo-guard'
import prisma from '@/lib/prisma'

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

  const userId = (session.user as any)?.id
  const email = session.user?.email
  if (!userId && !email) {
    return NextResponse.json({ error: 'No user identifier on session' }, { status: 400 })
  }

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    // Prefer the stored Stripe customer ID; only fall back to a list-by-email
    // lookup so we can recover for users who upgraded before we tracked it.
    let customerId: string | undefined
    if (userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      })
      customerId = dbUser?.stripeCustomerId || undefined
    }

    if (!customerId) {
      if (!email) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
      }
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length === 0) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
      }
      customerId = customers.data[0].id
      // Backfill so subsequent calls skip the lookup
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        }).catch(() => { /* unique constraint conflict — ignore */ })
      }
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Stripe portal error:', error.message)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
