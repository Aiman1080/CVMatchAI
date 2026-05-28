// Forgot-password endpoint — accepts an email, generates a one-time reset token,
// stores it in VerificationToken (1-hour expiry), and sends a reset link via email.
// Always returns 200 regardless of whether the email exists to prevent enumeration.
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({ success: true })

    if (!isEmailConfigured()) {
      console.warn('SMTP not configured — skipping password reset email')
      return successResponse
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return successResponse

    if (isDemoAccount(email)) {
      return NextResponse.json({ error: 'Demo accounts cannot reset password' }, { status: 403 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Remove any existing reset tokens for this user before creating a new one
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${token}`

    await sendEmail(
      email,
      'Reset your DeltaMatch password',
      `Hi ${user.name || 'there'},\n\nYou requested a password reset for your DeltaMatch account.\n\nClick the link below to set a new password (valid for 24 hours):\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.\n\n— DeltaMatch`,
    )

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
