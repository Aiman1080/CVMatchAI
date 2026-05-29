// Supabase Storage helper for CV / motivation-letter binaries.
//
// Why: storing raw document bytes in Postgres (Candidate.cvFile bytea) fills the
// Supabase 500 MB free tier within a few thousand CVs and bloats every backup.
// Object storage is the right home for blobs. This talks to the Storage REST API
// directly (no extra dependency) using the project's SECRET key (sb_secret_...).
//
// Backward-compatible by design: when Storage isn't configured (env vars unset)
// or an upload fails, callers fall back to the legacy bytea columns; reads try
// the storage path first, then the bytea column. Nothing breaks without Storage,
// and pre-existing bytea-only candidates keep working.
import { randomBytes } from 'crypto'
import { createLogger } from './logger'

const log = createLogger('storage')

const BUCKET = 'cv-files'
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '')
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isStorageConfigured(): boolean {
  return !!(SUPABASE_URL && SECRET_KEY)
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    apikey: SECRET_KEY as string,
    ...extra,
  }
}

function extFor(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx'
  if (mimeType.includes('text')) return 'txt'
  return 'bin'
}

// Upload a document and return its object path within the bucket, or null if
// Storage is unavailable / the upload failed (caller falls back to bytea).
export async function uploadDocument(
  buffer: Buffer,
  mimeType: string,
  kind: 'cv' | 'motivation',
): Promise<string | null> {
  if (!isStorageConfigured()) return null
  const path = `${kind}/${randomBytes(16).toString('hex')}.${extFor(mimeType)}`
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': mimeType, 'x-upsert': 'true' }),
      body: new Uint8Array(buffer),
    })
    if (!res.ok) {
      log.error(`upload failed for ${path}`, { status: res.status, body: (await res.text().catch(() => '')).slice(0, 200) })
      return null
    }
    return path
  } catch (e: any) {
    log.error('upload threw', { kind, message: e?.message })
    return null
  }
}

// Decide where a document's bytes live: Storage (preferred) or bytea fallback.
// Returns exactly one of { storagePath } / { fileBytes } set.
export async function persistDocument(
  buffer: Buffer,
  mimeType: string,
  kind: 'cv' | 'motivation',
): Promise<{ storagePath: string | null; fileBytes: Buffer | null }> {
  const storagePath = await uploadDocument(buffer, mimeType, kind)
  if (storagePath) return { storagePath, fileBytes: null }
  return { storagePath: null, fileBytes: buffer }
}

// Download a document by its storage path. Returns null on any failure so the
// caller can fall back to the bytea column.
export async function downloadDocument(path: string): Promise<Buffer | null> {
  if (!isStorageConfigured() || !path) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      headers: authHeaders(),
    })
    if (!res.ok) {
      log.error(`download failed for ${path}`, { status: res.status })
      return null
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (e: any) {
    log.error('download threw', { path, message: e?.message })
    return null
  }
}

// Best-effort delete (e.g. when a candidate is removed). Never throws.
export async function deleteDocument(path?: string | null): Promise<void> {
  if (!isStorageConfigured() || !path) return
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  } catch (e: any) {
    log.warn(`delete failed for ${path}`, { message: e?.message })
  }
}
