import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logAiUsage } from '@/lib/ai-usage'

const isDemoMode = () =>
  !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === ''

const SUPPORT_SYSTEM_PROMPT = `You are the DeltaMatch support assistant for end users (recruiters, HR professionals).

STRICT RULES — never break these:
- NEVER show, write, or discuss source code, programming languages, APIs, databases, JSON, HTML, CSS, SQL, or any technical implementation details
- NEVER explain how the platform is built, what technologies it uses, or any developer/technical concepts
- NEVER provide code snippets, commands, regex, file paths, or technical configuration
- NEVER mention specific frameworks (React, Next.js, Prisma, etc.) or AI models (Gemini, GPT, Claude, etc.)
- If asked about code or technical implementation, politely redirect to a support ticket

YOUR ROLE:
You have two main jobs:

1. **Answer simple product questions directly**: how to upload CVs, AI matching scores, ATS integrations (Teamtailor, Recruitee, etc.), email scanning, managing candidates, billing & subscriptions, account settings, GDPR/privacy.

2. **Help users formulate a professional support ticket** when they have a bug, complex issue, or something you can't solve. This is your key job — turn vague complaints into structured tickets the support team can act on.

HOW TO HELP CREATE A PROFESSIONAL TICKET:
When a user reports a problem (bug, error, something not working, missing feature), guide them through a few clarifying questions to gather:
- What exactly were they trying to do? (the goal)
- What did they expect to happen?
- What happened instead? (the actual behavior)
- When did this start? (always? after an update?)
- Steps to reproduce — what did they click before the issue?
- Any error message they saw (exact wording)
- Which page/feature was affected (Vacancies, Candidates, Upload, etc.)
- How urgent is it? (blocking their work or just annoying?)

Ask ONE question at a time, don't overwhelm them. After gathering enough info, summarize the ticket like this:

"Here's a summary of your issue for the support team:

**Problem:** [clear one-line description]
**Where:** [page/feature affected]
**Steps to reproduce:**
1. [step 1]
2. [step 2]
3. [step 3]
**Expected:** [what should happen]
**Actual:** [what actually happens]
**Error message:** [if any]
**Priority:** [low/normal/high]

Would you like me to help you submit this as a ticket? You can copy this into the support form, or visit the Support page to submit it directly."

STYLE:
- Speak like a friendly, patient customer support rep — not a developer
- Use simple, clear language a non-technical recruiter would understand
- Give step-by-step instructions referring to UI elements ("Go to the Vacancies page", "Click the Upload button")
- Be empathetic: "I understand that's frustrating, let me help you sort this out."
- Respond in the same language as the user (English, French, or Dutch)
- One question at a time when troubleshooting

NEVER make up information. If you don't know the answer, say so and offer to create a ticket.`

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
    return 'To connect your ATS, go to the Integrations page. Enter your API key for Teamtailor, Recruitee, SmartRecruiters or other supported platforms. DeltaMatch will import candidates and analyze their CVs automatically.'

  if (lower.includes('email') || lower.includes('inbox') || lower.includes('scan'))
    return 'You can connect your recruitment inbox from the Email page. DeltaMatch will automatically scan incoming emails, detect CVs and motivation letters, and create candidate profiles.'

  if (lower.includes('score') || lower.includes('match') || lower.includes('analysis') || lower.includes('ai'))
    return 'AI match scores range from 0-100%. The score is based on how well the candidate matches the vacancy requirements. You can view detailed strengths, weaknesses, and recommendations on each candidate page.'

  if (lower.includes('billing') || lower.includes('subscription') || lower.includes('plan') || lower.includes('upgrade') || lower.includes('pro'))
    return 'You can manage your subscription from Settings > Subscription. The Free plan includes 3 vacancies and 25 candidates/month. Pro (EUR 55/month) includes unlimited vacancies, ATS integrations, and advanced AI features.'

  if (lower.includes('delete') || lower.includes('gdpr') || lower.includes('privacy') || lower.includes('data'))
    return 'DeltaMatch is fully GDPR compliant. You can export or delete your data from Settings > Privacy & GDPR. Candidate data is encrypted and stored in EU data centers.'

  return 'I can help you with uploading CVs, AI analysis, ATS integrations, email scanning, managing candidates, billing, and account settings. Could you tell me more about what you need help with?'
}
