// Reset-password endpoint — validates the one-time token from VerificationToken,
// hashes the new password with bcrypt (cost 12), updates the user, and deletes the token.
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    try {
      passwordSchema.parse(password)
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ error: 'Password must be at least 8 characters and contain an uppercase letter, a number, and a special character' }, { status: 400 })
      }
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } })
    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (record.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: record.identifier } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    if (isDemoAccount(user.email)) {
      return NextResponse.json({ error: 'Demo accounts cannot reset password' }, { status: 403 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Delete the used token so it cannot be reused
    await prisma.verificationToken.delete({ where: { token } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
