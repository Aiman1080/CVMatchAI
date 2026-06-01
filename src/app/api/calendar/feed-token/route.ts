// Returns (creating it on first use) the user's private iCal subscription URL.
// The token is a long random string acting as the credential for the public
// feed route - so we never expose it without an authenticated session here.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'
import { randomBytes } from 'crypto'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    let user = await prisma.user.findUnique({ where: { id: userId }, select: { calendarFeedToken: true } })
    let token = user?.calendarFeedToken
    if (!token) {
      token = randomBytes(24).toString('hex')
      await prisma.user.update({ where: { id: userId }, data: { calendarFeedToken: token } })
    }
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || ''
    return NextResponse.json({ url: `${appUrl}/api/calendar/feed/${token}` })
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not get feed URL' }, { status: 500 })
  }
}

// Regenerate the token (invalidates the old feed URL) - demo accounts blocked.
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id
  try {
    const token = randomBytes(24).toString('hex')
    await prisma.user.update({ where: { id: userId }, data: { calendarFeedToken: token } })
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || ''
    return NextResponse.json({ url: `${appUrl}/api/calendar/feed/${token}` })
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not regenerate feed URL' }, { status: 500 })
  }
}
