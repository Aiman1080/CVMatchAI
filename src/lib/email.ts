import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
}

export async function sendEmail(to: string, subject: string, text: string, fromName = 'CVMatch AI') {
  const transporter = getTransporter()
  if (!transporter) throw new Error('SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to .env')

  const smtpUser = process.env.SMTP_USER!
  await transporter.sendMail({
    from: `${fromName} <${smtpUser}>`,
    to,
    replyTo: smtpUser,
    subject,
    text,
    html: text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'),
  })
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
