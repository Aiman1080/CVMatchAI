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
      // If the token is gone, the user may have already verified earlier.
      // Check whether the user record exists and is already verified so we can
      // return a friendlier message instead of "invalid token".
      const existingUser = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } })
      if (existingUser?.emailVerified) {
        return NextResponse.json({ success: true, alreadyVerified: true })
      }
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }

    // Check if the token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      })
      // If the user is already verified, treat expired token as already-verified
      const existingUser = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } })
      if (existingUser?.emailVerified) {
        return NextResponse.json({ success: true, alreadyVerified: true })
      }
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
