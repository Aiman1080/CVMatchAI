// AI analysis module — uses Anthropic's tool-use agent pattern for structured CV analysis.
// When ANTHROPIC_API_KEY is empty the module falls back to generateDemoAnalysis() so the
// app works out of the box without a paid API key.
import Anthropic from '@anthropic-ai/sdk'

// Demo mode: no real API key configured — all AI calls return deterministic mock data
const isDemoMode = () =>
  !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === ''

// Create a new client per call to pick up env-var changes without restarting the server
const getClient = () =>
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

// Tool definition for structured CV analysis output
const cvAnalysisTool: Anthropic.Messages.Tool = {
  name: 'submit_cv_analysis',
  description: 'Submit the complete CV analysis result after reviewing all documents',
  input_schema: {
    type: 'object' as const,
    properties: {
      matchScore: {
        type: 'number',
        description: 'Match score 0-100 reflecting how well the candidate fits the vacancy',
      },
      summary: {
        type: 'string',
        description: '2-3 sentence professional summary of the candidate',
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of 2-4 key strengths relative to the vacancy',
      },
      weaknesses: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of 1-3 areas of concern or missing requirements',
      },
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Extracted technical and soft skills from the CV',
      },
      experience: {
        type: 'string',
        description: 'Brief summary of work experience',
      },
      education: {
        type: 'string',
        description: 'Brief summary of educational background',
      },
      recommendation: {
        type: 'string',
        enum: ['strong_yes', 'yes', 'maybe', 'no'],
        description: 'Hiring recommendation',
      },
      language: {
        type: 'string',
        enum: ['nl', 'en', 'fr', 'de'],
        description: 'Detected language of the CV',
      },
      firstName: { type: 'string', description: 'Extracted first name if found' },
      lastName: { type: 'string', description: 'Extracted last name if found' },
      email: { type: 'string', description: 'Extracted email address if found' },
      phone: { type: 'string', description: 'Extracted phone number if found' },
    },
    required: ['matchScore', 'summary', 'strengths', 'weaknesses', 'skills',
      'experience', 'education', 'recommendation', 'language'],
  },
}

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

  const userMessage = `You are an expert HR recruiter. Carefully analyze the CV and motivation letter below against the job vacancy, then call submit_cv_analysis with your structured findings.

CRITICAL EXTRACTION RULES:
- firstName / lastName: Extract the CANDIDATE'S personal name only. It is always on the FIRST line(s) of the CV. NEVER use a company name, university name, school name, or section header (like "EXPERIENCE", "EDUCATION") as a name.
- education: List specific degrees with institution name and year, e.g. "Master Computer Science — KU Leuven (2020), Bachelor Applied Informatics — HoGent (2018)". Do NOT list job titles or work experience here.
- experience: Summarize job roles chronologically. Do NOT include education here.
- matchScore: Score 0-100 based strictly on how well the candidate meets the listed requirements.
- language: Detect from the CV text (nl/fr/en/de).

JOB VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1500)}
Requirements: ${vacancyRequirements.slice(0, 1000)}

CANDIDATE CV:
${cvText.slice(0, 6000)}

${motivationText ? `MOTIVATION LETTER:\n${motivationText.slice(0, 2000)}` : ''}

Now call submit_cv_analysis with your complete, accurate assessment.`

  try {
    // Agentic tool-use loop: run until the model calls the tool
    const messages: Anthropic.Messages.MessageParam[] = [{ role: 'user', content: userMessage }]
    let lastResponse: Anthropic.Messages.Message | null = null

    for (let i = 0; i < 3; i++) {
      lastResponse = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        tools: [cvAnalysisTool],
        tool_choice: { type: 'auto' },
        messages,
      })

      // Check for tool use in the response
      for (const block of lastResponse.content) {
        if (block.type === 'tool_use' && block.name === 'submit_cv_analysis') {
          return block.input as CVAnalysisResult
        }
      }

      if (lastResponse.stop_reason === 'end_turn') break

      // Continue the agent loop
      messages.push({ role: 'assistant', content: lastResponse.content })
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: 'Please call submit_cv_analysis with your analysis.' }],
      })
    }

    // Fallback: try to parse any text content as JSON
    if (lastResponse) {
      const textBlock = lastResponse.content.find(
        (b): b is Anthropic.Messages.TextBlock => b.type === 'text',
      )
      if (textBlock) {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) return JSON.parse(jsonMatch[0]) as CVAnalysisResult
      }
    }

    return generateDemoAnalysis(cvText, vacancyTitle)
  } catch (error) {
    console.error('AI analysis error:', error)
    return generateDemoAnalysis(cvText, vacancyTitle)
  }
}

