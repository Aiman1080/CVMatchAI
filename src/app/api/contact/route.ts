import { NextResponse } from 'next/server'
import { sendEmail, isEmailConfigured } from '@/lib/email'

const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'contactcvmatchia@gmail.com'

// Max lengths for contact form fields — prevents abuse via giant payloads
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Length limits guard against abusive payloads
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` }, { status: 400 })
    }
    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json({ error: `Email must be ${MAX_EMAIL_LENGTH} characters or fewer` }, { status: 400 })
    }
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json({ error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer` }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
    }

    const body = `New contact message from DeltaMatch\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Subject: ${subject}\n\n` +
      `Message:\n${message}`

    await sendEmail(ADMIN_EMAIL, `[DeltaMatch Contact] ${subject}`, body)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send' }, { status: 500 })
  }
}
