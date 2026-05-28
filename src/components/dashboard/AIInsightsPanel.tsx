'use client'

import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props { candidates: Array<{ name: string; matchScore: number; vacancyTitle: string }>; totalCandidates: number; avgScore: number }

// Generates contextual AI insights based on the current candidate pool stats
export function AIInsightsPanel({ candidates, totalCandidates, avgScore }: Props) {
  const { t } = useLanguage()
  const ai = t.dashboard.aiInsights

  // Each insight switches between a positive and a warning variant based on thresholds
  const insights = [
    avgScore >= 70
      ? { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', text: ai.strongPool.replace('{score}', String(avgScore)) }
      : { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', text: ai.weakPool.replace('{score}', String(avgScore)) },
    candidates.filter(c => c.matchScore >= 75).length > 0
      ? { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', text: ai.readyForInterview.replace('{count}', String(candidates.filter(c => c.matchScore >= 75).length)) }
      : { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', text: ai.uploadMore },
    { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', text: ai.analyzed.replace('{count}', String(totalCandidates)) },
  ]
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2 min-w-0"><Sparkles className="w-4 h-4 text-blue-500 shrink-0" /><span className="truncate">{ai.title}</span></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${insight.bg}`}>
            <insight.icon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.color}`} />
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words min-w-0">{insight.text}</p>
          </div>
        ))}
        {candidates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 break-words">{ai.topMatches}</p>
            <div className="space-y-2">
              {/* Sort a copy (not the prop array) to show best-scoring candidates first */}
              {[...candidates].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate min-w-0 flex-1">{c.name}</span>
                  <span className={`text-xs font-bold shrink-0 ${c.matchScore >= 75 ? 'text-green-600' : c.matchScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{c.matchScore.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
