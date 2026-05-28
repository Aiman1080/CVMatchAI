// CV/document upload endpoint — accepts a PDF or DOCX via multipart form,
// detects whether it's a CV or a motivation letter, runs AI analysis against
// the requested vacancy, and creates a Candidate record in the database.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { parseDocument, saveUploadedFile } from '@/lib/pdf-parser'
import { analyzeCVAgainstVacancy, detectDocumentType } from '@/lib/ai'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })
  }

  let placeholderCandidateId: string | null = null

  try {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 })
    }
    const file = formData.get('file') as File
    const vacancyId = formData.get('vacancyId') as string
    const gdprConsent = formData.get('gdprConsent') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!vacancyId) return NextResponse.json({ error: 'Vacancy ID required' }, { status: 400 })

    // Validate file type — only allow PDF, DOCX, and TXT
    const allowedExtensions = ['.pdf', '.docx', '.txt']
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOCX, and TXT files are allowed.' }, { status: 400 })
    }
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid MIME type. Only PDF, DOCX, and TXT files are allowed.' }, { status: 400 })
    }
    // GDPR consent must be explicitly confirmed by the recruiter before storing any PII
    if (!gdprConsent) return NextResponse.json({ error: 'GDPR consent required' }, { status: 400 })

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760')
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

    const userId = (session.user as any).id
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
    const effectiveSubscription = getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)
    const limits = getPlanLimits(effectiveSubscription)
    if (limits.maxCandidatesPerMonth !== Infinity) {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
      const monthCount = await prisma.candidate.count({ where: { userId, createdAt: { gte: startOfMonth } } })
      if (monthCount >= limits.maxCandidatesPerMonth) {
        return NextResponse.json({ error: `Monthly candidate limit (${limits.maxCandidatesPerMonth}) reached. Upgrade for more.`, upgrade: true }, { status: 403 })
      }
    }
    // findFirst with userId prevents IDOR — users can only upload to their own vacancies
    const vacancy = await prisma.vacancy.findFirst({ where: { id: vacancyId, userId } })
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
    placeholderCandidateId = candidate.id

    const cvText = docType === 'cv' ? text : candidate.cvContent || ''
    const motivationText = docType === 'motivation' ? text : candidate.motivationText || undefined

    if (cvText) {
      try {
        const analysis = await analyzeCVAgainstVacancy(cvText, vacancy.title, vacancy.description, vacancy.requirements, motivationText, vacancy.language)
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
        const candidateName = `${candidate.firstName} ${candidate.lastName}`
        const score = Math.round(analysis.matchScore ?? 0)
        await createNotification(
          userId,
          'cv_analyzed',
          `CV analyzed: ${candidateName}`,
          `${candidateName} scored ${score}% for ${vacancy.title}`
        )

        await logActivity(candidate.id, 'created', 'Candidate created via CV upload')
        return NextResponse.json({ success: true, candidate, analysis }, { status: 201 })
      } catch (aiError: any) {
        // AI analysis failed (rate limit / quota / network). Keep the candidate
        // record but mark them as not yet analyzed so the recruiter can retry
        // rather than silently storing fabricated demo scores.
        console.error('[upload] AI analysis failed, saving candidate without scores:', aiError?.message || aiError)
        candidate = await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            summary: 'AI analysis failed — please retry. The CV is stored but has not been scored yet.',
            cvContent: docType === 'cv' ? text : candidate.cvContent,
            motivationText: docType === 'motivation' ? text : candidate.motivationText,
          },
        })
        await logActivity(candidate.id, 'created', 'Candidate created via CV upload (AI analysis failed)')
        return NextResponse.json({
          success: true,
          candidate,
          warning: 'AI analysis failed. Candidate was saved without a match score — please retry analysis later.',
        }, { status: 201 })
      }
    }
    await logActivity(candidate.id, 'created', 'Candidate created via CV upload')
    return NextResponse.json({ success: true, candidate }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (placeholderCandidateId) {
        await prisma.candidate.delete({ where: { id: placeholderCandidateId } }).catch(() => {})
      }
      return NextResponse.json({ error: 'This candidate has already been submitted for this vacancy.' }, { status: 409 })
    }
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