// Tool for extracting email metadata to determine if it contains recruitment documents
const emailRelevanceTool: Anthropic.Messages.Tool = {
  name: 'classify_email',
  description: 'Classify whether this email contains recruitment-relevant content (CV, motivation letter, job application)',
  input_schema: {
    type: 'object' as const,
    properties: {
      isRelevant: {
        type: 'boolean',
        description: 'True if email appears to be a job application with CV/motivation letter',
      },
      candidateName: { type: 'string', description: 'Candidate name if detectable from email' },
      appliedPosition: { type: 'string', description: 'Position they applied for if mentioned' },
      hasAttachments: { type: 'boolean', description: 'Whether attachments are likely present' },
      confidence: { type: 'number', description: 'Confidence score 0-100' },
    },
    required: ['isRelevant', 'confidence'],
  },
}

export async function classifyRecruitmentEmail(
  subject: string,
  bodyPreview: string,
  attachmentNames: string[],
): Promise<{ isRelevant: boolean; candidateName?: string; appliedPosition?: string; confidence: number }> {
  if (isDemoMode()) {
    const relevantKeywords = ['sollicitatie', 'application', 'cv', 'resume', 'motivation', 'candidature', 'apply', 'kandidaat']
    const text = `${subject} ${bodyPreview}`.toLowerCase()
    const isRelevant = relevantKeywords.some(k => text.includes(k)) ||
      attachmentNames.some(n => /\.(pdf|docx?)/i.test(n))
    return { isRelevant, confidence: isRelevant ? 85 : 20 }
  }

  const client = getClient()

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 256,
      tools: [emailRelevanceTool],
      tool_choice: { type: 'any' },
      messages: [{
        role: 'user',
        content: `Classify this email for recruitment relevance:\n\nSubject: ${subject}\nBody preview: ${bodyPreview.slice(0, 500)}\nAttachments: ${attachmentNames.join(', ') || 'none'}\n\nCall classify_email with your assessment.`,
      }],
    })

    for (const block of response.content) {
      if (block.type === 'tool_use' && block.name === 'classify_email') {
        const input = block.input as any
        return {
          isRelevant: input.isRelevant,
          candidateName: input.candidateName,
          appliedPosition: input.appliedPosition,
          confidence: input.confidence,
        }
      }
    }
  } catch (error) {
    console.error('Email classification error:', error)
  }

  return { isRelevant: false, confidence: 0 }
}

export async function detectDocumentType(text: string): Promise<'cv' | 'motivation' | 'other'> {
  const lower = text.toLowerCase()
  const cvKeywords = ['experience', 'education', 'skills', 'work history', 'curriculum vitae', 'resume',
    'werkervaring', 'opleiding', 'vaardigheden', 'expérience', 'formation']
  const motivationKeywords = ['dear', 'i am writing', 'apply', 'motivation', 'sollicitatie', 'geachte',
    'motivatie', 'candidature', 'lettre']

  const cvScore = cvKeywords.filter(k => lower.includes(k)).length
  const motScore = motivationKeywords.filter(k => lower.includes(k)).length

  if (cvScore > motScore) return 'cv'
  if (motScore > 0) return 'motivation'
  return 'other'
}

