import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logAiUsage } from '@/lib/ai-usage'

const isDemoMode = () =>
  !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === ''

const SUPPORT_SYSTEM_PROMPT = `You are the CVMatch AI support assistant. Help users with questions about: uploading CVs, using AI analysis, connecting ATS integrations, email scanning, managing candidates, billing, and account settings. Be concise and helpful. If you cannot solve the problem, suggest creating a support ticket. Respond in the same language as the user.`

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const { message, history } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  if (isDemoMode()) {
    return NextResponse.json({
      reply: getDemoReply(message),
      suggestTicket: false,
    })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SUPPORT_SYSTEM_PROMPT,
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    })

    const chatHistory = (history || []).map((h: { role: string; content: string }) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }))

    const chat = model.startChat({ history: chatHistory })
    const result = await chat.sendMessage(message)
    const usage = result.response.usageMetadata
    logAiUsage(userId, 'support_chat', usage?.promptTokenCount || 0, usage?.candidatesTokenCount || 0).catch(() => {})

    const reply = result.response.text()
    const suggestTicket = /support ticket|create a ticket|submit a ticket|contact support|ticket aanmaken|ticket créer/i.test(reply)

    return NextResponse.json({ reply, suggestTicket })
  } catch (error) {
    console.error('[AI] Support chat error:', error)
    return NextResponse.json({
      reply: getDemoReply(message),
      suggestTicket: false,
    })
  }
}

function getDemoReply(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('upload') || lower.includes('cv') || lower.includes('pdf'))
    return 'You can upload CVs in PDF, DOCX, or TXT format from the Vacancy detail page. Click "Upload CV" and drag your files. AI will analyze each CV automatically and generate a match score.'

  if (lower.includes('ats') || lower.includes('integration') || lower.includes('teamtailor') || lower.includes('recruitee'))
    return 'To connect your ATS, go to the Integrations page. Enter your API key for Teamtailor, Recruitee, SmartRecruiters or other supported platforms. CVMatch AI will import candidates and analyze their CVs automatically.'

  if (lower.includes('email') || lower.includes('inbox') || lower.includes('scan'))
    return 'You can connect your recruitment inbox from the Email page. CVMatch AI will automatically scan incoming emails, detect CVs and motivation letters, and create candidate profiles.'

  if (lower.includes('score') || lower.includes('match') || lower.includes('analysis') || lower.includes('ai'))
    return 'AI match scores range from 0-100%. The score is based on how well the candidate matches the vacancy requirements. You can view detailed strengths, weaknesses, and recommendations on each candidate page.'

  if (lower.includes('billing') || lower.includes('subscription') || lower.includes('plan') || lower.includes('upgrade') || lower.includes('pro'))
    return 'You can manage your subscription from Settings > Subscription. The Free plan includes 3 vacancies and 25 candidates/month. Pro (EUR 55/month) includes unlimited vacancies, ATS integrations, and advanced AI features.'

  if (lower.includes('delete') || lower.includes('gdpr') || lower.includes('privacy') || lower.includes('data'))
    return 'CVMatch AI is fully GDPR compliant. You can export or delete your data from Settings > Privacy & GDPR. Candidate data is encrypted and stored in EU data centers.'

  return 'I can help you with uploading CVs, AI analysis, ATS integrations, email scanning, managing candidates, billing, and account settings. Could you tell me more about what you need help with?'
}
