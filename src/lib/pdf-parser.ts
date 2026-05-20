import path from 'path'
import fs from 'fs'

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (error) {
    console.error('PDF parse error:', error)
    return ''
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch (error) {
    console.error('DOCX parse error:', error)
    return ''
  }
}

export async function parseDocument(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') return parsePDF(buffer)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') return parseDOCX(buffer)
  return buffer.toString('utf-8')
}

export function saveUploadedFile(buffer: Buffer, filename: string): string {
  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  fs.writeFileSync(path.join(uploadDir, safeName), buffer)
  return safeName
}
