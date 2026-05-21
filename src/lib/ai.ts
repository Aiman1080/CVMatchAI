// AI analysis module — uses the Anthropic SDK (messages.create with tool_choice:'any')
// for structured CV and email analysis. Falls back to generateDemoAnalysis() when no
// API key is configured so the app works out-of-the-box without a paid account.
import Anthropic, { BadRequestError, RateLimitError, AuthenticationError } from '@anthropic-ai/sdk'

const isDemoMode = () =>
  !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === ''

const getClient = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CVAnalysisResult {
  matchScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  skills: string[]
  experience: string
  education: string
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
  language: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

// JSON Schema for the CV analysis tool — matches CVAnalysisResult fields exactly.
// Defined manually to avoid the @anthropic-ai/sdk/helpers/beta/zod subpath import
// which isn't in the package exports map and breaks Next.js webpack resolution.
const CV_ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'submit_cv_analysis',
  description:
    'Submit your complete structured analysis after reviewing all documents. Call this exactly once with all fields populated.',
  input_schema: {
    type: 'object' as const,
    properties: {
      matchScore: { type: 'number', description: 'Match score 0-100. Be strict — average candidates score 50-65, only exceptional candidates score 80+.' },
      summary: { type: 'string', description: '3-4 sentence professional summary covering the candidate\'s overall profile, key experience, main skills, and fit for this specific role.' },
      strengths: { type: 'array', items: { type: 'string' }, description: '4-6 specific strengths relevant to this vacancy. Each item should be a complete sentence explaining WHY it is a strength for this role (e.g. "5 years of Python development directly matching the backend requirements").' },
      weaknesses: { type: 'array', items: { type: 'string' }, description: '3-5 specific gaps or concerns relative to the vacancy requirements. Each item should be concrete (e.g. "No experience with Kubernetes mentioned despite it being a key requirement").' },
      skills: { type: 'array', items: { type: 'string' }, description: 'Technical and soft skills extracted from the CV' },
      experience: { type: 'string', description: 'Chronological summary of job roles only. Do NOT include education here.' },
      education: { type: 'string', description: 'Degrees with institution and year, e.g. "Master CS — KU Leuven (2021)". Do NOT list jobs here.' },
      recommendation: { type: 'string', enum: ['strong_yes', 'yes', 'maybe', 'no'], description: 'Hiring recommendation based on fit' },
      language: { type: 'string', enum: ['nl', 'en', 'fr', 'de'], description: 'Dominant language detected in the CV' },
      firstName: { type: 'string', description: "Candidate's personal first name from the first line of the CV. Never a school or company name." },
      lastName: { type: 'string', description: "Candidate's family name. Never a school, company, or header word." },
      email: { type: 'string', description: 'Email address from the CV if present' },
      phone: { type: 'string', description: 'Phone number from the CV if present' },
    },
    required: ['matchScore', 'summary', 'strengths', 'weaknesses', 'skills', 'experience', 'education', 'recommendation', 'language'],
  },
}

const SYSTEM_PROMPT = `You are an expert HR recruiter and talent assessor with deep experience in Belgian and European job markets. Your task is to analyze a candidate's CV and optional motivation letter against an open vacancy and produce a thorough, honest structured assessment.

CRITICAL EXTRACTION RULES — you must follow these exactly:
1. firstName / lastName: The candidate's PERSONAL name appears on the FIRST 1-3 lines of the CV. It is NEVER:
   - A school or university name (KU Leuven, HoGent, UCL, Artesis Plantijn, VUB, ULiège…)
   - A company or employer name
   - A job title (Software Engineer, Project Manager…)
   - A section header (EDUCATION, EXPERIENCE, SKILLS, PROFILE, SUMMARY…)
   If you cannot identify a clear personal first+last name, leave both fields empty.
2. education: Extract ACTUAL degrees with the institution name and year. Example: "Master in Computer Science — KU Leuven (2021), Bachelor Applied Informatics — HoGent (2018)". Do NOT list job titles, internships, or work experience here.
3. experience: Summarize ACTUAL paid employment chronologically. Do NOT list education, courses, or certifications here.
4. matchScore: Rate 0-100 strictly based on how well the candidate meets the listed requirements. A candidate missing key required skills should score below 50.
5. language: Detect from the CV text — 'nl' Dutch, 'fr' French, 'en' English, 'de' German.`

