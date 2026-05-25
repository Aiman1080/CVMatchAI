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
  outputLocale?: string,
): Promise<CVAnalysisResult> {
  if (isDemoMode()) {
    return generateDemoAnalysis(cvText, vacancyTitle)
  }

  const client = getClient()

  const langInstruction = outputLocale === 'fr' ? '\n\nIMPORTANT: Write ALL text fields (summary, strengths, weaknesses, experience, education) in French.'
    : outputLocale === 'nl' ? '\n\nIMPORTANT: Write ALL text fields (summary, strengths, weaknesses, experience, education) in Dutch.'
    : outputLocale === 'de' ? '\n\nIMPORTANT: Write ALL text fields (summary, strengths, weaknesses, experience, education) in German.'
    : ''

  const userContent =
    `Carefully analyze the job application below against the vacancy requirements, then call submit_cv_analysis with your complete assessment.${langInstruction}

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
  const namePartRe = /^([A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+(?:\s+(?:de|van|der|den|du|des|le|la|el|von|af|bin|al)?\s*[A-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ][a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿ'-]+){1,3})\s*$/

  const tryExtract = (segment: string): { firstName: string; lastName: string } | null => {
    const s = segment.trim()
    if (!s || /[@+\/\\]/.test(s) || /^\d/.test(s) || /https?:|www\.|linkedin|github/i.test(s)) return null
    const words = s.split(/\s+/)
    if (words.every(w => w === w.toUpperCase() && w.length > 1)) return null
    if (words.some(w => NOT_A_NAME.has(w.toLowerCase()))) return null
    const match = namePartRe.exec(s)
    if (match) {
      const parts = match[1].trim().split(/\s+/)
      if (parts.length >= 2) return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
    }
    return null
  }

  for (const line of lines.slice(0, 10)) {
    // Try the full line first, then try just the part before a separator (handles "Jean Dupont - Engineer")
    const segments = [line, ...line.split(/\s*[-|,]\s*/)]
    for (const seg of segments) {
      const result = tryExtract(seg)
      if (result) return result
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
  const phoneMatch = cvText.match(/(?:\+\d{1,3}[\s.-]?)?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,3}/)
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

// ── Interview Questions Generation ───────────────────────────────────────────

const INTERVIEW_QUESTIONS_TOOL: Anthropic.Tool = {
  name: 'submit_interview_questions',
  description: 'Submit personalized interview questions based on the candidate CV and vacancy requirements.',
  input_schema: {
    type: 'object' as const,
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'The interview question' },
            category: { type: 'string', enum: ['technical', 'behavioral', 'situational', 'cultural'], description: 'Category of the question' },
            rationale: { type: 'string', description: 'Why this question is relevant for this candidate and role' },
            expectedAnswer: { type: 'string', description: 'A concise 1-2 sentence expected good answer or key points to listen for' },
          },
          required: ['question', 'category', 'rationale', 'expectedAnswer'],
        },
        description: 'Array of 8 personalized interview questions',
      },
    },
    required: ['questions'],
  },
}

export async function generateInterviewQuestions(
  cvText: string,
  vacancyTitle: string,
  vacancyDescription: string,
  vacancyRequirements: string,
  language: string = 'en',
): Promise<{ questions: Array<{ question: string; category: string; rationale: string; expectedAnswer: string }> }> {
  if (isDemoMode()) {
    return {
      questions: [
        { question: 'Can you describe a challenging technical problem you solved recently and how you approached it?', category: 'technical', rationale: 'Assesses problem-solving ability and technical depth relevant to the role.', expectedAnswer: 'A strong answer describes a specific problem, the systematic debugging or design approach taken, and the measurable outcome or lesson learned.' },
        { question: 'How do you stay current with new technologies and industry trends?', category: 'technical', rationale: 'Evaluates continuous learning mindset important for technical roles.', expectedAnswer: 'Look for concrete habits such as following specific blogs, attending conferences, contributing to open source, or dedicating regular time to side projects and courses.' },
        { question: 'Tell me about a time you had to work with a difficult team member. How did you handle the situation?', category: 'behavioral', rationale: 'Assesses interpersonal skills and conflict resolution ability.', expectedAnswer: 'A good response shows empathy, direct communication, and a focus on finding common ground or involving a mediator rather than escalating conflict.' },
        { question: 'Describe a project where you had to meet a tight deadline. What was your approach?', category: 'behavioral', rationale: 'Evaluates time management and performance under pressure.', expectedAnswer: 'Expect mention of prioritization techniques, scope negotiation, clear communication with stakeholders, and delegation where appropriate.' },
        { question: 'If you were assigned a project using a technology you have never worked with, how would you approach it?', category: 'situational', rationale: 'Tests adaptability and learning strategy in unfamiliar situations.', expectedAnswer: 'Strong candidates mention structured learning (documentation, tutorials), building a small proof-of-concept, and seeking guidance from experienced colleagues.' },
        { question: 'Imagine a stakeholder changes the requirements midway through a sprint. How would you handle this?', category: 'situational', rationale: 'Assesses flexibility and stakeholder management skills.', expectedAnswer: 'Look for impact assessment, transparent communication about trade-offs, re-prioritization with the product owner, and a pragmatic approach to scope adjustment.' },
      ],
    }
  }

  const client = getClient()

  const langInstruction = language === 'nl' ? 'Respond in Dutch.' : language === 'fr' ? 'Respond in French.' : 'Respond in English.'

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are an expert HR interviewer with deep experience in structured interviewing techniques. Generate 8 personalized interview questions based on the candidate's CV, focusing on gaps, strengths, and the specific role requirements. Include a mix of technical, behavioral, situational, and cultural fit questions. Each question should be tailored — not generic. For each question, also provide a concise expected answer (1-2 sentences) describing what a good response should include. ${langInstruction}`,
      tool_choice: { type: 'any' as const },
      tools: [INTERVIEW_QUESTIONS_TOOL],
      messages: [{
        role: 'user',
        content: `Generate 8 personalized interview questions for this candidate and role.

VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1500)}
Requirements: ${vacancyRequirements.slice(0, 1000)}

CANDIDATE CV:
${cvText.slice(0, 5000)}

Call submit_interview_questions now.`,
      }],
    })

    const block = response.content?.find((b: any) => b.type === 'tool_use')
    if (block?.type === 'tool_use') {
      return (block as any).input as { questions: Array<{ question: string; category: string; rationale: string; expectedAnswer: string }> }
    }
  } catch (error) {
    console.error('[AI] generateInterviewQuestions error:', error)
  }

  // Fallback to demo questions
  return {
    questions: [
      { question: 'Can you describe a challenging technical problem you solved recently and how you approached it?', category: 'technical', rationale: 'Assesses problem-solving ability and technical depth relevant to the role.', expectedAnswer: 'A strong answer describes a specific problem, the systematic debugging or design approach taken, and the measurable outcome or lesson learned.' },
      { question: 'How do you stay current with new technologies and industry trends?', category: 'technical', rationale: 'Evaluates continuous learning mindset important for technical roles.', expectedAnswer: 'Look for concrete habits such as following specific blogs, attending conferences, contributing to open source, or dedicating regular time to side projects and courses.' },
      { question: 'Tell me about a time you had to work with a difficult team member. How did you handle the situation?', category: 'behavioral', rationale: 'Assesses interpersonal skills and conflict resolution ability.', expectedAnswer: 'A good response shows empathy, direct communication, and a focus on finding common ground or involving a mediator rather than escalating conflict.' },
      { question: 'Describe a project where you had to meet a tight deadline. What was your approach?', category: 'behavioral', rationale: 'Evaluates time management and performance under pressure.', expectedAnswer: 'Expect mention of prioritization techniques, scope negotiation, clear communication with stakeholders, and delegation where appropriate.' },
      { question: 'If you were assigned a project using a technology you have never worked with, how would you approach it?', category: 'situational', rationale: 'Tests adaptability and learning strategy in unfamiliar situations.', expectedAnswer: 'Strong candidates mention structured learning (documentation, tutorials), building a small proof-of-concept, and seeking guidance from experienced colleagues.' },
      { question: 'Imagine a stakeholder changes the requirements midway through a sprint. How would you handle this?', category: 'situational', rationale: 'Assesses flexibility and stakeholder management skills.', expectedAnswer: 'Look for impact assessment, transparent communication about trade-offs, re-prioritization with the product owner, and a pragmatic approach to scope adjustment.' },
    ],
  }
}

