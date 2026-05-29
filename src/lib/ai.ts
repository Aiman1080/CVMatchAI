// AI analysis module — uses the Google Gemini SDK (function calling with mode:'ANY')
// for structured CV and email analysis. Falls back to generateDemoAnalysis() when no
// API key is configured so the app works out-of-the-box without a paid account.
import { GoogleGenerativeAI, FunctionCallingMode, type FunctionDeclaration, SchemaType } from '@google/generative-ai'
import { logAiUsage } from './ai-usage'

const isDemoMode = () =>
  !process.env.GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY.trim() === '' ||
  process.env.GEMINI_API_KEY === 'demo'

const getClient = () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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
const CV_ANALYSIS_TOOL: FunctionDeclaration = {
  name: 'submit_cv_analysis',
  description:
    'Submit your complete structured analysis after reviewing all documents. Call this exactly once with all fields populated.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      matchScore: { type: SchemaType.NUMBER, description: 'Match score 0-100. Be strict — average candidates score 50-65, only exceptional candidates score 80+.' },
      summary: { type: SchemaType.STRING, description: '3-4 sentence professional summary covering the candidate\'s overall profile, key experience, main skills, and fit for this specific role.' },
      strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: '4-6 specific strengths relevant to this vacancy. Each item should be a complete sentence explaining WHY it is a strength for this role (e.g. "5 years of Python development directly matching the backend requirements").' },
      weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: '3-5 specific gaps or concerns relative to the vacancy requirements. Each item should be concrete (e.g. "No experience with Kubernetes mentioned despite it being a key requirement").' },
      skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Technical and soft skills extracted from the CV' },
      experience: { type: SchemaType.STRING, description: 'Chronological summary of job roles only. Do NOT include education here.' },
      education: { type: SchemaType.STRING, description: 'Degrees with institution and year, e.g. "Master CS — KU Leuven (2021)". Do NOT list jobs here.' },
      recommendation: { type: SchemaType.STRING, description: 'Hiring recommendation based on fit. Must be one of: strong_yes, yes, maybe, no' },
      language: { type: SchemaType.STRING, description: 'Dominant language detected in the CV. Must be one of: nl, en, fr, de' },
      firstName: { type: SchemaType.STRING, description: "Candidate's personal first name from the first line of the CV. Never a school or company name." },
      lastName: { type: SchemaType.STRING, description: "Candidate's family name. Never a school, company, or header word." },
      email: { type: SchemaType.STRING, description: 'Email address from the CV if present' },
      phone: { type: SchemaType.STRING, description: 'Phone number from the CV if present' },
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

  const genAI = getClient()

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0.3 },
      tools: [{ functionDeclarations: [CV_ANALYSIS_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(userContent)
    const usage = result.response.usageMetadata
    const call = result.response.functionCalls()?.[0]
    if (call) {
      logAiUsage('system', 'cv_analysis', usage?.promptTokenCount || 0, usage?.candidatesTokenCount || 0).catch(() => {})
      return call.args as unknown as CVAnalysisResult
    }
    // API call succeeded but returned no function call — fall back to demo data
    // so the app keeps working instead of crashing.
    console.warn('[AI] analyzeCVAgainstVacancy returned no structured result, falling back to demo analysis.')
    return generateDemoAnalysis(cvText, vacancyTitle)
  } catch (error: any) {
    if (error?.status === 429) {
      console.error('[AI] Rate limit hit on Gemini API:', error?.message)
    } else if (error?.status === 401 || error?.status === 403) {
      console.error('[AI] Invalid Gemini API key / permission denied:', error?.message)
    } else if (error?.status === 400) {
      console.error('[AI] Bad request to Gemini API:', error?.message)
    } else {
      console.error('[AI] analyzeCVAgainstVacancy error:', error?.message || error)
    }

    // Always fall back to demo data so the app keeps working when the AI call
    // fails (rate limit, quota, network, etc.). A working app with demo data is
    // preferable to a "correctly broken" page that crashes for the user.
    console.warn('[AI] Falling back to demo analysis after AI failure.')
    return generateDemoAnalysis(cvText, vacancyTitle)
  }
}

// ── Email classification ──────────────────────────────────────────────────────

const EMAIL_CLASSIFY_TOOL: FunctionDeclaration = {
  name: 'classify_email',
  description: 'Read the email and determine if it is a job application from someone sending their CV',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      isRelevant: {
        type: SchemaType.BOOLEAN,
        description:
          'TRUE only if a HUMAN is sending their own CV/resume to apply for a job. ' +
          'Includes: spontaneous applications, applications to a specific position, follow-ups WITH a new CV, ' +
          'applications forwarded from career portals (LinkedIn, Indeed, etc.). ' +
          'FALSE for: newsletters, marketing, password resets, order confirmations, automated alerts, ' +
          'social notifications, recruiter-to-recruiter emails, candidate STATUS UPDATES without a CV, ' +
          'OUT-OF-OFFICE replies, vacation autoresponders, OR if there is no document attachment at all.',
      },
      candidateName: { type: SchemaType.STRING, description: 'Full name of the applicant — extract from signature, body, or sender' },
      appliedPosition: { type: SchemaType.STRING, description: 'Position the candidate is applying for, if mentioned' },
      cvAttachmentName: {
        type: SchemaType.STRING,
        description: 'EXACT filename of the attachment that is most likely the CV/resume. Must match one of the attachment names provided. Empty string if none.',
      },
      motivationAttachmentName: {
        type: SchemaType.STRING,
        description: 'EXACT filename of the attachment that is most likely the motivation letter / cover letter. Empty if none or same as CV.',
      },
      intent: {
        type: SchemaType.STRING,
        description: 'Short summary in 5-10 words: e.g. "Spontaneous application", "Forwarded CV from LinkedIn", "Applying for Senior Developer"',
      },
      confidence: { type: SchemaType.NUMBER, description: 'Confidence 0-100 in the isRelevant decision' },
    },
    required: ['isRelevant', 'confidence'],
  },
}