export async function analyzeCVAgainstVacancy(
  cvText: string,
  vacancyTitle: string,
  vacancyDescription: string,
  vacancyRequirements: string,
  motivationText?: string,
): Promise<CVAnalysisResult> {
  if (isDemoMode()) {
    return generateDemoAnalysis(cvText, vacancyTitle)
  }

  const client = getClient()

  const userContent =
    `Carefully analyze the job application below against the vacancy requirements, then call submit_cv_analysis with your complete assessment.

VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1500)}
Requirements: ${vacancyRequirements.slice(0, 1000)}

CANDIDATE CV:
${cvText.slice(0, 6000)}` +
    (motivationText ? `\n\nMOTIVATION LETTER:\n${motivationText.slice(0, 2000)}` : '')

  try {
    // tool_choice:'any' forces the model to call the tool on the first turn,
    // so we get the structured result in a single API call with no loop needed.
    const response = await (client.messages.create as any)({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Prompt caching: static system prompt cached after first request (~90% cost saving)
          cache_control: { type: 'ephemeral' },
        },
      ],
      tool_choice: { type: 'any' },
      tools: [CV_ANALYSIS_TOOL],
      messages: [{ role: 'user', content: userContent }],
    })

    const toolBlock = response.content?.find((b: any) => b.type === 'tool_use')
    if (toolBlock?.type === 'tool_use') {
      return toolBlock.input as CVAnalysisResult
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error('[AI] Rate limit — using demo analysis')
    } else if (error instanceof AuthenticationError) {
      console.error('[AI] Invalid API key — using demo analysis')
    } else if (error instanceof BadRequestError) {
      console.error('[AI] Bad request:', (error as any).message)
      // Retry without thinking parameter (some model versions may not support it)
      try {
        const retry = await client.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tool_choice: { type: 'any' as const },
          tools: [CV_ANALYSIS_TOOL],
          messages: [{ role: 'user', content: userContent }],
        })
        const block = retry.content?.find((b: any) => b.type === 'tool_use')
        if (block?.type === 'tool_use') return (block as any).input as CVAnalysisResult
      } catch (retryErr) {
        console.error('[AI] Retry also failed:', retryErr)
      }
    } else {
      console.error('[AI] Analysis error:', error)
    }
  }

  return generateDemoAnalysis(cvText, vacancyTitle)
}

// ── Email classification ──────────────────────────────────────────────────────

const EMAIL_CLASSIFY_TOOL: Anthropic.Tool = {
  name: 'classify_email',
  description: 'Classify whether this email is a recruitment job application',
  input_schema: {
    type: 'object' as const,
    properties: {
      isRelevant: { type: 'boolean', description: 'True if this is a job application with CV or motivation letter' },
      candidateName: { type: 'string', description: 'Candidate name if detectable' },
      appliedPosition: { type: 'string', description: 'Position applied for if mentioned' },
      hasAttachments: { type: 'boolean', description: 'Whether the email has document attachments' },
      confidence: { type: 'number', description: 'Confidence score 0-100' },
    },
    required: ['isRelevant', 'hasAttachments', 'confidence'],
  },
}

export async function classifyRecruitmentEmail(
  subject: string,
  bodyPreview: string,
  attachmentNames: string[],
): Promise<{ isRelevant: boolean; candidateName?: string; appliedPosition?: string; confidence: number }> {
  if (isDemoMode()) {
    const keywords = ['sollicitatie', 'application', 'cv', 'resume', 'motivation', 'candidature', 'apply', 'kandidaat']
    const text = `${subject} ${bodyPreview}`.toLowerCase()
    const isRelevant =
      keywords.some(k => text.includes(k)) || attachmentNames.some(n => /\.(pdf|docx?)/i.test(n))
    return { isRelevant, confidence: isRelevant ? 85 : 20 }
  }

  const client = getClient()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      tool_choice: { type: 'any' as const },
      tools: [EMAIL_CLASSIFY_TOOL],
      messages: [{
        role: 'user',
        content: `Classify this email:\n\nSubject: ${subject}\nBody: ${bodyPreview.slice(0, 500)}\nAttachments: ${attachmentNames.join(', ') || 'none'}\n\nCall classify_email now.`,
      }],
    })

    const block = response.content?.find((b: any) => b.type === 'tool_use')
    if (block?.type === 'tool_use') {
      const input = (block as any).input
      return {
        isRelevant: input.isRelevant,
        candidateName: input.candidateName,
        appliedPosition: input.appliedPosition,
        confidence: input.confidence,
      }
    }
  } catch (error) {
    console.error('[AI] Email classification error:', error)
  }

  return { isRelevant: false, confidence: 0 }
}