// ── Job Description Generation ───────────────────────────────────────────────

const JOB_DESCRIPTION_TOOL: Anthropic.Tool = {
  name: 'submit_job_description',
  description: 'Submit a generated job description with requirements and nice-to-haves.',
  input_schema: {
    type: 'object' as const,
    properties: {
      description: { type: 'string', description: 'Full job description, 200-300 words, professional and attractive' },
      requirements: { type: 'string', description: 'Bullet list of must-have requirements (each on new line starting with -)' },
      niceToHave: { type: 'string', description: 'Bullet list of nice-to-have qualifications (each on new line starting with -)' },
    },
    required: ['description', 'requirements', 'niceToHave'],
  },
}

export async function generateJobDescription(
  title: string,
  keywords: string,
  language: string = 'en',
  company?: string,
): Promise<{ description: string; requirements: string; niceToHave: string }> {
  if (isDemoMode()) {
    const companyLine = company ? ` at ${company}` : ''
    return {
      description: `We are looking for a talented ${title}${companyLine} to join our team. In this role, you will work on exciting projects involving ${keywords || 'modern technologies'}. You will collaborate with cross-functional teams to deliver high-quality solutions that drive business impact. This is an opportunity to grow your career in a dynamic, supportive environment where innovation is valued. You will have the autonomy to make technical decisions while receiving mentorship from experienced professionals. We offer competitive compensation, flexible working arrangements, and continuous learning opportunities.`,
      requirements: `- Proven experience as a ${title} or in a similar role\n- Strong knowledge of ${keywords || 'relevant technologies'}\n- Excellent communication skills and ability to work in a team\n- Problem-solving mindset and attention to detail\n- Bachelor's degree in a relevant field or equivalent experience`,
      niceToHave: `- Experience with agile methodologies (Scrum/Kanban)\n- Knowledge of cloud platforms (AWS, Azure, or GCP)\n- Contributions to open source projects\n- Multilingual capabilities (English, Dutch, or French)`,
    }
  }

  const client = getClient()

  const langInstruction = language === 'nl' ? 'Write in Dutch.' : language === 'fr' ? 'Write in French.' : 'Write in English.'
  const companyContext = company ? ` The company is "${company}".` : ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are an expert HR copywriter specializing in creating professional, attractive, and inclusive job descriptions that attract top talent. Write compelling descriptions that clearly communicate the role, responsibilities, and growth opportunities. ${langInstruction}`,
      tool_choice: { type: 'any' as const },
      tools: [JOB_DESCRIPTION_TOOL],
      messages: [{
        role: 'user',
        content: `Generate a professional job description for the following role.

Title: ${title}
Keywords/Focus areas: ${keywords || 'Not specified'}${companyContext}

Create a compelling description (200-300 words), a clear list of must-have requirements, and a list of nice-to-have qualifications. Call submit_job_description now.`,
      }],
    })

    const block = response.content?.find((b: any) => b.type === 'tool_use')
    if (block?.type === 'tool_use') {
      return (block as any).input as { description: string; requirements: string; niceToHave: string }
    }
  } catch (error) {
    console.error('[AI] generateJobDescription error:', error)
  }

  // Fallback to demo
  const companyLine = company ? ` at ${company}` : ''
  return {
    description: `We are looking for a talented ${title}${companyLine}. ${keywords || 'Modern technologies'} experience required. Collaborative team environment with growth opportunities.`,
    requirements: `- Proven experience as a ${title}\n- Strong knowledge of ${keywords || 'relevant technologies'}\n- Excellent communication skills\n- Problem-solving mindset`,
    niceToHave: `- Experience with agile methodologies\n- Cloud platform knowledge\n- Multilingual capabilities`,
  }
}

// ── Candidate Ranking ────────────────────────────────────────────────────────

const RANKING_TOOL: Anthropic.Tool = {
  name: 'submit_ranking',
  description: 'Submit the ranked list of candidates with reasoning.',
  input_schema: {
    type: 'object' as const,
    properties: {
      ranking: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            candidateId: { type: 'string', description: 'The candidate ID' },
            rank: { type: 'number', description: 'Rank position (1 = best)' },
            reasoning: { type: 'string', description: '2-3 sentences explaining why this candidate is ranked here' },
            standoutFactor: { type: 'string', description: '1 sentence describing what uniquely differentiates this candidate' },
          },
          required: ['candidateId', 'rank', 'reasoning', 'standoutFactor'],
        },
        description: 'Array of ranked candidates',
      },
    },
    required: ['ranking'],
  },
}

export async function rankCandidates(
  candidates: Array<{ id: string; firstName: string; lastName: string; matchScore: number; summary: string; strengths: string; weaknesses: string; skills: string; experience: string }>,
  vacancyTitle: string,
  vacancyDescription: string,
  vacancyRequirements: string,
  language: string = 'en',
): Promise<{ ranking: Array<{ candidateId: string; rank: number; reasoning: string; standoutFactor: string }> }> {
  // Limit to top 10 candidates by matchScore
  const topCandidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore).slice(0, 10)

  if (isDemoMode()) {
    const ranking = topCandidates.map((c, idx) => ({
      candidateId: c.id,
      rank: idx + 1,
      reasoning: `${c.firstName} ${c.lastName} achieved a match score of ${c.matchScore}%. ${c.strengths ? `Key strengths include: ${c.strengths.slice(0, 100)}.` : 'Profile demonstrates relevant qualifications.'} ${idx === 0 ? 'Ranked first based on highest overall match with vacancy requirements.' : `Ranked below higher-scoring candidates due to relative gaps.`}`,
      standoutFactor: idx === 0 ? `Highest overall match score (${c.matchScore}%) with strong alignment to core requirements.` : `Brings ${c.skills ? c.skills.split(',')[0]?.trim() || 'relevant expertise' : 'relevant expertise'} to the team.`,
    }))
    return { ranking }
  }

  const client = getClient()

  const langInstruction = language === 'nl' ? 'Respond in Dutch.' : language === 'fr' ? 'Respond in French.' : 'Respond in English.'

  const candidateSummaries = topCandidates.map(c =>
    `ID: ${c.id} | Name: ${c.firstName} ${c.lastName} | Score: ${c.matchScore}%\nSummary: ${c.summary?.slice(0, 200) || 'N/A'}\nStrengths: ${c.strengths?.slice(0, 150) || 'N/A'}\nWeaknesses: ${c.weaknesses?.slice(0, 150) || 'N/A'}\nSkills: ${c.skills?.slice(0, 100) || 'N/A'}\nExperience: ${c.experience?.slice(0, 150) || 'N/A'}`
  ).join('\n\n')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are an expert talent evaluator. Rank the candidates for the specified role. Explain clearly WHY each candidate is ranked in their position — what makes #1 better than #2, etc. Focus on role fit, not just overall quality. ${langInstruction}`,
      tool_choice: { type: 'any' as const },
      tools: [RANKING_TOOL],
      messages: [{
        role: 'user',
        content: `Rank these candidates for the following vacancy.

VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1000)}
Requirements: ${vacancyRequirements.slice(0, 800)}

CANDIDATES:
${candidateSummaries}

Call submit_ranking now.`,
      }],
    })

    const block = response.content?.find((b: any) => b.type === 'tool_use')
    if (block?.type === 'tool_use') {
      return (block as any).input as { ranking: Array<{ candidateId: string; rank: number; reasoning: string; standoutFactor: string }> }
    }
  } catch (error) {
    console.error('[AI] rankCandidates error:', error)
  }

  // Fallback to demo ranking
  const fallback = topCandidates.map((c, idx) => ({
    candidateId: c.id,
    rank: idx + 1,
    reasoning: `${c.firstName} ${c.lastName} scored ${c.matchScore}%. ${idx === 0 ? 'Highest match with role requirements.' : 'Solid profile with some gaps relative to top candidate.'}`,
    standoutFactor: `${c.skills ? c.skills.split(',')[0]?.trim() || 'Relevant expertise' : 'Relevant expertise'} for this role.`,
  }))
  return { ranking: fallback }
}

