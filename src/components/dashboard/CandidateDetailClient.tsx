'use client'

import { useState } from 'react'
import {
  Mail, Phone, Linkedin, CheckCircle, XCircle, Clock, Star,
  TrendingUp, TrendingDown, Loader2, RefreshCw, FileText, User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, parseJsonSafe, formatDate } from '@/lib/utils'

export function CandidateDetailClient({ candidate: initial }: { candidate: any }) {
  const [candidate, setCandidate] = useState(initial)
  const [analyzing, setAnalyzing] = useState(false)

  const score = candidate.matchScore || 0
  const strengths = parseJsonSafe<string[]>(candidate.strengths, [])
  const weaknesses = parseJsonSafe<string[]>(candidate.weaknesses, [])
  const skills = parseJsonSafe<string[]>(candidate.skills, [])
  const initials = `${candidate.firstName[0]}${candidate.lastName[0]}`.toUpperCase()

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    setCandidate(updated)
    toast({ title: 'Status updated' })
  }

  const handleReanalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id }),
      })
      const data = await res.json()
      if (data.success) {
        setCandidate(data.candidate)
        toast({ title: 'AI analysis complete', description: `Match score: ${data.candidate.matchScore?.toFixed(0)}%` })
      }
    } catch {
      toast({ title: 'Analysis failed', variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
  const scoreBg = score >= 75 ? 'from-green-500 to-emerald-600' : score >= 50 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'

  const recommendationColors: Record<string, string> = {
    strong_yes: 'bg-green-100 text-green-800',
    yes: 'bg-blue-100 text-blue-800',
    maybe: 'bg-yellow-100 text-yellow-800',
    no: 'bg-red-100 text-red-800',
  }
  const recommendationLabels: Record<string, string> = {
    strong_yes: 'Strong Yes',
    yes: 'Yes',
    maybe: 'Maybe',
    no: 'No',
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl gradient-bg text-white font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h2>
                <p className="text-gray-500">{candidate.vacancy?.title}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                  {candidate.recommendation && (
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${recommendationColors[candidate.recommendation] || ''}`}>
                      AI: {recommendationLabels[candidate.recommendation] || candidate.recommendation}
                    </span>
                  )}
                  {candidate.source === 'email' && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                      via email
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:ml-auto flex items-center gap-4">
              {/* Score Circle */}
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${scoreBg} flex flex-col items-center justify-center shadow-lg`}>
                <span className="text-2xl font-bold text-white">{score > 0 ? `${score.toFixed(0)}%` : '—'}</span>
                <span className="text-xs text-white/80">match</span>
              </div>
              <div className="space-y-2">
                <Select value={candidate.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
                {candidate.cvContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReanalyze}
                    disabled={analyzing}
                    className="w-full gap-2"
                  >
                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Re-analyze
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact & Details */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {candidate.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <a href={`mailto:${candidate.email}`} className="hover:text-blue-600">{candidate.email}</a>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">{candidate.phone}</a>
                </div>
              )}
              {candidate.linkedIn && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Linkedin size={14} className="text-gray-400" />
                  <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">LinkedIn</a>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                Added {formatDate(candidate.createdAt)}
                {candidate.analyzedAt && <><br />Analyzed {formatDate(candidate.analyzedAt)}</>}
                {candidate.gdprConsent && <><br />GDPR: Consented</>}
              </div>
            </CardContent>
          </Card>

          {skills.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Analysis */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="analysis">
            <TabsList>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="cv">CV Text</TabsTrigger>
              {candidate.motivationText && <TabsTrigger value="motivation">Motivation</TabsTrigger>}
            </TabsList>

            <TabsContent value="analysis" className="space-y-4 mt-4">
              {candidate.summary ? (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-700 leading-relaxed">{candidate.summary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {strengths.length > 0 && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                            <TrendingUp className="w-4 h-4" /> Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                              <span className="text-sm text-gray-600">{s}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    {weaknesses.length > 0 && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                            <TrendingDown className="w-4 h-4" /> Areas for Concern
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <XCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm text-gray-600">{w}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {(candidate.experience || candidate.education) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {candidate.experience && (
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Experience</p>
                            <p className="text-sm text-gray-700">{candidate.experience}</p>
                          </CardContent>
                        </Card>
                      )}
                      {candidate.education && (
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Education</p>
                            <p className="text-sm text-gray-700">{candidate.education}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No AI analysis yet.</p>
                    {candidate.cvContent && (
                      <Button onClick={handleReanalyze} disabled={analyzing} size="sm" className="mt-4 gradient-bg">
                        {analyzing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                        Run AI Analysis
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cv">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  {candidate.cvContent ? (
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                      {candidate.cvContent}
                    </pre>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-8">No CV text available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {candidate.motivationText && (
              <TabsContent value="motivation">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                      {candidate.motivationText}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
