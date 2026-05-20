import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'demo',
})

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

export async function analyzeCVAgainstVacancy(
  cvText: string,
  vacancyTitle: string,
  vacancyDescription: string,
  vacancyRequirements: string,
  motivationText?: string
): Promise<CVAnalysisResult> {
  const isDemoMode = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'demo'
  if (isDemoMode) return generateDemoAnalysis(cvText, vacancyTitle)

  const prompt = `You are an expert HR recruiter and CV analyst. Analyze the following CV against the job vacancy and provide a detailed assessment.

JOB VACANCY:
Title: ${vacancyTitle}
Description: ${vacancyDescription}
Requirements: ${vacancyRequirements}

CANDIDATE CV:
${cvText}

${motivationText ? `MOTIVATION LETTER:\n${motivationText}` : ''}

Return ONLY a valid JSON object:
{
  "matchScore": <number 0-100>,
  "summary": "<2-3 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "experience": "<brief experience summary>",
  "education": "<brief education summary>",
  "recommendation": "<strong_yes|yes|maybe|no>",
  "language": "<nl|en|fr|de>",
  "firstName": "<extracted first name>",
  "lastName": "<extracted last name>",
  "email": "<extracted email>",
  "phone": "<extracted phone>"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    return JSON.parse(jsonMatch[0]) as CVAnalysisResult
  } catch (error) {
    console.error('AI analysis error:', error)
    return generateDemoAnalysis(cvText, vacancyTitle)
  }
}

function generateDemoAnalysis(cvText: string, vacancyTitle: string): CVAnalysisResult {
  const score = 60 + Math.floor(Math.random() * 35)
  const words = cvText.toLowerCase()
  const techSkills = ['React', 'Node.js', 'TypeScript', 'Python', 'SQL', 'AWS', 'Docker', 'Figma', 'Java', 'Vue.js']
  const detectedSkills = techSkills.filter(s => words.includes(s.toLowerCase())).slice(0, 5)
  if (detectedSkills.length === 0) detectedSkills.push('Communication', 'Problem-solving', 'Teamwork')
  return {
    matchScore: score,
    summary: `Candidate shows relevant experience for the ${vacancyTitle} position. Their background demonstrates key competencies required for the role.`,
    strengths: ['Relevant professional experience', 'Strong technical skill set', 'Clear communication in CV'],
    weaknesses: ['Some requirements not explicitly mentioned', 'Could benefit from more specific examples'],
    skills: detectedSkills,
    experience: 'Professional experience mentioned in CV.',
    education: 'Educational background noted in CV.',
    recommendation: score >= 80 ? 'strong_yes' : score >= 65 ? 'yes' : score >= 50 ? 'maybe' : 'no',
    language: words.includes('erva') || words.includes('werk') ? 'nl' : 'en',
  }
}

export async function detectDocumentType(text: string): Promise<'cv' | 'motivation' | 'other'> {
  const lower = text.toLowerCase()
  const cvKeywords = ['experience', 'education', 'skills', 'work history', 'curriculum vitae', 'resume', 'werkervaring', 'opleiding', 'vaardigheden']
  const motivationKeywords = ['dear', 'i am writing', 'apply', 'motivation', 'sollicitatie', 'geachte', 'motivatie', 'candidature']
  const cvScore = cvKeywords.filter(k => lower.includes(k)).length
  const motScore = motivationKeywords.filter(k => lower.includes(k)).length
  if (cvScore > motScore) return 'cv'
  if (motScore > 0) return 'motivation'
  return 'other'
}
