// AI analysis module — uses the Anthropic Agent SDK (betaZodTool + toolRunner) for structured
// CV and motivation letter analysis.  Falls back to generateDemoAnalysis() when no API key
// is configured so the app works out-of-the-box without a paid account.
import Anthropic, { BadRequestError, RateLimitError, AuthenticationError } from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
// The SDK's betaZodTool imports from zod/v4 — we must use the same subpath for type compatibility
import { z } from 'zod/v4'

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

// Zod schema — single source of truth for both TypeScript types AND the JSON Schema
// that the Anthropic SDK auto-generates for the tool definition.
const CvAnalysisSchema = z.object({
  matchScore: z.number().describe(
    'Match score 0-100 reflecting how well the candidate meets the vacancy requirements. Be strict — not every candidate scores 70+.',
  ),
  summary: z.string().describe('2-3 sentence professional summary of the candidate relative to the role'),
  strengths: z.array(z.string()).describe('2-4 key strengths relevant to this specific vacancy'),
  weaknesses: z.array(z.string()).describe('1-3 gaps or areas of concern relative to the vacancy requirements'),
  skills: z.array(z.string()).describe('Technical and soft skills extracted from the CV text'),
  experience: z.string().describe(
    'Chronological summary of job roles only. Do NOT include education or school projects here.',
  ),
  education: z.string().describe(
    'Specific degrees with institution and graduation year, e.g. "Master Computer Science — KU Leuven (2021), Bachelor Applied Informatics — HoGent (2018)". Do NOT list job titles here.',
  ),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no']).describe('Hiring recommendation based on vacancy fit'),
  language: z.enum(['nl', 'en', 'fr', 'de']).describe('Dominant language detected in the CV text'),
  firstName: z.string().optional().describe(
    "Candidate's personal given name — found on the VERY FIRST non-empty line of the CV. NEVER a school name (KU Leuven, HoGent…), company name, job title, or section header (EDUCATION, EXPERIENCE, SKILLS…). Leave empty if uncertain.",
  ),
  lastName: z.string().optional().describe(
    "Candidate's family name — from the first line alongside firstName. Same rules apply: never a school, company, or header word.",
  ),
  email: z.string().optional().describe('Email address extracted from the CV, if present'),
  phone: z.string().optional().describe('Phone number extracted from the CV, if present'),
})

// Static system prompt — marked for prompt caching so repeated analyses of different
// candidates against the same vacancy reuse the cached prefix (≈90% cost reduction).
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
  const capture: { result: CVAnalysisResult | null } = { result: null }

  // betaZodTool: Zod schema → JSON Schema auto-conversion + typed run() callback.
  // We capture the structured analysis inside run() and return a confirmation string
  // so the agent loop ends naturally on the next turn.
  const cvAnalysisTool = betaZodTool({
    name: 'submit_cv_analysis',
    description:
      'Submit your complete structured analysis after reviewing all documents. Call this exactly once with all fields populated.',
    inputSchema: CvAnalysisSchema,
    run: async (input) => {
      capture.result = input as CVAnalysisResult
      return 'Analysis received and recorded.'
    },
  })

  try {
    const userContent =
      `Carefully analyze the job application below against the vacancy requirements, then call submit_cv_analysis with your complete assessment.

VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1500)}
Requirements: ${vacancyRequirements.slice(0, 1000)}

CANDIDATE CV:
${cvText.slice(0, 6000)}` +
      (motivationText ? `\n\nMOTIVATION LETTER:\n${motivationText.slice(0, 2000)}` : '')

    // toolRunner() handles the full agentic loop: calls the API, executes tool callbacks,
    // feeds results back, and repeats until stop_reason === 'end_turn'.
    // With tool_choice 'any' the first API call is forced to use a tool; after the tool
    // result is returned the model naturally stops, keeping the loop to 2 turns total.
    await client.beta.messages.toolRunner({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: [
        {
          type: 'text' as const,
          text: SYSTEM_PROMPT,
          // Prompt caching: the static system prompt is cached after the first request,
          // saving ~90% of input token cost on every subsequent CV analyzed.
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      tool_choice: { type: 'any' as const },
      tools: [cvAnalysisTool],
      messages: [{ role: 'user', content: userContent }],
    })

    if (capture.result) return capture.result
    return generateDemoAnalysis(cvText, vacancyTitle)
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error('[AI] Rate limit reached — returning demo analysis')
    } else if (error instanceof AuthenticationError) {
      console.error('[AI] API key invalid — returning demo analysis')
    } else if (error instanceof BadRequestError) {
      console.error('[AI] Bad request:', error.message)
    } else {
      console.error('[AI] Analysis error:', error)
    }
    return generateDemoAnalysis(cvText, vacancyTitle)
  }
}

// ── Email classification ──────────────────────────────────────────────────────