export async function generateRecruiterInsights(candidates: Array<{
  name: string
  matchScore: number
  strengths: string[]
  weaknesses: string[]
}>): Promise<string> {
  if (candidates.length === 0) return 'No candidates to analyze yet.'
  const top = [...candidates].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
  return `Top ${top.length} candidates identified. ${top[0].name} leads with ${top[0].matchScore.toFixed(0)}% match. Recommend prioritizing top candidates for interviews.`
}

// Deterministic hash so re-analyzing the same CV always returns the same score
function hashScore(cv: string, title: string): number {
  const s = (cv + title).slice(0, 600)
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h) % 35
}

// Words that must never be treated as a candidate's first name
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

  // A person name line: 2–4 words, title-cased (not all-caps), no special chars like @/+/|
  // Allows particles: de, van, der, den, le, la, el, von, af, bin, du, des
  const nameLineRe = /^([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+(?:\s+(?:de|van|der|den|du|des|le|la|el|von|af|bin|bin|al|de la|von der)?\s*[A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+){1,3})\s*$/

  for (const line of lines.slice(0, 10)) {
    // Skip lines with contact info or special chars
    if (/[@+|\/\\]/.test(line)) continue
    if (/^\d/.test(line)) continue
    if (/https?:|www\.|linkedin|github/i.test(line)) continue

    // Skip all-caps lines (section headers like EDUCATION, EXPERIENCE)
    const words = line.split(/\s+/)
    if (words.every(w => w === w.toUpperCase() && w.length > 1)) continue

    // Skip if any word is a known non-name word
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
  // Collect next lines until the next section header (all-caps or known header keyword)
  const result: string[] = []
  for (let i = idx + 1; i < Math.min(idx + 12, lines.length); i++) {
    const l = lines[i]
    if (!l) continue
    // Stop at next section header
    const isHeader = (l === l.toUpperCase() && l.length > 3 && /^[A-Z]/.test(l)) ||
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

  // Skills detection
  const techSkills = ['React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'AWS', 'Docker',
    'Figma', 'Java', 'Vue.js', 'JavaScript', 'CSS', 'HTML', 'dbt', 'Airflow', 'Kafka',
    'PostgreSQL', 'MongoDB', 'Redis', 'Kubernetes', 'Terraform', 'GraphQL', 'NestJS']
  const detectedSkills = techSkills.filter(s => lower.includes(s.toLowerCase())).slice(0, 6)
  if (detectedSkills.length === 0) detectedSkills.push('Communication', 'Problem-solving', 'Teamwork')

  // Contact info
  const emailMatch = cvText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = cvText.match(/(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/)

  // Name — uses dedicated extractor that rejects school/company names
  const { firstName, lastName } = extractName(cvText)

  // Education — look for the education section and extract real content
  const eduSection = extractSection(cvText, [
    'education', 'opleiding', 'formation', 'études', 'etudes', 'academic',
    'diplom', 'degree', 'qualifications', 'scholarships',
  ])
  const education = eduSection || 'Educational background present in CV — see CV tab for details.'

  // Experience — look for the experience section
  const expSection = extractSection(cvText, [
    'experience', 'werkervaring', 'expérience', 'employment', 'work history',
    'professional background', 'carrière', 'career', 'positions',
  ])
  const experience = expSection || 'Work experience present in CV — see CV tab for details.'

  // Language detection
  const lang: 'nl' | 'fr' | 'en' | 'de' =
    (lower.includes('werkervaring') || lower.includes('opleiding') || lower.includes('vaardigheden')) ? 'nl' :
    (lower.includes('expérience') || lower.includes('formation') || lower.includes('compétences')) ? 'fr' :
    (lower.includes('berufserfahrung') || lower.includes('ausbildung')) ? 'de' : 'en'

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
