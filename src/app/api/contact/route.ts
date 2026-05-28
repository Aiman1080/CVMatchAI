import { NextResponse } from 'next/server'
import { sendEmail, isEmailConfigured } from '@/lib/email'

const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'contactcvmatchia@gmail.com'

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
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
