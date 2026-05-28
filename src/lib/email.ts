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

function wrapInEmailTemplate(bodyHtml: string, signature?: string): string {
  const signatureBlock = signature
    ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">${signature}`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DeltaMatch</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3B82F6,#2563EB);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">DeltaMatch</h1>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Intelligent Recruitment Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            <div style="font-size:15px;line-height:1.6;color:#374151;">
              ${bodyHtml}
              ${signatureBlock}
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f9fafb;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:20px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Sent via DeltaMatch</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">You received this email because of your account activity. If you believe this was sent in error, please contact support.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export async function sendEmail(to: string, subject: string, text: string, fromName = 'DeltaMatch') {
  const transporter = getTransporter()
  if (!transporter) throw new Error('SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to .env')

  const smtpUser = process.env.SMTP_USER!
  const escapedHtml = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  await transporter.sendMail({
    from: `${fromName} <${smtpUser}>`,
    to,
    replyTo: smtpUser,
    subject,
    text,
    html: wrapInEmailTemplate(escapedHtml),
  })
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
