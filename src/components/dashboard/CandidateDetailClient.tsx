'use client'

import { useState } from 'react'
import {
  Mail, Phone, Linkedin, CheckCircle, XCircle, Clock, Star,
  TrendingUp, TrendingDown, Loader2, RefreshCw, FileText, User, Briefcase,
  GraduationCap, Languages, Award
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, parseJsonSafe, formatDate } from '@/lib/utils'

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_yes: 'bg-green-100 text-green-800 border border-green-200',
  yes: 'bg-blue-100 text-blue-800 border border-blue-200',
  maybe: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  no: 'bg-red-100 text-red-800 border border-red-200',
}
const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_yes: '✅ Strong Yes',
  yes: '👍 Yes',
  maybe: '🤔 Maybe',
  no: '❌ No',
}

export function CandidateDetailClient({ candidate: initial }: { candidate: any }) {
  const [candidate, setCandidate] = useState(initial)
  const [analyzing, setAnalyzing] = useState(false)

  const score = candidate.matchScore || 0
  const strengths = parseJsonSafe<string[]>(candidate.strengths, [])
  const weaknesses = parseJsonSafe<string[]>(candidate.weaknesses, [])
  const skills = parseJsonSafe<string[]>(candidate.skills, [])
  const initials = `${candidate.firstName?.[0] ?? '?'}${candidate.lastName?.[0] ?? '?'}`.toUpperCase()

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

  const hasEmailSource = candidate.source === 'email' || candidate.emailSource
  const hasMotiviationText = !!candidate.motivationText

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
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${RECOMMENDATION_COLORS[candidate.recommendation] || ''}`}>
                      AI: {RECOMMENDATION_LABELS[candidate.recommendation] || candidate.recommendation}
                    </span>
                  )}
                  {hasEmailSource && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Mail size={10} /> via email
                    </span>
                  )}
                  {candidate.language && (
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full font-medium uppercase">
                      {candidate.language}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:ml-auto flex items-center gap-4">
              {/* Score circle */}
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
        {/* Left column: contact, skills, meta */}
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
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 truncate">{candidate.email}</a>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">{candidate.phone}</a>
                </div>
              )}
              {candidate.linkedIn && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Linkedin size={14} className="text-gray-400 shrink-0" />
                  <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">LinkedIn</a>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <p>Added {formatDate(candidate.createdAt)}</p>
                {candidate.analyzedAt && <p>Analyzed {formatDate(candidate.analyzedAt)}</p>}
                {candidate.gdprConsent && <p className="text-green-600">GDPR: Consented ✓</p>}
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

          {/* Score breakdown bar */}
          {score > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Match Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Overall</span>
                  <span className={`font-bold text-sm ${scoreColor}`}>{score.toFixed(0)}%</span>
                </div>
                <Progress value={score} className="h-2" />
                <div className="pt-1 grid grid-cols-3 text-center text-xs text-gray-400">
                  <span className="text-red-500">0–49<br />Poor</span>
                  <span className="text-amber-500">50–74<br />Fair</span>
                  <span className="text-green-500">75–100<br />Good</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="analysis">
            <TabsList>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              {hasEmailSource && <TabsTrigger value="email">Email</TabsTrigger>}
              <TabsTrigger value="cv">CV</TabsTrigger>
              {hasMotiviationText && <TabsTrigger value="motivation">Motivation</TabsTrigger>}
            </TabsList>

            {/* ── AI Analysis tab ── */}
            <TabsContent value="analysis" className="space-y-4 mt-4">
              {candidate.summary ? (
                <>
                  {/* Summary */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                        <Award className="w-4 h-4 text-blue-500" /> AI Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">{candidate.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Strengths + Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {strengths.length > 0 && (
                      <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
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
                      <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
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

                  {/* Experience + Education */}
                  {(candidate.experience || candidate.education) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {candidate.experience && (
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="w-4 h-4 text-indigo-500" />
                              <p className="text-xs font-semibold text-gray-500 uppercase">Experience</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{candidate.experience}</p>
                          </CardContent>
                        </Card>
                      )}
                      {candidate.education && (
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-purple-500" />
                              <p className="text-xs font-semibold text-gray-500 uppercase">Education</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{candidate.education}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Recommendation banner */}
                  {candidate.recommendation && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="text-2xl">{candidate.recommendation === 'strong_yes' ? '🎯' : candidate.recommendation === 'yes' ? '✅' : candidate.recommendation === 'maybe' ? '🤔' : '❌'}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">AI Hiring Recommendation</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {RECOMMENDATION_LABELS[candidate.recommendation] || candidate.recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
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

            {/* ── Email tab (only for email-sourced candidates) ── */}
            {hasEmailSource && (
              <TabsContent value="email" className="mt-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" /> Original Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.emailSource ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">From</p>
                            <p className="text-gray-700 font-medium">{candidate.emailSource.sender}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Received</p>
                            <p className="text-gray-700">{formatDate(candidate.emailSource.receivedAt)}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Subject</p>
                            <p className="text-gray-700 font-medium">{candidate.emailSource.subject}</p>
                          </div>
                          {candidate.emailSource.attachments && (
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Attachments</p>
                              <div className="flex flex-wrap gap-2">
                                {((() => { try { return JSON.parse(candidate.emailSource.attachments) as string[] } catch { return [] } })()).map((att: string, i: number) => (
                                  <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1">
                                    <FileText size={10} /> {att}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">The CV and motivation letter above were extracted from this email by the AI agent.</p>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm font-medium">Candidate sourced via email</p>
                        <p className="text-gray-400 text-xs mt-1">Original email metadata is not available for this candidate.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* ── CV tab ── */}
            <TabsContent value="cv" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" /> Extracted CV Text
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

            {/* ── Motivation tab ── */}
            {hasMotiviationText && (
              <TabsContent value="motivation" className="mt-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> Motivation Letter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
