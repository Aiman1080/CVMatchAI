import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { KanbanClient } from '@/components/dashboard/KanbanClient'

// Dedicated full-page Kanban. Same data as /candidates (one database), so moving
// a card here changes the candidate's status everywhere.
export default async function KanbanPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const where = isAdmin ? {} : { userId }

  let candidates: any[] = []
  try {
    candidates = await prisma.candidate.findMany({
      where,
      include: { vacancy: { select: { title: true, company: true } } },
      orderBy: [{ priority: 'desc' }, { matchScore: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    })
  } catch (e: any) {
    console.error('[KanbanPage] DB error:', e?.message || e)
  }

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const T = ({
    en: { desc: (n: number) => `Drag candidates between stages - ${n} in your pipeline` },
    nl: { desc: (n: number) => `Sleep kandidaten tussen fases - ${n} in je pijplijn` },
    fr: { desc: (n: number) => `Glissez les candidats entre les étapes - ${n} dans votre pipeline` },
  } as const)[locale] || { desc: (n: number) => `${n} in your pipeline` }

  return (
    <div>
      <Header title="Kanban" description={T.desc(candidates.length)} />
      <div className="p-4 sm:p-8">
        <KanbanClient initialCandidates={candidates} />
      </div>
    </div>
  )
}
