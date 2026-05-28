// Recruiter registration — validates input with Zod, checks for duplicate email,
// hashes the password with bcrypt (cost 12) and creates the account with
// subscription: 'free' and role: 'recruiter'. Login goes through NextAuth.
// After registration, sends a verification email with a unique token.
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail, isEmailConfigured } from '@/lib/email'

// Input schema — Zod validates and type-narrows in one step
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[0-9]/, 'Password must contain at least one number').regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  company: z.string().optional(),
  plan: z.enum(['free', 'pro']).optional().default('free'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, company, plan } = schema.parse(body)

    // Prevent duplicate accounts before hashing — hashing is expensive (bcrypt cost 12)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    const subscription = plan === 'pro' ? 'pro' : 'free'
    // Pro plan starts with a 30-day free trial
    const subscriptionEnd = plan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        company,
        role: 'recruiter',
        subscription,
        ...(subscriptionEnd ? { subscriptionEnd } : {}),
      },
    })

    // Send verification email — non-blocking so registration succeeds even if email fails
    if (isEmailConfigured()) {
      try {
        const token = crypto.randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        await prisma.verificationToken.create({
          data: { identifier: email, token, expires },
        })

        const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const verifyUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

        await sendEmail(
          email,
          'Verify your email — DeltaMatch',
          `Hi ${name},\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create this account, you can safely ignore this email.`
        )
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
      }
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