// ── Document type detection ───────────────────────────────────────────────────

const DOC_TYPE_TOOL: Anthropic.Tool = {
  name: 'set_document_type',
  description: 'Set the detected document type',
  input_schema: {
    type: 'object' as const,
    properties: {
      type: { type: 'string', enum: ['cv', 'motivation', 'other'], description: "'cv', 'motivation', or 'other'" },
    },
    required: ['type'],
  },
}

export async function detectDocumentType(text: string): Promise<'cv' | 'motivation' | 'other'> {
  if (isDemoMode()) {
    const lower = text.toLowerCase()
    const cvScore = ['experience', 'education', 'skills', 'work history', 'curriculum vitae', 'resume',
      'werkervaring', 'opleiding', 'vaardigheden', 'expérience', 'formation'].filter(k => lower.includes(k)).length
    const motScore = ['dear', 'i am writing', 'apply', 'motivation', 'sollicitatie', 'geachte',
      'motivatie', 'candidature', 'lettre'].filter(k => lower.includes(k)).length
    if (cvScore > motScore) return 'cv'
    if (motScore > 0) return 'motivation'
    return 'other'
  }

  const client = getClient()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      tool_choice: { type: 'any' as const },
      tools: [DOC_TYPE_TOOL],
      messages: [{
        role: 'user',
        content: `Is this a CV/resume, motivation/cover letter, or something else?\n\n${text.slice(0, 800)}\n\nCall set_document_type now.`,
      }],
    })
    const block = response.content?.find((b: any) => b.type === 'tool_use')
    if (block?.type === 'tool_use') return ((block as any).input as any).type
  } catch (error) {
    console.error('[AI] detectDocumentType error:', error)
  }

  const lower = text.toLowerCase()
  const cvScore = ['experience', 'education', 'skills', 'werkervaring', 'opleiding', 'expérience', 'formation']
    .filter(k => lower.includes(k)).length
  return cvScore >= 2 ? 'cv' : 'other'
}

export async function generateRecruiterInsights(candidates: Array<{
  name: string; matchScore: number; strengths: string[]; weaknesses: string[]
}>): Promise<string> {
  if (candidates.length === 0) return 'No candidates to analyze yet.'
  const top = [...candidates].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
  return `Top ${top.length} candidates identified. ${top[0].name} leads with ${top[0].matchScore.toFixed(0)}% match. Recommend prioritizing top candidates for interviews.`
}

// ── Demo-mode analysis (no API key needed) ────────────────────────────────────

function hashScore(cv: string, title: string): number {
  const s = (cv + title).slice(0, 600)
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h) % 35
}

const NOT_A_NAME = new Set([
  'experience', 'education', 'opleiding', 'formation', 'études', 'etudes',
  'skills', 'vaardigheden', 'compétences', 'werkervaring', 'expérience',
  'professional', 'professionnel', 'professioneel', 'summary', 'profil', 'profile',
  'samenvatting', 'contact', 'technical', 'technische', 'languages', 'talen',
  'certifications', 'references', 'objective', 'about', 'awards', 'publications',
  'curriculum', 'vitae', 'resume',
  'master', 'bachelor', 'licence', 'msc', 'bsc', 'phd', 'doctorat', 'postgraduate',
  'graduaat', 'ingenieur', 'kandidaat',
  'university', 'université', 'universiteit', 'hogeschool', 'school', 'institute',
  'college', 'academy', 'academie', 'faculteit', 'faculty', 'département',
  'campus', 'polytechnique',
  'odisee', 'artesis', 'plantijn', 'ehb', 'erasmushogeschool', 'kdg', 'karel',
  'hogent', 'thomas', 'more', 'ucll', 'uclouvain', 'kuleuven', 'ugent', 'vub',
  'uantwerpen', 'uhasselt', 'ulb', 'unamur', 'umons', 'pxl', 'syntra', 'vives',
  'luca', 'rits', 'sint-lukas', 'sint', 'intec', 'ifapme', 'ephec', 'solvay', 'vlerick',
  'leuven', 'gent', 'ghent', 'brussels', 'bruxelles', 'brussel', 'antwerp', 'antwerpen',
  'liège', 'liege', 'paris', 'berlin', 'london', 'amsterdam', 'rotterdam', 'utrecht',
  'senior', 'junior', 'lead', 'manager', 'engineer', 'developer', 'designer',
  'analyst', 'consultant', 'directeur', 'director', 'coordinator', 'specialist', 'expert',
])

