'use client'

// Export utilities for generating PDF and Excel files from candidate data.
// Uses dynamic imports to keep heavy libraries out of the initial bundle.

export interface ExportCandidate {
  firstName: string
  lastName: string
  email: string | null
  phone?: string | null
  matchScore: number | null
  status: string
  recommendation?: string | null
  skills: string | null
  source: string
  createdAt: Date | string
}

function parseSkills(skills: string | null): string {
  if (!skills) return ''
  try {
    const parsed = JSON.parse(skills)
    if (Array.isArray(parsed)) return parsed.join(', ')
    return String(skills)
  } catch {
    return String(skills)
  }
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getRecommendationLabel(rec: string | null | undefined): string {
  if (!rec) return ''
  const labels: Record<string, string> = {
    strong_yes: 'Strongly recommended',
    yes: 'Recommended',
    maybe: 'To consider',
    no: 'Not recommended',
  }
  return labels[rec] || rec
}

/**
 * Export candidates to an Excel (.xlsx) file and trigger a download.
 */
export async function exportCandidatesToExcel(
  candidates: ExportCandidate[],
  vacancyTitle?: string
): Promise<void> {
  const XLSX = (await import('xlsx' as any)) as typeof import('xlsx')

  const rows = candidates.map((c) => ({
    Name: `${c.firstName} ${c.lastName}`,
    Email: c.email || '',
    Phone: c.phone || '',
    'Match Score': c.matchScore != null ? `${c.matchScore.toFixed(0)}%` : '',
    Status: c.status,
    Recommendation: getRecommendationLabel(c.recommendation),
    Skills: parseSkills(c.skills),
    Source: c.source,
    Date: formatDate(c.createdAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 25 }, // Name
    { wch: 30 }, // Email
    { wch: 18 }, // Phone
    { wch: 12 }, // Match Score
    { wch: 14 }, // Status
    { wch: 22 }, // Recommendation
    { wch: 40 }, // Skills
    { wch: 10 }, // Source
    { wch: 12 }, // Date
  ]

  const workbook = XLSX.utils.book_new()
  const sheetName = vacancyTitle ? vacancyTitle.slice(0, 31) : 'Candidates'
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const filename = vacancyTitle
    ? `candidates-${vacancyTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}-${new Date().toISOString().slice(0, 10)}.xlsx`
    : `candidates-${new Date().toISOString().slice(0, 10)}.xlsx`

  XLSX.writeFile(workbook, filename)
}

/**
 * Export candidates to a PDF table and trigger a download.
 */
export async function exportCandidatesToPDF(
  candidates: ExportCandidate[],
  vacancyTitle?: string
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(37, 99, 235) // blue-600
  doc.text('CVMatch AI - Candidate Report', 14, 18)

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  if (vacancyTitle) {
    doc.text(`Vacancy: ${vacancyTitle}`, 14, 26)
  }
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}  |  ${candidates.length} candidate(s)`, 14, vacancyTitle ? 33 : 26)

  const tableData = candidates.map((c) => [
    `${c.firstName} ${c.lastName}`,
    c.email || '',
    c.phone || '',
    c.matchScore != null ? `${c.matchScore.toFixed(0)}%` : '',
    c.status,
    getRecommendationLabel(c.recommendation),
    parseSkills(c.skills),
    c.source,
    formatDate(c.createdAt),
  ])

  autoTable(doc, {
    startY: vacancyTitle ? 38 : 31,
    head: [['Name', 'Email', 'Phone', 'Score', 'Status', 'Recommendation', 'Skills', 'Source', 'Date']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      6: { cellWidth: 50 },
    },
  })

  const filename = vacancyTitle
    ? `candidates-${vacancyTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}-${new Date().toISOString().slice(0, 10)}.pdf`
    : `candidates-${new Date().toISOString().slice(0, 10)}.pdf`

  doc.save(filename)
}

/**
 * Export a hiring report (markdown string) to a clean PDF and trigger a download.
 */
export async function exportHiringReportPDF(
  reportMarkdown: string,
  candidateName: string,
  vacancyTitle?: string
): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const maxWidth = pageWidth - margin * 2

  // Header
  doc.setFontSize(18)
  doc.setTextColor(37, 99, 235)
  doc.text('CVMatch AI - Hiring Report', margin, 18)

  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  doc.text(`Candidate: ${candidateName}`, margin, 27)
  if (vacancyTitle) {
    doc.text(`Vacancy: ${vacancyTitle}`, margin, 34)
  }

  doc.setDrawColor(200, 200, 200)
  const lineY = vacancyTitle ? 38 : 31
  doc.line(margin, lineY, pageWidth - margin, lineY)

  // Body: render report text with word wrapping
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)

  const lines = doc.splitTextToSize(reportMarkdown, maxWidth) as string[]
  let y = lineY + 6
  const pageHeight = doc.internal.pageSize.getHeight()
  const bottomMargin = 15

  for (const line of lines) {
    if (y + 5 > pageHeight - bottomMargin) {
      doc.addPage()
      y = margin
    }

    // Style section headers (lines starting with # or all caps)
    if (line.startsWith('#') || /^[A-Z\s]{5,}$/.test(line.trim())) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text(line.replace(/^#+\s*/, ''), margin, y)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
    } else {
      doc.text(line, margin, y)
    }
    y += 5
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `CVMatch AI  |  Page ${i} of ${totalPages}  |  ${new Date().toLocaleDateString('en-GB')}`,
      margin,
      pageHeight - 8
    )
  }

  const filename = `hiring-report-${candidateName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
