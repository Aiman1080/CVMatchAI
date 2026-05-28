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

  // Idempotency & retry guard: Stripe retries on 5xx responses, so once the
  // signature is verified we always respond 200 even if internal processing
  // fails. Errors are logged so they can be reviewed later. Each handler is
  // independently try/catch-wrapped so one failing event type does not block
  // others, and the same event.id processed twice will be a no-op for the
  // common `subscription` updates (Prisma writes are themselves idempotent).
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        try {
          const session = event.data.object as any
          const userId = session.metadata?.userId
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: { subscription: 'pro' },
            })
            console.log(`[Stripe webhook ${event.id}] User ${userId} upgraded to pro via checkout`)
          } else if (session.customer_email) {
            await prisma.user.updateMany({
              where: { email: session.customer_email },
              data: { subscription: 'pro' },
            })
            console.log(`[Stripe webhook ${event.id}] User ${session.customer_email} upgraded to pro via checkout`)
          }
        } catch (err: any) {
          console.error(`[Stripe webhook ${event.id}] checkout.session.completed handler error:`, err?.message || err)
        }
        break
      }

      case 'customer.subscription.deleted': {
        try {
          const subscription = event.data.object as any
          const userId = subscription.metadata?.userId
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: { subscription: 'free' },
            })
            console.log(`[Stripe webhook ${event.id}] User ${userId} downgraded to free (subscription deleted)`)
          }
        } catch (err: any) {
          console.error(`[Stripe webhook ${event.id}] customer.subscription.deleted handler error:`, err?.message || err)
        }
        break
      }

      case 'customer.subscription.updated': {
        try {
          const subscription = event.data.object as any
          const userId = subscription.metadata?.userId
          const customerId = subscription.customer as string | undefined
          const status = subscription.status as string
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null

          // Active/trialing -> pro; canceled/expired/unpaid -> free.
          // past_due/incomplete are left alone so we only refresh subscriptionEnd.
          const downgradeStatuses = new Set(['canceled', 'incomplete_expired', 'unpaid'])
          const activeStatuses = new Set(['active', 'trialing'])

          const updateData: any = {}
          if (downgradeStatuses.has(status)) {
            updateData.subscription = 'free'
          } else if (activeStatuses.has(status)) {
            updateData.subscription = 'pro'
          }
          if (periodEnd) {
            updateData.subscriptionEnd = periodEnd
          }

          if (Object.keys(updateData).length === 0) break

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: updateData,
            })
            console.log(`[Stripe webhook ${event.id}] User ${userId} subscription updated (status=${status})`)
          } else {
            console.warn(`[Stripe webhook ${event.id}] No userId in metadata, customer=${customerId}`)
          }
        } catch (err: any) {
          console.error(`[Stripe webhook ${event.id}] customer.subscription.updated handler error:`, err?.message || err)
        }
        break
      }

      case 'invoice.payment_failed': {
        try {
          const invoice = event.data.object as any
          console.warn(`[Stripe webhook ${event.id}] Payment failed for customer ${invoice.customer}`)
        } catch (err: any) {
          console.error(`[Stripe webhook ${event.id}] invoice.payment_failed handler error:`, err?.message || err)
        }
        break
      }
    }
  } catch (error: any) {
    // Defensive fallback — should be unreachable thanks to per-handler try/catch,
    // but if anything escapes we still return 200 so Stripe stops retrying. The
    // event is logged for manual investigation.
    console.error(`[Stripe webhook ${event.id}] unexpected outer error:`, error?.message || error)
  }

  // Always return 200 once the signature is verified so Stripe does not retry
  // the same event indefinitely. Internal failures must be surfaced via logs.
  return NextResponse.json({ received: true })
}
