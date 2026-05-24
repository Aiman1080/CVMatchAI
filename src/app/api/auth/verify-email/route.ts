// Verifies a user's email address using a token sent during registration.
// Checks the token exists and hasn't expired, then marks the user as verified.
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json()

    if (!token || !email) {
      return NextResponse.json({ error: 'Token and email are required' }, { status: 400 })
    }

    // Find the verification token by identifier (email) and token value
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }

    // Check if the token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      })
      return NextResponse.json({ error: 'Verification link has expired. Please request a new one.' }, { status: 400 })
    }

    // Mark the user's email as verified and delete the token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
