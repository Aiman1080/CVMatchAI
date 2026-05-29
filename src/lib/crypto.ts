import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Validate the secret and derive the key LAZILY (on first encrypt/decrypt),
// never at module load. A top-level throw runs during `next build` — Next
// imports every route handler to collect page data, which evaluates this module
// — so a build environment without NEXTAUTH_SECRET would crash the whole build
// with a cryptic "Failed to collect page data" error, even though the secret is
// only ever needed at runtime. Failing fast on first use keeps the security
// guarantee (no silent public-default fallback) without coupling it to the build.
let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      '[crypto] NEXTAUTH_SECRET is missing or too short (need >= 32 chars). ' +
      'Generate one with: openssl rand -base64 48'
    )
  }
  const salt = crypto.createHash('sha256').update(secret + '-salt').digest()
  cachedKey = crypto.scryptSync(secret, salt, 32)
  return cachedKey
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
