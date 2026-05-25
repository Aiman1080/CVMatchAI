// CSV import endpoint — accepts FormData with a CSV file and vacancyId.
// Parses the CSV and creates Candidate records for each valid row.
// Expected columns: firstName, lastName, email, phone, linkedIn, status
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const VALID_STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired']

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []

  // Parse header row — handle quoted fields
  const parseRow = (row: string): string[] => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return rows
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const vacancyId = formData.get('vacancyId') as string | null

    if (!file || !vacancyId) {
      return NextResponse.json(
        { error: 'Missing file or vacancyId' },
        { status: 400 }
      )
    }

    // Verify the vacancy belongs to the user
    const userId = (session.user as any).id
    const vacancy = await prisma.vacancy.findFirst({
      where: { id: vacancyId, userId },
    })
    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      )
    }

    const text = await file.text()
    const rows = parseCSV(text)

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because row 1 is header, and arrays are 0-indexed

      const firstName = row.firstname || row.first_name || row.name || ''
      const lastName = row.lastname || row.last_name || ''
      const email = row.email || ''
      const phone = row.phone || row.telephone || ''
      const linkedIn = row.linkedin || row.linkedin_url || row.linkedinurl || ''
      const rawStatus = (row.status || 'new').toLowerCase()
      const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'new'

      if (!firstName.trim()) {
        skipped++
        errors.push(`Row ${rowNum}: skipped — missing firstName`)
        continue
      }

      try {
        // When email is empty, check for existing candidate with same name in this vacancy
        if (!email.trim()) {
          const existing = await prisma.candidate.findFirst({
            where: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              vacancyId,
            },
          })
          if (existing) {
            skipped++
            errors.push(`Row ${rowNum}: skipped — duplicate candidate "${firstName.trim()} ${lastName.trim()}" for this vacancy`)
            continue
          }
        }

        await prisma.candidate.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            linkedIn: linkedIn.trim() || null,
            status,
            source: 'csv_import',
            vacancyId,
            userId,
          },
        })
        imported++
      } catch (err: any) {
        skipped++
        // Unique constraint violation (duplicate email+vacancy)
        if (err?.code === 'P2002') {
          errors.push(`Row ${rowNum}: skipped — duplicate email "${email}" for this vacancy`)
        } else {
          errors.push(`Row ${rowNum}: ${err.message || 'Failed to create candidate'}`)
        }
      }
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process CSV' },
      { status: 500 }
    )
  }
}
