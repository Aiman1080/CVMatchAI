// Streams the original CV or motivation letter binary stored on the candidate
// record. Used by the in-app PDF viewer (iframe src) and the Download button.
// Auth: only the candidate's owning user (or an admin) can read it.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { downloadDocument } from '@/lib/storage'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  const url = new URL(req.url)
  const type = url.searchParams.get('type') === 'motivation' ? 'motivation' : 'cv'
  const asDownload = url.searchParams.get('download') === '1'

  try {
    const candidate = await prisma.candidate.findFirst({
      where: isAdmin ? { id } : { id, userId },
      select: {
        cvFile: true, cvMimeType: true, cvFileName: true, cvStoragePath: true,
        motivationFile: true, motivationMimeType: true, motivationStoragePath: true,
        firstName: true, lastName: true,
      },
    })
    if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const mimeType = (type === 'motivation' ? candidate.motivationMimeType : candidate.cvMimeType) || 'application/pdf'
    // Prefer Supabase Storage; fall back to the legacy Postgres bytea column
    // (older candidates, or if Storage is momentarily unavailable).
    const storagePath = type === 'motivation' ? candidate.motivationStoragePath : candidate.cvStoragePath
    const byteaFile = type === 'motivation' ? candidate.motivationFile : candidate.cvFile
    let fileBuffer: Buffer | null = storagePath ? await downloadDocument(storagePath) : null
    if (!fileBuffer && byteaFile) fileBuffer = Buffer.from(byteaFile)
    if (!fileBuffer) {
      return NextResponse.json({ error: 'No file stored for this candidate' }, { status: 404 })
    }

    // Filename for the Content-Disposition header — falls back to a safe default
    const ext = mimeType === 'application/pdf' ? 'pdf'
      : mimeType.includes('wordprocessingml') ? 'docx'
      : 'bin'
    const fallbackName = `${candidate.firstName || 'candidate'}_${candidate.lastName || ''}_${type}.${ext}`.replace(/\s+/g, '_')
    const filename = (type === 'cv' && candidate.cvFileName) ? candidate.cvFileName : fallbackName

    const buf = Buffer.from(fileBuffer)
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(buf.length),
        'Content-Disposition': `${asDownload ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e: any) {
    console.error('[candidates/file] failed:', e?.message || e)
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 })
  }
}
