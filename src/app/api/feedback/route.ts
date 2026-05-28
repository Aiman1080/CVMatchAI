import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, isEmailConfigured } from '@/lib/email'

const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'contactcvmatchia@gmail.com'
const MAX_MESSAGE_LENGTH = 3000

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { message, type } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
    }

    const feedbackType = ['bug', 'feature', 'general'].includes(type) ? type : 'general'
    const userEmail = session.user.email || 'unknown'
    const userName = session.user.name || 'Unknown User'

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const subject = `[DeltaMatch Feedback - ${feedbackType.toUpperCase()}] from ${userName}`
    const body = `New feedback received from DeltaMatch\n\n` +
      `Type: ${feedbackType}\n` +
      `User: ${userName}\n` +
      `Email: ${userEmail}\n` +
      `Date: ${new Date().toISOString()}\n\n` +
      `Message:\n${message}`

    await sendEmail(ADMIN_EMAIL, subject, body)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send feedback' }, { status: 500 })
  }
}
