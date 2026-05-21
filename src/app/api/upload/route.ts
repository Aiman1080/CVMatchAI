import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseDocument, saveUploadedFile } from '@/lib/pdf-parser'
import { analyzeCVAgainstVacancy, detectDocumentType } from '@/lib/ai'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const vacancyId = formData.get('vacancyId') as string
    const gdprConsent = formData.get('gdprConsent') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!vacancyId) return NextResponse.json({ error: 'Vacancy ID required' }, { status: 400 })
    // GDPR consent must be explicitly confirmed by the recruiter before storing any PII
    if (!gdprConsent) return NextResponse.json({ error: 'GDPR consent required' }, { status: 400 })

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760')
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

    const vacancy = await prisma.vacancy.findUnique({ where: { id: vacancyId } })
    if (!vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = saveUploadedFile(buffer, file.name)
    const text = await parseDocument(buffer, file.type)

    // Reject files that parsed to mostly whitespace — likely scanned images without OCR
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract text from document' }, { status: 400 })
    }

    // Detect whether this file is a CV or a motivation letter before creating the record
    const docType = await detectDocumentType(text)
    const userId = (session.user as any).id

    // Create a placeholder candidate first so we have an ID for the analysis update
    let candidate = await prisma.candidate.create({
      data: {
        firstName: 'Unknown', lastName: 'Candidate',
        cvFileName: fileName,
        cvContent: docType === 'cv' ? text : undefined,
        motivationText: docType === 'motivation' ? text : undefined,
        status: 'new', source: 'upload',
        gdprConsent: true, gdprConsentDate: new Date(),
        vacancyId, userId,
      },
    })

    const cvText = docType === 'cv' ? text : candidate.cvContent || ''
    const motivationText = docType === 'motivation' ? text : candidate.motivationText || undefined

    if (cvText) {
      const analysis = await analyzeCVAgainstVacancy(cvText, vacancy.title, vacancy.description, vacancy.requirements, motivationText)
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          // Use AI-extracted name/contact if found; keep placeholders otherwise
          firstName: analysis.firstName || candidate.firstName,
          lastName: analysis.lastName || candidate.lastName,
          email: analysis.email || candidate.email,
          phone: analysis.phone || candidate.phone,
          matchScore: analysis.matchScore,
          summary: analysis.summary,
          // Arrays stored as JSON strings — SQLite has no native array type
          strengths: JSON.stringify(analysis.strengths),
          weaknesses: JSON.stringify(analysis.weaknesses),
          skills: JSON.stringify(analysis.skills),
          experience: analysis.experience,
          education: analysis.education,
          recommendation: analysis.recommendation,
          language: analysis.language,
          analyzedAt: new Date(),
          cvContent: docType === 'cv' ? text : candidate.cvContent,
          motivationText: docType === 'motivation' ? text : candidate.motivationText,
        },
      })
      return NextResponse.json({ success: true, candidate, analysis })
    }
    return NextResponse.json({ success: true, candidate })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