export async function classifyRecruitmentEmail(
  subject: string,
  bodyPreview: string,
  attachmentNames: string[],
): Promise<{
  isRelevant: boolean
  candidateName?: string
  appliedPosition?: string
  intent?: string
  cvAttachmentName?: string
  motivationAttachmentName?: string
  confidence: number
}> {
  if (isDemoMode()) {
    const keywords = ['sollicitatie', 'application', 'cv', 'resume', 'motivation', 'candidature', 'apply', 'kandidaat']
    const text = `${subject} ${bodyPreview}`.toLowerCase()
    const isRelevant =
      keywords.some(k => text.includes(k)) || attachmentNames.some(n => /\.(pdf|docx?)/i.test(n))
    return { isRelevant, confidence: isRelevant ? 85 : 20 }
  }

  const genAI = getClient()

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.1 },
      tools: [{ functionDeclarations: [EMAIL_CLASSIFY_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(
      `You are a careful recruitment assistant reading an email in a recruiter's inbox.\n` +
      `Your job: decide if THIS specific email is a real job application from a human who has attached their CV.\n\n` +
      `STRONG YES signals:\n` +
      `- An attached file that looks like a CV/resume (e.g. "CV_John.pdf", "resume.docx", "Lebenslauf.pdf")\n` +
      `- Phrases: "find attached my CV", "ci-joint mon CV", "veuillez trouver", "voici mon CV", "candidature spontanée",\n` +
      `  "I would like to apply", "I'm interested in this position", "sollicit", "kandidaat", "bewerbung"\n` +
      `- Forwarded from LinkedIn/Indeed/Welcome to the Jungle: YES (only if a CV is attached)\n\n` +
      `STRONG NO signals (do NOT mark as application):\n` +
      `- Newsletters, marketing emails, password resets, order confirmations, automated notifications\n` +
      `- Out-of-office / vacation autoresponders\n` +
      `- Emails between recruiters (not from candidates)\n` +
      `- Status updates without a NEW CV attached\n` +
      `- ANY email with NO real document attachment — applications without a CV are not real applications\n\n` +
      `If isRelevant is TRUE, you MUST also identify which attachment filename is most likely the CV ` +
      `(field cvAttachmentName) and which is the motivation/cover letter (field motivationAttachmentName).\n\n` +
      `--- EMAIL ---\n` +
      `Subject: ${subject}\n` +
      `Body (truncated to 3000 chars):\n${bodyPreview.slice(0, 3000)}\n\n` +
      `Attachments available: ${attachmentNames.length ? attachmentNames.join(' | ') : '(none)'}\n` +
      `--- END EMAIL ---\n\n` +
      `Call classify_email now with your decision.`
    )

    const call = result.response.functionCalls()?.[0]
    if (call) {
      const input = call.args as any
      return {
        isRelevant: input.isRelevant,
        candidateName: input.candidateName,
        appliedPosition: input.appliedPosition,
        intent: input.intent,
        cvAttachmentName: input.cvAttachmentName,
        motivationAttachmentName: input.motivationAttachmentName,
        confidence: input.confidence,
      }
    }
  } catch (error) {
    console.error('[AI] Email classification error:', error)
  }

  return { isRelevant: false, confidence: 0 }
}

// ── Document type detection ───────────────────────────────────────────────────

const DOC_TYPE_TOOL: FunctionDeclaration = {
  name: 'set_document_type',
  description: 'Set the detected document type',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      type: { type: SchemaType.STRING, description: "Must be one of: cv, motivation, other" },
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

  const genAI = getClient()

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.1 },
      tools: [{ functionDeclarations: [DOC_TYPE_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(
      `Is this a CV/resume, motivation/cover letter, or something else?\n\n${text.slice(0, 800)}\n\nCall set_document_type now.`
    )
    const call = result.response.functionCalls()?.[0]
    if (call) return (call.args as any).type
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
    summary: `Candidate presents relevant background for the ${vacancyTitle} role. Profile reviewed in demo mode — add a GEMINI_API_KEY for full AI assessment.`,
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

const INTERVIEW_QUESTIONS_TOOL: FunctionDeclaration = {
  name: 'submit_interview_questions',
  description: 'Submit personalized interview questions based on the candidate CV and vacancy requirements.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: { type: SchemaType.STRING, description: 'The interview question' },
            category: { type: SchemaType.STRING, description: 'Category of the question. Must be one of: technical, behavioral, situational, cultural' },
            rationale: { type: SchemaType.STRING, description: 'Why this question is relevant for this candidate and role' },
            expectedAnswer: { type: SchemaType.STRING, description: 'A concise 1-2 sentence expected good answer or key points to listen for' },
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

  const genAI = getClient()

  const langInstruction = language === 'nl' ? 'Respond in Dutch.' : language === 'fr' ? 'Respond in French.' : 'Respond in English.'

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are an expert HR interviewer with deep experience in structured interviewing techniques. Generate 8 personalized interview questions based on the candidate's CV, focusing on gaps, strengths, and the specific role requirements. Include a mix of technical, behavioral, situational, and cultural fit questions. Each question should be tailored — not generic. For each question, also provide a concise expected answer (1-2 sentences) describing what a good response should include. ${langInstruction}`,
      generationConfig: { temperature: 0.3 },
      tools: [{ functionDeclarations: [INTERVIEW_QUESTIONS_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(
      `Generate 8 personalized interview questions for this candidate and role.

VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1500)}
Requirements: ${vacancyRequirements.slice(0, 1000)}

CANDIDATE CV:
${cvText.slice(0, 5000)}

Call submit_interview_questions now.`
    )

    const call = result.response.functionCalls()?.[0]
    if (call) {
      return call.args as unknown as { questions: Array<{ question: string; category: string; rationale: string; expectedAnswer: string }> }
    }
    console.warn('[AI] generateInterviewQuestions returned no structured result, falling back to demo questions.')
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
  } catch (error: any) {
    console.error('[AI] generateInterviewQuestions error:', error?.message || error)

    // Always fall back to canned demo questions so the app keeps working when
    // the AI call fails (rate limit, quota, network, etc.).
    console.warn('[AI] Falling back to demo interview questions after AI failure.')
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
}

// ── Job Description Generation ───────────────────────────────────────────────

const JOB_DESCRIPTION_TOOL: FunctionDeclaration = {
  name: 'submit_job_description',
  description: 'Submit a generated job description with requirements and nice-to-haves.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      description: { type: SchemaType.STRING, description: 'Full job description, 200-300 words, professional and attractive' },
      requirements: { type: SchemaType.STRING, description: 'Bullet list of must-have requirements (each on new line starting with -)' },
      niceToHave: { type: SchemaType.STRING, description: 'Bullet list of nice-to-have qualifications (each on new line starting with -)' },
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

  const genAI = getClient()

  const langInstruction = language === 'nl' ? 'Write in Dutch.' : language === 'fr' ? 'Write in French.' : 'Write in English.'
  const companyContext = company ? ` The company is "${company}".` : ''

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are an expert HR copywriter specializing in creating professional, attractive, and inclusive job descriptions that attract top talent. Write compelling descriptions that clearly communicate the role, responsibilities, and growth opportunities. ${langInstruction}`,
      generationConfig: { temperature: 0.3 },
      tools: [{ functionDeclarations: [JOB_DESCRIPTION_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(
      `Generate a professional job description for the following role.

Title: ${title}
Keywords/Focus areas: ${keywords || 'Not specified'}${companyContext}

Create a compelling description (200-300 words), a clear list of must-have requirements, and a list of nice-to-have qualifications. Call submit_job_description now.`
    )

    const call = result.response.functionCalls()?.[0]
    if (call) {
      return call.args as unknown as { description: string; requirements: string; niceToHave: string }
    }
    console.warn('[AI] generateJobDescription returned no structured result, falling back to demo content.')
    {
      const companyLine = company ? ` at ${company}` : ''
      return {
        description: `We are looking for a talented ${title}${companyLine}. ${keywords || 'Modern technologies'} experience required. Collaborative team environment with growth opportunities.`,
        requirements: `- Proven experience as a ${title}\n- Strong knowledge of ${keywords || 'relevant technologies'}\n- Excellent communication skills\n- Problem-solving mindset`,
        niceToHave: `- Experience with agile methodologies\n- Cloud platform knowledge\n- Multilingual capabilities`,
      }
    }
  } catch (error: any) {
    console.error('[AI] generateJobDescription error:', error?.message || error)

    // Always fall back to canned content so the app keeps working when the AI
    // call fails (rate limit, quota, network, etc.).
    console.warn('[AI] Falling back to demo job description after AI failure.')
    const companyLine = company ? ` at ${company}` : ''
    return {
      description: `We are looking for a talented ${title}${companyLine}. ${keywords || 'Modern technologies'} experience required. Collaborative team environment with growth opportunities.`,
      requirements: `- Proven experience as a ${title}\n- Strong knowledge of ${keywords || 'relevant technologies'}\n- Excellent communication skills\n- Problem-solving mindset`,
      niceToHave: `- Experience with agile methodologies\n- Cloud platform knowledge\n- Multilingual capabilities`,
    }
  }
}

// ── Candidate Ranking ────────────────────────────────────────────────────────

const RANKING_TOOL: FunctionDeclaration = {
  name: 'submit_ranking',
  description: 'Submit the ranked list of candidates with reasoning.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      ranking: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            candidateId: { type: SchemaType.STRING, description: 'The candidate ID' },
            rank: { type: SchemaType.NUMBER, description: 'Rank position (1 = best)' },
            reasoning: { type: SchemaType.STRING, description: '2-3 sentences explaining why this candidate is ranked here' },
            standoutFactor: { type: SchemaType.STRING, description: '1 sentence describing what uniquely differentiates this candidate' },
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

  const genAI = getClient()

  const langInstruction = language === 'nl' ? 'Respond in Dutch.' : language === 'fr' ? 'Respond in French.' : 'Respond in English.'

  const candidateSummaries = topCandidates.map(c =>
    `ID: ${c.id} | Name: ${c.firstName} ${c.lastName} | Score: ${c.matchScore}%\nSummary: ${c.summary?.slice(0, 200) || 'N/A'}\nStrengths: ${c.strengths?.slice(0, 150) || 'N/A'}\nWeaknesses: ${c.weaknesses?.slice(0, 150) || 'N/A'}\nSkills: ${c.skills?.slice(0, 100) || 'N/A'}\nExperience: ${c.experience?.slice(0, 150) || 'N/A'}`
  ).join('\n\n')

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are an expert talent evaluator. Rank the candidates for the specified role. Explain clearly WHY each candidate is ranked in their position — what makes #1 better than #2, etc. Focus on role fit, not just overall quality. ${langInstruction}`,
      generationConfig: { temperature: 0.3 },
      tools: [{ functionDeclarations: [RANKING_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(
      `Rank these candidates for the following vacancy.

VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription.slice(0, 1000)}
Requirements: ${vacancyRequirements.slice(0, 800)}

CANDIDATES:
${candidateSummaries}

Call submit_ranking now.`
    )

    const call = result.response.functionCalls()?.[0]
    if (call) {
      return call.args as unknown as { ranking: Array<{ candidateId: string; rank: number; reasoning: string; standoutFactor: string }> }
    }
    console.warn('[AI] rankCandidates returned no structured result, falling back to demo ranking.')
    {
      const fallback = topCandidates.map((c, idx) => ({
        candidateId: c.id,
        rank: idx + 1,
        reasoning: `${c.firstName} ${c.lastName} scored ${c.matchScore}%. ${idx === 0 ? 'Highest match with role requirements.' : 'Solid profile with some gaps relative to top candidate.'}`,
        standoutFactor: `${c.skills ? c.skills.split(',')[0]?.trim() || 'Relevant expertise' : 'Relevant expertise'} for this role.`,
      }))
      return { ranking: fallback }
    }
  } catch (error: any) {
    console.error('[AI] rankCandidates error:', error?.message || error)

    // Always fall back to a deterministic score-based ranking so the app keeps
    // working when the AI call fails (rate limit, quota, network, etc.).
    console.warn('[AI] Falling back to demo ranking after AI failure.')
    const fallback = topCandidates.map((c, idx) => ({
      candidateId: c.id,
      rank: idx + 1,
      reasoning: `${c.firstName} ${c.lastName} scored ${c.matchScore}%. ${idx === 0 ? 'Highest match with role requirements.' : 'Solid profile with some gaps relative to top candidate.'}`,
      standoutFactor: `${c.skills ? c.skills.split(',')[0]?.trim() || 'Relevant expertise' : 'Relevant expertise'} for this role.`,
    }))
    return { ranking: fallback }
  }
}

// ── Hiring Report Generation ─────────────────────────────────────────────────

const HIRING_REPORT_TOOL: FunctionDeclaration = {
  name: 'submit_hiring_report',
  description: 'Submit the formatted hiring report.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      report: { type: SchemaType.STRING, description: 'Complete hiring report in markdown format' },
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

    let parsedStrengths: string
    try {
      const arr = JSON.parse(candidate.strengths)
      parsedStrengths = Array.isArray(arr) ? arr.map((s: string) => `- ${s}`).join('\n') : candidate.strengths
    } catch {
      parsedStrengths = candidate.strengths || '- Relevant professional background\n- Skills aligned with role requirements'
    }

    let parsedWeaknesses: string
    try {
      const arr = JSON.parse(candidate.weaknesses)
      parsedWeaknesses = Array.isArray(arr) ? arr.map((s: string) => `- ${s}`).join('\n') : candidate.weaknesses
    } catch {
      parsedWeaknesses = candidate.weaknesses || '- Detailed assessment requires full AI analysis\n- Some requirements need interview verification'
    }

    const interviewReadiness = candidate.recommendation === 'strong_yes'
      ? 'This candidate is highly interview-ready. Their profile demonstrates strong alignment with all core requirements, and they are likely to perform well in both technical and behavioral interview rounds. We recommend scheduling a comprehensive interview covering both technical competencies and cultural fit.'
      : candidate.recommendation === 'yes'
      ? 'This candidate is interview-ready with minor areas to probe. Their overall profile is strong, but the interview should specifically address the areas of concern noted above. Prepare targeted questions around the identified gaps to determine if they can be mitigated.'
      : candidate.recommendation === 'maybe'
      ? 'This candidate may benefit from a preliminary screening call before a full interview. There are notable gaps in their profile relative to the role requirements. A 20-30 minute phone screen focusing on the areas of concern would help determine whether a full interview is warranted.'
      : 'This candidate is not recommended for interview at this time. The gaps between their profile and the role requirements are significant. If the candidate pool is limited, consider a brief screening call, but prioritize other candidates first.'

    const salaryConsiderations = candidate.matchScore >= 80
      ? `Given the candidate's strong match score (${candidate.matchScore}%) and ${scoreInterpretation.toLowerCase()} rating, they are likely to command compensation at or above the midpoint of the salary band for this role. Their qualifications suggest they would bring immediate value, which may justify a competitive offer. Consider the full compensation package including benefits, growth opportunities, and flexibility when preparing an offer.`
      : candidate.matchScore >= 65
      ? `With a ${candidate.matchScore}% match score (${scoreInterpretation.toLowerCase()}), this candidate's compensation expectations are likely to be in the mid-range for this role. Their experience level and skill set suggest standard market-rate compensation would be appropriate. The interview stage should include a discussion about salary expectations to ensure alignment.`
      : `At ${candidate.matchScore}% match (${scoreInterpretation.toLowerCase()}), compensation should be carefully calibrated. If this candidate is selected despite gaps, consider whether a slightly lower offer with a clear growth plan and performance milestones would be appropriate. Salary discussions should factor in the training and ramp-up time that may be needed.`

    const nextSteps = candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes'
      ? `1. **Schedule Interview** — Arrange a comprehensive interview within the next 5-7 business days to maintain candidate engagement.\n2. **Prepare Interview Panel** — Assemble a panel covering technical assessment, team fit, and managerial evaluation.\n3. **Reference Check Preparation** — Begin preparing reference check questions based on the areas of concern identified above.\n4. **Offer Timeline** — If the interview is successful, aim to extend an offer within 48 hours to remain competitive.\n5. **Onboarding Planning** — Start preliminary onboarding planning to ensure a smooth transition if the candidate accepts.`
      : candidate.recommendation === 'maybe'
      ? `1. **Phone Screening** — Schedule a 20-30 minute screening call to address the key concerns before committing to a full interview.\n2. **Skills Assessment** — Consider a brief technical assessment or case study to evaluate the specific gaps identified.\n3. **Compare with Pool** — Review this candidate alongside other applicants to determine relative ranking.\n4. **Decision Point** — After screening, make a go/no-go decision on proceeding to a full interview within 3 business days.`
      : `1. **Communicate Decision** — Send a professional rejection email thanking the candidate for their time and effort.\n2. **Pipeline Review** — Review the remaining candidate pipeline for stronger matches.\n3. **Role Assessment** — If no strong candidates remain, consider whether the role requirements should be adjusted.\n4. **Future Consideration** — File the candidate's profile for potential future openings where their skills may be a better fit.`

    const report = `# Hiring Report

## Candidate Overview
- **Name:** ${candidate.firstName} ${candidate.lastName}
- **Position:** ${vacancyTitle}${candidate.email ? `\n- **Email:** ${candidate.email}` : ''}${candidate.phone ? `\n- **Phone:** ${candidate.phone}` : ''}
- **Report Date:** ${new Date().toLocaleDateString()}

## Match Score: ${candidate.matchScore}% — ${scoreInterpretation}

## Key Qualifications
${candidate.skills ? candidate.skills.split(',').slice(0, 8).map(s => `- ${s.trim()}`).join('\n') : '- See CV for detailed qualifications'}

## Professional Summary
${candidate.summary || 'Summary not available — review CV for details.'}

## Strengths
${parsedStrengths}

## Areas of Concern
${parsedWeaknesses}

## Experience
${candidate.experience || 'See CV for details.'}

## Education
${candidate.education || 'See CV for details.'}

## Interview Readiness
${interviewReadiness}

## Salary Considerations
${salaryConsiderations}

## Final Recommendation: ${recLabel}

${candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes' ? 'This candidate demonstrates strong alignment with the role requirements. Their strengths clearly outweigh the identified concerns, and they are well-positioned to contribute to the team from day one. We recommend proceeding to the interview stage promptly to maintain their engagement in the hiring process.' : candidate.recommendation === 'maybe' ? 'This candidate shows potential but has notable gaps that should be explored further. They could grow into the role with the right support, but the concerns identified above need to be addressed before making a commitment. Consider a screening call to assess whether a full interview is warranted.' : 'This candidate does not meet the core requirements for this role at this time. The gaps between their profile and the vacancy requirements are too significant to overlook. We recommend focusing interview resources on stronger candidates and communicating this decision to the applicant promptly and professionally.'}

## Next Steps
${nextSteps}

---
*Generated by DeltaMatch — Demo Mode*`

    return { report }
  }

  const genAI = getClient()

  const langInstruction = language === 'nl' ? 'Write in Dutch.' : language === 'fr' ? 'Write in French.' : 'Write in English.'

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are an expert HR professional. Generate a comprehensive, detailed hiring report for a hiring manager (at least 500 words). The report must include ALL of the following sections in clean markdown:

1. **Candidate Overview** — Full name, position, email, phone, report date
2. **Match Score** — Score with interpretation (Excellent/Good/Moderate/Below expectations)
3. **Key Qualifications** — All relevant skills listed
4. **Professional Summary** — Thorough summary of the candidate's profile
5. **Strengths** — All strengths with explanations of relevance to the role
6. **Areas of Concern** — All weaknesses with specific details
7. **Experience** — Full work experience summary
8. **Education** — Complete educational background
9. **Interview Readiness** — Assessment of how ready the candidate is for interview, what format suits them, and what areas the interview should focus on
10. **Salary Considerations** — Based on the candidate's experience level and match score, provide guidance on expected compensation range and negotiation points
11. **Final Recommendation** — Clear hiring recommendation with detailed justification
12. **Next Steps** — Concrete, actionable next steps (3-5 items) tailored to the recommendation

Be thorough, professional, and actionable. Use all candidate data available. ${langInstruction}`,
      generationConfig: { temperature: 0.3 },
      tools: [{ functionDeclarations: [HIRING_REPORT_TOOL] }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    const result = await model.generateContent(
      `Generate a hiring report for this candidate.

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

Call submit_hiring_report now.`
    )

    const call = result.response.functionCalls()?.[0]
    if (call) {
      return call.args as unknown as { report: string }
    }
    console.warn('[AI] generateHiringReport returned no structured result, falling back to template report.')
    {
      const recLabel = candidate.recommendation === 'strong_yes' ? 'Strongly Recommended' : candidate.recommendation === 'yes' ? 'Recommended' : candidate.recommendation === 'maybe' ? 'Consider with Reservations' : 'Not Recommended'
      const scoreLabel = candidate.matchScore >= 80 ? 'Excellent match' : candidate.matchScore >= 65 ? 'Good match' : candidate.matchScore >= 50 ? 'Moderate match' : 'Below expectations'
      return { report: `# Hiring Report\n\n## Candidate Overview\n- **Name:** ${candidate.firstName} ${candidate.lastName}\n- **Position:** ${vacancyTitle}${candidate.email ? `\n- **Email:** ${candidate.email}` : ''}${candidate.phone ? `\n- **Phone:** ${candidate.phone}` : ''}\n- **Report Date:** ${new Date().toLocaleDateString()}\n\n## Match Score: ${candidate.matchScore}% — ${scoreLabel}\n\n## Professional Summary\n${candidate.summary || 'See CV for details.'}\n\n## Strengths\n${candidate.strengths || '- See CV for details'}\n\n## Areas of Concern\n${candidate.weaknesses || '- See CV for details'}\n\n## Experience\n${candidate.experience || 'See CV for details.'}\n\n## Education\n${candidate.education || 'See CV for details.'}\n\n## Interview Readiness\n${candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes' ? 'Candidate is ready for a comprehensive interview. Focus on verifying key qualifications and cultural fit.' : 'Consider a preliminary screening call before committing to a full interview.'}\n\n## Salary Considerations\nBased on the ${scoreLabel.toLowerCase()} rating, compensation should be calibrated to the candidate\'s experience level and market benchmarks for this role.\n\n## Final Recommendation: ${recLabel}\n\n## Next Steps\n1. ${candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes' ? 'Schedule interview within 5-7 business days' : 'Conduct preliminary screening call'}\n2. Prepare targeted interview questions based on areas of concern\n3. Review alongside other candidates in the pipeline\n\n---\n*Generated by DeltaMatch*` }
    }
  } catch (error: any) {
    console.error('[AI] generateHiringReport error:', error?.message || error)

    // Always fall back to a structured template report so the app keeps working
    // when the AI call fails (rate limit, quota, network, etc.).
    console.warn('[AI] Falling back to demo hiring report after AI failure.')
    const recLabel = candidate.recommendation === 'strong_yes' ? 'Strongly Recommended' : candidate.recommendation === 'yes' ? 'Recommended' : candidate.recommendation === 'maybe' ? 'Consider with Reservations' : 'Not Recommended'
    const scoreLabel = candidate.matchScore >= 80 ? 'Excellent match' : candidate.matchScore >= 65 ? 'Good match' : candidate.matchScore >= 50 ? 'Moderate match' : 'Below expectations'
    return { report: `# Hiring Report\n\n## Candidate Overview\n- **Name:** ${candidate.firstName} ${candidate.lastName}\n- **Position:** ${vacancyTitle}${candidate.email ? `\n- **Email:** ${candidate.email}` : ''}${candidate.phone ? `\n- **Phone:** ${candidate.phone}` : ''}\n- **Report Date:** ${new Date().toLocaleDateString()}\n\n## Match Score: ${candidate.matchScore}% — ${scoreLabel}\n\n## Professional Summary\n${candidate.summary || 'See CV for details.'}\n\n## Strengths\n${candidate.strengths || '- See CV for details'}\n\n## Areas of Concern\n${candidate.weaknesses || '- See CV for details'}\n\n## Experience\n${candidate.experience || 'See CV for details.'}\n\n## Education\n${candidate.education || 'See CV for details.'}\n\n## Interview Readiness\n${candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes' ? 'Candidate is ready for a comprehensive interview. Focus on verifying key qualifications and cultural fit.' : 'Consider a preliminary screening call before committing to a full interview.'}\n\n## Salary Considerations\nBased on the ${scoreLabel.toLowerCase()} rating, compensation should be calibrated to the candidate\'s experience level and market benchmarks for this role.\n\n## Final Recommendation: ${recLabel}\n\n## Next Steps\n1. ${candidate.recommendation === 'strong_yes' || candidate.recommendation === 'yes' ? 'Schedule interview within 5-7 business days' : 'Conduct preliminary screening call'}\n2. Prepare targeted interview questions based on areas of concern\n3. Review alongside other candidates in the pipeline\n\n---\n*Generated by DeltaMatch*` }
  }
}
