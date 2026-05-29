import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Fail fast at module load instead of silently using a public default secret.
// Without this guard, deploying without NEXTAUTH_SECRET would leave every
// IMAP password (and anything else encrypted) decryptable by anyone who can
// read the source — i.e. the entire internet. This is non-negotiable.
const SECRET = process.env.NEXTAUTH_SECRET
if (!SECRET || SECRET.length < 32) {
  throw new Error(
    '[crypto] NEXTAUTH_SECRET is missing or too short (need >= 32 chars). ' +
    'Generate one with: openssl rand -base64 48'
  )
}

const SALT = crypto.createHash('sha256').update(SECRET + '-salt').digest()
const KEY = crypto.scryptSync(SECRET, SALT, 32)

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