// ── Hiring Report Generation ─────────────────────────────────────────────────

const HIRING_REPORT_TOOL: Anthropic.Tool = {
  name: 'submit_hiring_report',
  description: 'Submit the formatted hiring report.',
  input_schema: {
    type: 'object' as const,
    properties: {
      report: { type: 'string', description: 'Complete hiring report in markdown format' },
    },
    required: ['report'],
  },
}

export async function generateHiringReport(
  candidate: { firstName: string; lastName: string; email?: string; phone?: string; matchScore: number; summary: string; strengths: string; weaknesses: string; skills: string; experience: string; education: string; recommendation: string },
  vacancyTitle: string,
  vacancyDescription: string,
  language: string = 'en',
): Promise<{ report: string }> {
  if (isDemoMode()) {
    const scoreInterpretation = candidate.matchScore >= 80 ? 'Excellent match' : candidate.matchScore >= 65 ? 'Good match' : candidate.matchScore >= 50 ? 'Moderate match' : 'Below expectations'
    const recLabel = candidate.recommendation === 'strong_yes' ? 'Strongly Recommended' : candidate.recommendation === 'yes' ? 'Recommended' : candidate.recommendation === 'maybe' ? 'Consider with Reservations' : 'Not Recommended'

    const report = `# Hiring Report

## Candidate Overview
- **Name:** ${candidate.firstName} ${candidate.lastName}
- **Position:** ${vacancyTitle}${candidate.email ? `\n- **Email:** ${candidate.email}` : ''}${candidate.phone ? `\n- **Phone:** ${candidate.phone}` : ''}
- **Report Date:** ${new Date().toLocaleDateString()}

## Match Score: ${candidate.matchScore}% — ${scoreInterpretation}

## Key Qualifications
${candidate.skills ? candidate.skills.split(',').slice(0, 6).map(s => `- ${s.trim()}`).join('\n') : '- See CV for detailed qualifications'}

## Professional Summary
${candidate.summary || 'Summary not available — review CV for details.'}

## Strengths
${candidate.strengths || '- Relevant professional background\n- Skills aligned with role requirements'}

## Areas of Concern
${candidate.weaknesses || '- Detailed assessment requires full AI analysis\n- Some requirements need interview verification'}

## Experience & Education
**Experience:** ${candidate.experience || 'See CV for details'}

**Education:** ${candidate.education || 'See CV for details'}

## Final Recommendation: ${recLabel}

${candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes' ? 'This candidate demonstrates strong alignment with the role requirements. Recommend proceeding to interview stage.' : candidate.recommendation === 'maybe' ? 'This candidate shows potential but has gaps that should be explored in an interview. Consider alongside stronger candidates.' : 'This candidate does not meet the core requirements for this role. Recommend focusing on other applicants.'}

---
*Generated by CVMatchAI — Demo Mode*`

    return { report }
  }

  const client = getClient()

  const langInstruction = language === 'nl' ? 'Write in Dutch.' : language === 'fr' ? 'Write in French.' : 'Write in English.'

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are an expert HR professional. Generate a professional 1-page hiring report for a hiring manager. Include: candidate overview, match score with interpretation, key qualifications, strengths summary, areas of concern, skills assessment, and final recommendation. Keep it concise and actionable. Format in clean markdown. ${langInstruction}`,
      tool_choice: { type: 'any' as const },
      tools: [HIRING_REPORT_TOOL],
      messages: [{
        role: 'user',
        content: `Generate a hiring report for this candidate.

VACANCY: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1000)}

