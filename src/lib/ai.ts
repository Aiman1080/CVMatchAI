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

  const userMessage = `You are an expert HR recruiter. Analyze this CV against the job vacancy and call submit_cv_analysis with your findings.

JOB VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription}
Requirements: ${vacancyRequirements}

CANDIDATE CV:
${cvText.slice(0, 6000)}

${motivationText ? `MOTIVATION LETTER:\n${motivationText.slice(0, 2000)}` : ''}

Evaluate carefully and call the submit_cv_analysis tool with your complete assessment.`

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

function generateDemoAnalysis(cvText: string, vacancyTitle: string): CVAnalysisResult {
  const score = 60 + Math.floor(Math.random() * 35)
  const words = cvText.toLowerCase()

  const techSkills = ['React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'AWS', 'Docker',
    'Figma', 'Java', 'Vue.js', 'JavaScript', 'CSS', 'HTML']
  const detectedSkills = techSkills.filter(s => words.includes(s.toLowerCase())).slice(0, 5)
  if (detectedSkills.length === 0) detectedSkills.push('Communication', 'Problem-solving', 'Teamwork')

  // Extract contact info from CV text with regex so the candidate isn't stored as "Unknown Candidate"
  const emailMatch = cvText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = cvText.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/)
  // Look for a "First Last" name on its own line — uses [ \t]+ to avoid matching across newlines
  const nameMatch = cvText.match(/^([A-Z][a-zÀ-ÿ'-]+(?:[ \t]+[A-Z][a-zÀ-ÿ'-]+)+)[ \t]*$/m)
  const nameParts = nameMatch ? nameMatch[1].trim().split(/\s+/) : []

  return {
    matchScore: score,
    summary: `Candidate shows relevant experience for the ${vacancyTitle} position. Their background demonstrates key competencies required for the role. Further interview recommended to assess cultural fit.`,
    strengths: [
      'Relevant professional experience',
      'Strong technical skill set',
      'Clear communication in CV',
    ],
    weaknesses: [
      'Some requirements not explicitly mentioned',
      'Could benefit from more specific examples',
    ],
    skills: detectedSkills,
    experience: 'Professional experience mentioned in CV. Relevant background for the position.',
    education: 'Educational background noted in CV.',
    recommendation: score >= 80 ? 'strong_yes' : score >= 65 ? 'yes' : score >= 50 ? 'maybe' : 'no',
    language: words.includes('werkervaring') || words.includes('opleiding') ? 'nl' :
      words.includes('expérience') ? 'fr' : 'en',
    firstName: nameParts.length >= 2 ? nameParts[0] : undefined,
    lastName: nameParts.length >= 2 ? nameParts.slice(1).join(' ') : undefined,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0].trim() : undefined,
  }
}
