import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getStatusColor, formatRelativeTime } from '@/lib/utils'

interface Candidate { id: string; firstName: string; lastName: string; matchScore: number | null; status: string; createdAt: Date; vacancy?: { title: string } | null }

export function RecentCandidates({ candidates }: { candidates: Candidate[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Candidates</CardTitle>
        <Link href="/candidates" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <div className="text-center py-8 text-gray-400"><p className="text-sm">No candidates yet. Upload CVs to get started.</p></div>
        ) : (
          <div className="space-y-3">
            {candidates.map(c => {
              const initials = `${c.firstName[0]}${c.lastName[0]}`.toUpperCase()
              const score = c.matchScore || 0
              return (
                <Link key={c.id} href={`/candidates/${c.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <Avatar className="w-10 h-10 shrink-0"><AvatarFallback className="text-sm gradient-bg text-white font-semibold">{initials}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.vacancy?.title || 'No vacancy'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={score} className="h-1.5 flex-1" />
                        <span className={`text-xs font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{score.toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(c.createdAt)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
