import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Props { candidates: Array<{ name: string; matchScore: number; vacancyTitle: string }>; totalCandidates: number; avgScore: number }

// Generates contextual AI insights based on the current candidate pool stats
export function AIInsightsPanel({ candidates, totalCandidates, avgScore }: Props) {
  // Each insight switches between a positive and a warning variant based on thresholds
  const insights = [
    avgScore >= 70
      ? { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', text: `Strong candidate pool — avg. ${avgScore}% match score` }
      : { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', text: `Avg. match score is ${avgScore}% — consider broadening search` },
    candidates.filter(c => c.matchScore >= 75).length > 0
      ? { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', text: `${candidates.filter(c => c.matchScore >= 75).length} candidate(s) scored 75%+ — ready for interview` }
      : { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50', text: 'Upload more CVs to get AI-powered insights' },
    { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50', text: `AI analyzed ${totalCandidates} candidate${totalCandidates !== 1 ? 's' : ''} in your pipeline` },
  ]
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500" />AI Insights</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${insight.bg}`}>
            <insight.icon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.color}`} />
            <p className="text-xs text-gray-700 leading-relaxed">{insight.text}</p>
          </div>
        ))}
        {candidates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Top Matches</p>
            <div className="space-y-2">
              {/* Sort inline to show best-scoring candidates first */}
              {candidates.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 truncate max-w-[140px]">{c.name}</span>
                  <span className={`text-xs font-bold ${c.matchScore >= 75 ? 'text-green-600' : c.matchScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{c.matchScore.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
