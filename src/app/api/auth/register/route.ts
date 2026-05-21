// Recruiter registration — validates input with Zod, checks for duplicate email,
// hashes the password with bcrypt (cost 12) and creates the account with
// subscription: 'free' and role: 'recruiter'. Login goes through NextAuth.
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Input schema — Zod validates and type-narrows in one step
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  company: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, company } = schema.parse(body)

    // Prevent duplicate accounts before hashing — hashing is expensive (bcrypt cost 12)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, company, role: 'recruiter', subscription: 'free' },
    })
    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
