// Vacancy CRUD list endpoint — GET returns the user's vacancies with candidate counts,
// POST creates a new vacancy after Zod validation.
// The vacancy title + description + requirements drive the AI match scoring.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(2),
  company: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']).default('full-time'),
  description: z.string().min(10),
  requirements: z.string().min(5),
  niceToHave: z.string().optional(),
  salary: z.string().optional(),
  language: z.string().default('nl'),
})

// Admins can see all vacancies across all users; recruiters only see their own
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  const vacancies = await prisma.vacancy.findMany({
    where: isAdmin ? {} : { userId },
    include: { _count: { select: { candidates: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(vacancies)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const userId = (session.user as any).id
    const vacancy = await prisma.vacancy.create({ data: { ...data, userId } })
    return NextResponse.json(vacancy, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create vacancy' }, { status: 500 })
  }
}
