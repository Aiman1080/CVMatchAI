import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isDemoAccount } from '@/lib/demo-guard'
import prisma from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot make purchases' }, { status: 403 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(secretKey, { apiVersion: '2025-04-30.basil' as any })

  const userId = (session.user as any).id
  const email = session.user?.email

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Pro plan price is not configured' }, { status: 503 })
  }

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { userId },
      },
      customer_email: email || undefined,
      success_url: `${appUrl}/settings?upgraded=true`,
      cancel_url: `${appUrl}/upgrade`,
      metadata: { userId },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
