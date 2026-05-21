import path from 'path'
import fs from 'fs'

// Dynamic imports keep pdf-parse and mammoth out of the browser bundle;
// they are Node-only and must also be listed in serverExternalPackages in next.config.js

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

// Dispatches to the correct parser based on MIME type; falls back to raw UTF-8 for plain text
export async function parseDocument(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') return parsePDF(buffer)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') return parseDOCX(buffer)
  return buffer.toString('utf-8')
}

// Stores uploads with a timestamp prefix to avoid name collisions; sanitizes the original filename
export function saveUploadedFile(buffer: Buffer, filename: string): string {
  const uploadDir = process.env.UPLOAD_DIR || './uploads'
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  fs.writeFileSync(path.join(uploadDir, safeName), buffer)
  return safeName
}