function extractName(cvText: string): { firstName?: string; lastName?: string } {
  const lines = cvText.split('\n').map(l => l.trim()).filter(Boolean)
  const nameLineRe = /^([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+(?:\s+(?:de|van|der|den|du|des|le|la|el|von|af|bin|al)?\s*[A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+){1,3})\s*$/
  for (const line of lines.slice(0, 10)) {
    if (/[@+|\/\\]/.test(line)) continue
    if (/^\d/.test(line)) continue
    if (/https?:|www\.|linkedin|github/i.test(line)) continue
    const words = line.split(/\s+/)
    if (words.every(w => w === w.toUpperCase() && w.length > 1)) continue
    if (words.some(w => NOT_A_NAME.has(w.toLowerCase()))) continue
    const match = nameLineRe.exec(line)
    if (match) {
      const parts = match[1].trim().split(/\s+/)
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
    }
  }
  return {}
}

function extractSection(cvText: string, keywords: string[]): string | null {
  const lines = cvText.split('\n').map(l => l.trim())
  const idx = lines.findIndex(l => {
    const lower = l.toLowerCase()
    return keywords.some(k => lower.includes(k)) && l.length < 60
  })
  if (idx < 0) return null
  const result: string[] = []
  for (let i = idx + 1; i < Math.min(idx + 12, lines.length); i++) {
    const l = lines[i]
    if (!l) continue
    const isHeader =
      (l === l.toUpperCase() && l.length > 3 && /^[A-Z]/.test(l)) ||
      ['experience', 'education', 'skills', 'opleiding', 'vaardigheden', 'werkervaring',
        'formation', 'compétences', 'expérience', 'contact', 'references', 'awards',
        'certifications', 'languages', 'talen', 'summary', 'profil'].some(k => l.toLowerCase().startsWith(k))
    if (isHeader && result.length > 0) break
    result.push(l)
  }
  return result.filter(l => l.length > 4).slice(0, 4).join(' · ') || null
}

function generateDemoAnalysis(cvText: string, vacancyTitle: string): CVAnalysisResult {
  const score = 60 + hashScore(cvText, vacancyTitle)
  const lower = cvText.toLowerCase()

  const techSkills = ['React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'AWS', 'Docker',
    'Figma', 'Java', 'Vue.js', 'JavaScript', 'CSS', 'HTML', 'dbt', 'Airflow', 'Kafka',
    'PostgreSQL', 'MongoDB', 'Redis', 'Kubernetes', 'Terraform', 'GraphQL', 'NestJS']
  const detectedSkills = techSkills.filter(s => lower.includes(s.toLowerCase())).slice(0, 6)
  if (detectedSkills.length === 0) detectedSkills.push('Communication', 'Problem-solving', 'Teamwork')

  const emailMatch = cvText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = cvText.match(/(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/)
  const { firstName, lastName } = extractName(cvText)

  const eduSection = extractSection(cvText, ['education', 'opleiding', 'formation', 'études', 'etudes', 'academic', 'diplom', 'degree'])
  const expSection = extractSection(cvText, ['experience', 'werkervaring', 'expérience', 'employment', 'work history', 'professional background', 'career'])

  const lang: 'nl' | 'fr' | 'en' | 'de' =
    lower.includes('werkervaring') || lower.includes('opleiding') ? 'nl' :
    lower.includes('expérience') || lower.includes('formation') ? 'fr' :
    lower.includes('berufserfahrung') || lower.includes('ausbildung') ? 'de' : 'en'

  return {
    matchScore: score,
    summary: `Candidate presents relevant background for the ${vacancyTitle} role. Profile reviewed in demo mode — add an ANTHROPIC_API_KEY for full AI assessment.`,
    strengths: ['Relevant professional experience', 'Technical skills matching vacancy', 'Clear structured CV'],
    weaknesses: ['Demo mode: detailed analysis requires AI key', 'Some requirements need interview confirmation'],
    skills: detectedSkills,
    experience: expSection ?? 'Work experience present — see CV tab for details.',
    education: eduSection ?? 'Educational background present — see CV tab for details.',
    recommendation: score >= 80 ? 'strong_yes' : score >= 65 ? 'yes' : score >= 50 ? 'maybe' : 'no',
    language: lang,
    firstName,
    lastName,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0].trim() : undefined,
  }
}
