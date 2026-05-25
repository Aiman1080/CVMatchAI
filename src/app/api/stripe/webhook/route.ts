import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(secretKey, { apiVersion: '2025-04-30.basil' as any })

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscription: 'pro' },
          })
          console.log(`User ${userId} upgraded to pro via checkout`)
        } else if (session.customer_email) {
          await prisma.user.updateMany({
            where: { email: session.customer_email },
            data: { subscription: 'pro' },
          })
          console.log(`User ${session.customer_email} upgraded to pro via checkout`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.userId
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscription: 'free' },
          })
          console.log(`User ${userId} downgraded to free (subscription deleted)`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        console.warn(`Payment failed for customer ${invoice.customer}`)
        break
      }
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error.message)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