CANDIDATE:
Name: ${candidate.firstName} ${candidate.lastName}
Email: ${candidate.email || 'N/A'}
Phone: ${candidate.phone || 'N/A'}
Match Score: ${candidate.matchScore}%
Summary: ${candidate.summary}
Strengths: ${candidate.strengths}
Weaknesses: ${candidate.weaknesses}
Skills: ${candidate.skills}
Experience: ${candidate.experience}
Education: ${candidate.education}
Recommendation: ${candidate.recommendation}

Call submit_hiring_report now.`,
      }],
    })

    const block = response.content?.find((b: any) => b.type === 'tool_use')
    if (block?.type === 'tool_use') {
      return (block as any).input as { report: string }
    }
  } catch (error) {
    console.error('[AI] generateHiringReport error:', error)
  }

  // Fallback to demo report
  const recLabel = candidate.recommendation === 'strong_yes' ? 'Strongly Recommended' : candidate.recommendation === 'yes' ? 'Recommended' : candidate.recommendation === 'maybe' ? 'Consider' : 'Not Recommended'
  return { report: `# Hiring Report\n\n**Candidate:** ${candidate.firstName} ${candidate.lastName}\n**Position:** ${vacancyTitle}\n**Score:** ${candidate.matchScore}%\n**Recommendation:** ${recLabel}\n\n## Summary\n${candidate.summary || 'See CV for details.'}\n\n---\n*Generated by CVMatchAI*` }
}
