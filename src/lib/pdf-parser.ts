// Note: filesystem writes removed for Vercel compatibility (read-only FS).
// Parsed text content is stored in the database instead.

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

// Strip characters Postgres can't store in a text/utf8 column. The big one is
// the NUL byte (0x00) — pdf-parse sometimes emits it, and Postgres rejects it
// with: invalid byte sequence for encoding "UTF8": 0x00. We also drop other C0
// control chars except tab/newline/carriage-return, and lone surrogates.
export function sanitizeText(text: string): string {
  if (!text) return ''
  // Strip chars Postgres rejects in a utf8 text column. NUL (0x00) is the
  // one that throws 'invalid byte sequence for encoding UTF8: 0x00'. We drop
  // C0 controls except tab/newline/return, DEL, and lone surrogates. Built via
  // String.fromCharCode so the source contains no literal control characters.
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    const isAllowedControl = code === 9 || code === 10 || code === 13
    if (code < 32 && !isAllowedControl) continue   // C0 controls
    if (code === 127) continue                     // DEL
    if (code >= 0xD800 && code <= 0xDFFF) continue  // lone surrogates
    out += text[i]
  }
  return out
}

// Dispatches to the correct parser based on MIME type; falls back to raw UTF-8 for plain text
export async function parseDocument(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const text = await parsePDF(buffer)
    // OCR fallback: scanned/image-only PDFs yield little or no text from
    // pdf-parse. When that happens, ask Gemini to read the PDF directly (it
    // handles PDFs natively — no Tesseract/system dependency, no Vercel
    // memory/timeout risk). No-op in demo mode / on failure, so behaviour is
    // unchanged when normal extraction already works. Dynamic import keeps the
    // AI layer out of contexts that only need plain parsing.
    if (text.trim().length < 100) {
      try {
        const { extractTextWithGemini } = await import('./ai')
        const ocr = await extractTextWithGemini(buffer, mimeType)
        if (ocr.trim().length > text.trim().length) return sanitizeText(ocr)
      } catch (error) {
        console.error('OCR fallback error:', error)
      }
    }
    return sanitizeText(text)
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') return sanitizeText(await parseDOCX(buffer))
  return sanitizeText(buffer.toString('utf-8'))
}

// Generates a safe filename for the upload. On Vercel/serverless the filesystem
// is read-only outside of /tmp, so we no longer persist the raw file — we only
// store the parsed text content in the DB (which is what the AI analyzes anyway).
// The returned name is stored in the candidate record for reference only.
export function saveUploadedFile(buffer: Buffer, filename: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void buffer
  return `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
}
