'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, TrendingDown, CheckCircle, XCircle,
  Briefcase, GraduationCap, Award, Crown, Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getStatusColor, parseJsonSafe } from '@/lib/utils'

interface CompareCandidate {
  id: string
  firstName: string
  lastName: string
  email: string | null
  matchScore: number | null
  status: string
  skills: string | null
  strengths: string | null
  weaknesses: string | null
  experience: string | null
  education: string | null
  summary: string | null
  recommendation: string | null
  vacancy?: { title: string; company: string } | null
}

const RECOMMENDATION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: 'Strong Yes', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/50 border-green-200 dark:border-green-800' },
  yes: { label: 'Yes', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  maybe: { label: 'Maybe', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  no: { label: 'No', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800' },
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function getScoreGradient(score: number): string {
  if (score >= 75) return 'from-green-500 to-emerald-600'
  if (score >= 50) return 'from-amber-500 to-orange-600'
  return 'from-red-500 to-rose-600'
}

function getScoreRingColor(score: number, isHighest: boolean): string {
  if (!isHighest) return 'ring-gray-200 dark:ring-gray-700'
  if (score >= 75) return 'ring-green-400 dark:ring-green-600'
  if (score >= 50) return 'ring-amber-400 dark:ring-amber-600'
  return 'ring-red-400 dark:ring-red-600'
}

export function CompareClient({ candidates }: { candidates: CompareCandidate[] }) {
  const count = candidates.length
  const colClass = count === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'

  // Find the highest score
  const highestScore = useMemo(() => {
    return Math.max(...candidates.map(c => c.matchScore || 0))
  }, [candidates])

  // Collect all skills across candidates for cross-highlighting
  const allSkills = useMemo(() => {
    const skillSets = candidates.map(c => parseJsonSafe<string[]>(c.skills, []))
    const skillCount = new Map<string, number>()
    for (const skills of skillSets) {
      for (const skill of skills) {
        const key = skill.toLowerCase()
        skillCount.set(key, (skillCount.get(key) || 0) + 1)
      }
    }
    return skillCount
  }, [candidates])

  // Recommendation ranking for comparison
  const recRank: Record<string, number> = { strong_yes: 4, yes: 3, maybe: 2, no: 1 }
  const bestRec = useMemo(() => {
    return Math.max(...candidates.map(c => recRank[c.recommendation || ''] || 0))
  }, [candidates])

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href="/candidates">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft size={16} /> Back to candidates
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Candidate Comparison
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Comparing {count} candidates side by side
          </p>
        </div>
      </div>

      {/* ── Score overview cards ── */}
      <div className={`grid ${colClass} gap-4`}>
        {candidates.map((c) => {
          const score = c.matchScore || 0
          const initials = `${c.firstName?.[0] ?? '?'}${c.lastName?.[0] ?? ''}`.toUpperCase()
          const isHighest = score > 0 && score === highestScore
          const rec = c.recommendation ? RECOMMENDATION_CONFIG[c.recommendation] : null

          return (
            <Card
              key={c.id}
              className={`border-0 shadow-sm transition-all ${isHighest ? `ring-2 ${getScoreRingColor(score, true)}` : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="text-lg gradient-bg text-white font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isHighest && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                        <Crown size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                    {c.vacancy && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{c.vacancy.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getScoreGradient(score)} flex flex-col items-center justify-center shadow-lg shrink-0`}>
                    <span className="text-lg font-bold text-white leading-none">
                      {score > 0 ? `${score.toFixed(0)}%` : '--'}
                    </span>
                    <span className="text-[10px] text-white/70">match</span>
                  </div>
                </div>

                {/* Recommendation */}
                {rec && (
                  <div className={`mt-3 px-3 py-1.5 rounded-lg border text-xs font-semibold text-center ${rec.bg} ${rec.color}`}>
                    AI: {rec.label}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Detailed comparison sections ── */}

      {/* Match Score Comparison Bar */}
      <CompareSection title="Match Score" icon={<Trophy size={16} className="text-amber-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => {
            const score = c.matchScore || 0
            const isHighest = score > 0 && score === highestScore
            return (
              <div key={c.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {c.firstName} {c.lastName}
                  </span>
                  <span className={`text-lg font-bold ${isHighest ? getScoreColor(score) : 'text-gray-400 dark:text-gray-500'}`}>
                    {score > 0 ? `${score.toFixed(0)}%` : '--'}
                  </span>
                </div>
                <Progress value={score} className="h-3" />
                {isHighest && count > 1 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Highest match
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CompareSection>

      {/* AI Summary */}
      <CompareSection title="AI Summary" icon={<Award size={16} className="text-blue-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => (
            <div key={c.id} className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                {c.firstName} {c.lastName}
              </p>
              {c.summary ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {c.summary}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No AI analysis available
                </p>
              )}
            </div>
          ))}
        </div>
      </CompareSection>

      {/* Skills */}
      <CompareSection title="Skills" icon={<Award size={16} className="text-indigo-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => {
            const skills = parseJsonSafe<string[]>(c.skills, [])
            return (
              <div key={c.id} className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {c.firstName} {c.lastName}
                </p>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, i) => {
                      const isShared = (allSkills.get(s.toLowerCase()) || 0) > 1
                      return (
                        <span
                          key={i}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            isShared
                              ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {s}
                          {isShared && <CheckCircle size={10} className="inline ml-1 -mt-0.5" />}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No skills listed</p>
                )}
              </div>
            )
          })}
        </div>
        {/* Shared skills legend */}
        {Array.from(allSkills.values()).some(v => v > 1) && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle size={12} className="text-green-500" />
              <span>Green highlighted skills are shared across candidates</span>
            </div>
          </div>
        )}
      </CompareSection>

      {/* Strengths */}
      <CompareSection title="Strengths" icon={<TrendingUp size={16} className="text-green-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => {
            const strengths = parseJsonSafe<string[]>(c.strengths, [])
            return (
              <div key={c.id} className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {c.firstName} {c.lastName}
                  {strengths.length > 0 && (
                    <Badge variant="success" className="ml-2 text-[10px]">{strengths.length}</Badge>
                  )}
                </p>
                {strengths.length > 0 ? (
                  <div className="space-y-1.5">
                    {strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No strengths listed</p>
                )}
              </div>
            )
          })}
        </div>
      </CompareSection>

      {/* Weaknesses */}
      <CompareSection title="Weaknesses" icon={<TrendingDown size={16} className="text-amber-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => {
            const weaknesses = parseJsonSafe<string[]>(c.weaknesses, [])
            return (
              <div key={c.id} className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  {c.firstName} {c.lastName}
                  {weaknesses.length > 0 && (
                    <Badge variant="warning" className="ml-2 text-[10px]">{weaknesses.length}</Badge>
                  )}
                </p>
                {weaknesses.length > 0 ? (
                  <div className="space-y-1.5">
                    {weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{w}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No weaknesses listed</p>
                )}
              </div>
            )
          })}
        </div>
      </CompareSection>

      {/* Experience */}
      <CompareSection title="Experience" icon={<Briefcase size={16} className="text-indigo-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => (
            <div key={c.id} className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                {c.firstName} {c.lastName}
              </p>
              {c.experience ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {c.experience}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No experience data</p>
              )}
            </div>
          ))}
        </div>
      </CompareSection>

      {/* Education */}
      <CompareSection title="Education" icon={<GraduationCap size={16} className="text-purple-500" />}>
        <div className={`grid ${colClass} gap-4`}>
          {candidates.map((c) => (
            <div key={c.id} className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                {c.firstName} {c.lastName}
              </p>
              {c.education ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {c.education}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No education data</p>
              )}
            </div>
          ))}
        </div>
      </CompareSection>
    </div>
  )
}

/** Reusable comparison section wrapper */
function CompareSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