const EmailClassificationSchema = z.object({
  isRelevant: z.boolean().describe('True if this is a job application containing a CV or motivation letter'),
  candidateName: z.string().optional().describe('Candidate name if detectable from the email'),
  appliedPosition: z.string().optional().describe('Position applied for if explicitly mentioned'),
  hasAttachments: z.boolean().describe('Whether the email likely has document attachments'),
  confidence: z.number().describe('Confidence score 0-100'),
})

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

  type EmailResult = { isRelevant: boolean; candidateName?: string; appliedPosition?: string; hasAttachments: boolean; confidence: number }
  const client = getClient()
  const capture: { result: EmailResult | null } = { result: null }

  const classifyTool = betaZodTool({
    name: 'classify_email',
    description: 'Classify whether this email is a recruitment-relevant job application',
    inputSchema: EmailClassificationSchema,
    run: async (input) => {
      capture.result = input as EmailResult
      return 'Classification recorded.'
    },
  })

  try {
    // Haiku is sufficient for binary email classification — no reasoning needed
    await client.beta.messages.toolRunner({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      tool_choice: { type: 'any' as const },
      tools: [classifyTool],
      messages: [{
        role: 'user',
        content: `Classify this email for recruitment relevance:\n\nSubject: ${subject}\nBody: ${bodyPreview.slice(0, 500)}\nAttachments: ${attachmentNames.join(', ') || 'none'}\n\nCall classify_email now.`,
      }],
    })

    if (capture.result) {
      return {
        isRelevant: capture.result.isRelevant,
        candidateName: capture.result.candidateName,
        appliedPosition: capture.result.appliedPosition,
        confidence: capture.result.confidence,
      }
    }
  } catch (error) {
    console.error('[AI] Email classification error:', error)
  }

  return { isRelevant: false, confidence: 0 }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const DocTypeSchema = z.object({
  type: z.enum(['cv', 'motivation', 'other']).describe(
    "'cv' for a curriculum vitae / resume, 'motivation' for a cover/motivation letter, 'other' for anything else",
  ),
})

export async function detectDocumentType(text: string): Promise<'cv' | 'motivation' | 'other'> {
  // Fast keyword fallback in demo mode
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
  const capture: { result: { type: 'cv' | 'motivation' | 'other' } | null } = { result: null }

  const docTypeTool = betaZodTool({
    name: 'set_document_type',
    description: 'Set the detected document type',
    inputSchema: DocTypeSchema,
    run: async (input) => {
      capture.result = input as { type: 'cv' | 'motivation' | 'other' }
      return 'Type recorded.'
    },
  })

  try {
    await client.beta.messages.toolRunner({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      tool_choice: { type: 'any' as const },
      tools: [docTypeTool],
      messages: [{
        role: 'user',
        content: `Is this a CV/resume, a motivation/cover letter, or something else?\n\n${text.slice(0, 800)}\n\nCall set_document_type now.`,
      }],
    })
    if (capture.result) return capture.result.type
  } catch (error) {
    console.error('[AI] detectDocumentType error:', error)
  }

  // Keyword fallback if AI call fails
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

// ── Demo-mode analysis (no API key) ──────────────────────────────────────────

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
  'curriculum', 'vitae', 'resume', 'master', 'bachelor', 'licence', 'msc', 'bsc',
  'university', 'université', 'universiteit', 'hogeschool', 'school', 'institute',
  'college', 'academy', 'leuven', 'gent', 'ghent', 'brussels', 'bruxelles',
  'brussel', 'antwerp', 'antwerpen', 'liège', 'liege', 'paris', 'berlin', 'london',
  'senior', 'junior', 'lead', 'manager', 'engineer', 'developer', 'designer',
  'analyst', 'consultant', 'ingénieur', 'développeur', 'responsable',
])

function extractName(cvText: string): { firstName?: string; lastName?: string } {
  const lines = cvText.split('\n').map(l => l.trim()).filter(Boolean)
  const nameLineRe = /^([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+(?:\s+(?:de|van|der|den|du|des|le|la|el|von|af|bin|al|de la|von der)?\s*[A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+){1,3})\s*$/
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

  const eduSection = extractSection(cvText, [
    'education', 'opleiding', 'formation', 'études', 'etudes', 'academic',
    'diplom', 'degree', 'qualifications',
  ])
  const education = eduSection ?? 'Educational background present — see CV tab for details.'

  const expSection = extractSection(cvText, [
    'experience', 'werkervaring', 'expérience', 'employment', 'work history',
    'professional background', 'carrière', 'career', 'positions',
  ])
  const experience = expSection ?? 'Work experience present — see CV tab for details.'

  const lang: 'nl' | 'fr' | 'en' | 'de' =
    lower.includes('werkervaring') || lower.includes('opleiding') || lower.includes('vaardigheden') ? 'nl' :
    lower.includes('expérience') || lower.includes('formation') || lower.includes('compétences') ? 'fr' :
    lower.includes('berufserfahrung') || lower.includes('ausbildung') ? 'de' : 'en'

  return {
    matchScore: score,
    summary: `Candidate presents relevant background for the ${vacancyTitle} role. Profile reviewed in demo mode — re-analyze with a live API key for a full AI assessment.`,
    strengths: ['Relevant professional experience', 'Technical skills matching vacancy', 'Clear structured CV'],
    weaknesses: ['Demo mode: detailed analysis requires AI key', 'Some requirements need interview confirmation'],
    skills: detectedSkills,
    experience,
    education,
    recommendation: score >= 80 ? 'strong_yes' : score >= 65 ? 'yes' : score >= 50 ? 'maybe' : 'no',
    language: lang,
    firstName,
    lastName,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0].trim() : undefined,
  }
}
