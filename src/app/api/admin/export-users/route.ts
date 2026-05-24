// Admin CSV export — returns all users as a downloadable CSV file.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, company: true,
        role: true, subscription: true, subscriptionEnd: true,
        suspended: true, createdAt: true,
        _count: { select: { vacancies: true, candidates: true, supportTickets: true } },
      },
    })

    const header = 'ID,Name,Email,Company,Role,Subscription,SubscriptionEnd,Suspended,CreatedAt,Vacancies,Candidates,Tickets'
    const rows = users.map(u => {
      const esc = (v: string | null | undefined) => {
        if (!v) return ''
        const s = String(v).replace(/"/g, '""')
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
      }
      return [
        u.id,
        esc(u.name),
        esc(u.email),
        esc(u.company),
        u.role,
        u.subscription,
        u.subscriptionEnd ? new Date(u.subscriptionEnd).toISOString().split('T')[0] : '',
        u.suspended ? 'yes' : 'no',
        new Date(u.createdAt).toISOString().split('T')[0],
        u._count.vacancies,
        u._count.candidates,
        u._count.supportTickets,
      ].join(',')
    })

    const csv = [header, ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
