'use client'

import { useState, useRef } from 'react'
import {
  Mail, Phone, Linkedin, CheckCircle, XCircle, Clock, Star,
  TrendingUp, TrendingDown, Loader2, RefreshCw, FileText, User, Briefcase,
  GraduationCap, Languages, Award, Flag, Archive, Send, X, Video,
  MessageSquareText, ClipboardList, Sparkles, Copy, Download,
  History, ArrowRight, Brain, Plus, Eye, EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, parseJsonSafe, formatDate } from '@/lib/utils'
import { exportHiringReportPDF } from '@/lib/export'
import { useLanguage } from '@/contexts/LanguageContext'

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_yes: 'bg-green-100 text-green-800 border border-green-200',
  yes: 'bg-blue-100 text-blue-800 border border-blue-200',
  maybe: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  no: 'bg-red-100 text-red-800 border border-red-200',
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  rejection: {
    subject: 'Your application — Next steps',
    body: `Hello {name},\n\nThank you for your interest in our position and the time you invested in your application.\n\nAfter careful review, we regret to inform you that your application has not been selected for the next stage.\n\nWe wish you every success in your search.\n\nKind regards`,
  },
  interview: {
    subject: 'Interview invitation',
    body: `Hello {name},\n\nWe have reviewed your application and are pleased to invite you for an interview.\n\nPlease let us know your availability or click the link below to join the meeting.\n\nKind regards`,
  },
  followup: {
    subject: 'Follow-up on your application',
    body: `Hello {name},\n\nWe are following up on your application. We wanted to let you know that your file is currently under review.\n\nWe will get back to you within the next few days.\n\nKind regards`,
  },
}

export function CandidateDetailClient({ candidate: initial }: { candidate: any }) {
  const { t, locale } = useLanguage()
  const cd = t.dashboard.candidateDetail
  const tc = t.dashboard.candidates
  const ci = t.dashboard.candidateInterview

  const RECOMMENDATION_LABELS: Record<string, string> = {
    strong_yes: `🎯 ${ci.recommendationLabels.strong_yes}`,
    yes: `✅ ${ci.recommendationLabels.yes}`,
    maybe: `🤔 ${ci.recommendationLabels.maybe}`,
    no: `❌ ${ci.recommendationLabels.no}`,
  }

  const [candidate, setCandidate] = useState(initial)
  const [analyzing, setAnalyzing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(initial.notes || '')
  const [notesSaved, setNotesSaved] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [emailFrom, setEmailFrom] = useState('')
  const [emailType, setEmailType] = useState('rejection')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [teamsLink, setTeamsLink] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [interviewQuestions, setInterviewQuestions] = useState<Array<{ question: string; category: string; rationale: string; expectedAnswer: string }> | null>(null)
  const [visibleAnswers, setVisibleAnswers] = useState<Set<number>>(new Set())
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [hiringReport, setHiringReport] = useState<string | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [downloadingReportPdf, setDownloadingReportPdf] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const score = candidate.matchScore || 0
  const strengths = parseJsonSafe<string[]>(candidate.strengths, [])
  const weaknesses = parseJsonSafe<string[]>(candidate.weaknesses, [])
  const skills = parseJsonSafe<string[]>(candidate.skills, [])
  const initials = `${candidate.firstName?.[0] ?? '?'}${candidate.lastName?.[0] ?? '?'}`.toUpperCase()

  const patch = async (data: any) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: err.error || tc.updateError, variant: 'destructive' })
        return null
      }
      const updated = await res.json()
      setCandidate((prev: any) => ({ ...prev, ...updated }))
      return updated
    } catch {
      toast({ title: tc.updateError, variant: 'destructive' })
      return null
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    const result = await patch({ status })
    if (result) toast({ title: cd.changeStatus, description: status })
  }

  const handleToggle = async (field: 'liked' | 'priority' | 'savedToPool') => {
    await patch({ [field]: !candidate[field] })
  }

  const handleNotesChange = (val: string) => {
    setNotes(val)
    setNotesSaved(false)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/candidates/${candidate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: val }),
        })
        if (res.ok) setNotesSaved(true)
        else toast({ title: ci.failedSaveNotes, variant: 'destructive' })
      } catch {
        toast({ title: ci.failedSaveNotes, variant: 'destructive' })
      }
    }, 800)
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
        toast({ title: cd.aiAnalysis, description: `${cd.match}: ${data.candidate.matchScore?.toFixed(0)}%` })
      }
    } catch {
      toast({ title: cd.aiAnalysis, variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  const openEmailDialog = (type: string) => {
    setEmailType(type)
    setEmailSubject('')
    setEmailBody('')
    setTeamsLink('')
    setShowEmail(true)
  }

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true)
    try {
      const res = await fetch('/api/candidates/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, type: emailType, locale }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailSubject(data.subject)
        setEmailBody(data.body)
        toast({ title: `${cd.generateWithAI} ✨` })
      } else {
        toast({ title: data.error || cd.aiAnalysis, variant: 'destructive' })
      }
    } finally {
      setGeneratingEmail(false)
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      const res = await fetch('/api/candidates/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          type: emailType,
          subject: emailSubject,
          body: emailBody,
          teamsLink: teamsLink || undefined,
          fromEmail: emailFrom || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: cd.sendEmail, description: `${candidate.email}` })
        setShowEmail(false)
        if (emailType === 'rejection') setCandidate((p: any) => ({ ...p, status: 'rejected' }))
        if (emailType === 'interview') setCandidate((p: any) => ({ ...p, status: 'shortlisted' }))
      } else {
        toast({ title: data.error || cd.sendEmail, variant: 'destructive' })
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true)
    try {
      const res = await fetch('/api/candidates/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setInterviewQuestions(data.questions)
        setVisibleAnswers(new Set())
        toast({ title: ci.questionsGenerated })
      } else {
        toast({ title: data.error || ci.questionGenerationFailed, variant: 'destructive' })
      }
    } catch {
      toast({ title: ci.questionsFailed, variant: 'destructive' })
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleGenerateReport = async () => {
    setLoadingReport(true)
    try {
      const res = await fetch('/api/candidates/hiring-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setHiringReport(data.report)
        toast({ title: ci.reportGenerated })
      } else {
        toast({ title: data.error || ci.reportGenerationFailed, variant: 'destructive' })
      }
    } catch {
      toast({ title: ci.reportFailed, variant: 'destructive' })
    } finally {
      setLoadingReport(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: ci.copiedToClipboard })
  }

  const fetchActivities = async () => {
    if (activitiesLoaded) return
    setLoadingActivities(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch {
      // Silent fail — activity is non-critical
    } finally {
      setLoadingActivities(false)
      setActivitiesLoaded(true)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
      case 'note_added': return <FileText className="w-3.5 h-3.5 text-purple-500" />
      case 'email_sent': return <Mail className="w-3.5 h-3.5 text-green-500" />
      case 'cv_analyzed': return <Brain className="w-3.5 h-3.5 text-amber-500" />
      case 'created': return <Plus className="w-3.5 h-3.5 text-gray-500" />
      default: return <Clock className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  const getActivityDotColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'bg-blue-500'
      case 'note_added': return 'bg-purple-500'
      case 'email_sent': return 'bg-green-500'
      case 'cv_analyzed': return 'bg-amber-500'
      case 'created': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const timeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  }

  const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
  const scoreBg = score >= 75 ? 'from-green-500 to-emerald-600' : score >= 50 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
  const hasEmailSource = candidate.source === 'email' || candidate.emailSource
  const hasMotivationText = !!candidate.motivationText

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full min-w-0">
              <Avatar className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                <AvatarFallback className="text-lg sm:text-xl gradient-bg text-white font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{candidate.firstName} {candidate.lastName}</h2>
                  {candidate.liked && <Star className="w-5 h-5 text-amber-500" fill="currentColor" />}
                  {candidate.priority && <Flag className="w-5 h-5 text-red-500" />}
                  {candidate.savedToPool && <span className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full font-medium border border-amber-200 dark:border-amber-800">{cd.savedToPool}</span>}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">{candidate.vacancy?.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(candidate.status)}`}>{tc[candidate.status as keyof typeof tc] || candidate.status}</span>
                  {candidate.recommendation && (
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${RECOMMENDATION_COLORS[candidate.recommendation] || ''}`}>
                      AI: {RECOMMENDATION_LABELS[candidate.recommendation] || candidate.recommendation}
                    </span>
                  )}
                  {hasEmailSource && <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Mail size={10} /> via email</span>}
                  {candidate.language && <span className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full font-medium uppercase">{candidate.language}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
              {/* Score circle */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${scoreBg} flex flex-col items-center justify-center shadow-lg shrink-0`}>
                <span className="text-base sm:text-xl font-bold text-white">{score > 0 ? `${score.toFixed(0)}%` : '—'}</span>
                <span className="text-[10px] sm:text-xs text-white/80">{cd.match}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2 flex-1 min-w-0">
                <Select value={candidate.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{tc.new}</SelectItem>
                    <SelectItem value="reviewing">{tc.reviewing}</SelectItem>
                    <SelectItem value="shortlisted">{tc.shortlisted}</SelectItem>
                    <SelectItem value="rejected">{tc.rejected}</SelectItem>
                    <SelectItem value="hired">{tc.hired}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Like / Priority / Pool */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle('liked')}
                    disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${candidate.liked ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-200' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-amber-200 hover:text-amber-500'}`}
                    title={cd.liked}
                  >
                    <Star size={12} fill={candidate.liked ? 'currentColor' : 'none'} /> {cd.liked}
                  </button>
                  <button
                    onClick={() => handleToggle('priority')}
                    disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${candidate.priority ? 'bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-200 hover:text-red-500'}`}
                    title={cd.priority}
                  >
                    <Flag size={12} /> {cd.priority}
                  </button>
                  <button
                    onClick={() => handleToggle('savedToPool')}
                    disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${candidate.savedToPool ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 border-amber-200' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-amber-200 hover:text-amber-600'}`}
                    title={cd.savedToPool}
                  >
                    <Archive size={12} /> {cd.savedToPool}
                  </button>
                </div>

                {candidate.cvContent && (
                  <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={analyzing} className="w-full gap-2">
                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {analyzing ? cd.analyzing : cd.reanalyze}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick email actions */}
          {candidate.email && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
              <p className="text-xs text-gray-400 self-center mr-1">{cd.sendEmail}:</p>
              <Button size="sm" variant="outline" onClick={() => openEmailDialog('interview')} className="gap-1.5 h-7 text-xs">
                <Video size={12} /> {cd.interview}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEmailDialog('rejection')} className="gap-1.5 h-7 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                <X size={12} /> {cd.rejection}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEmailDialog('followup')} className="gap-1.5 h-7 text-xs">
                <Send size={12} /> {cd.followup}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> {ci.contact}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {candidate.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 min-w-0">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 truncate min-w-0">{candidate.email}</a>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
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
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 space-y-1">
                <p>{ci.added} {formatDate(candidate.createdAt)}</p>
                {candidate.analyzedAt && <p>{ci.analyzed} {formatDate(candidate.analyzedAt)}</p>}
                {candidate.gdprConsent && <p className="text-green-600">{ci.gdprConsent} ✓</p>}
              </div>
            </CardContent>
          </Card>

          {skills.length > 0 && (
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{cd.skills}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {score > 0 && (
            <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{cd.match}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{cd.global}</span>
                  <span className={`font-bold text-sm ${scoreColor}`}>{score.toFixed(0)}%</span>
                </div>
                <Progress value={score} className="h-2" />
                <div className="grid grid-cols-3 text-center text-xs text-gray-400 dark:text-gray-500">
                  <span className="text-red-500">0–49<br />{ci.matchLow}</span>
                  <span className="text-amber-500">50–74<br />{ci.matchMedium}</span>
                  <span className="text-green-500">75–100<br />{ci.matchStrong}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="analysis">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="analysis">{cd.aiAnalysis}</TabsTrigger>
              <TabsTrigger value="notes">{cd.notes}</TabsTrigger>
              {hasEmailSource && <TabsTrigger value="email">{cd.emailPanel}</TabsTrigger>}
              <TabsTrigger value="interview" className="gap-1"><MessageSquareText size={14} /> {ci.interviewTab}</TabsTrigger>
              <TabsTrigger value="report" className="gap-1"><ClipboardList size={14} /> {ci.reportTab}</TabsTrigger>
              <TabsTrigger value="activity" className="gap-1" onClick={fetchActivities}><History size={14} /> {cd.activityTab}</TabsTrigger>
              <TabsTrigger value="cv">{cd.cvTab}</TabsTrigger>
              {hasMotivationText && <TabsTrigger value="motivation">{ci.motivationTab}</TabsTrigger>}
            </TabsList>

            {/* ── AI Analysis tab ── */}
            <TabsContent value="analysis" className="space-y-4 mt-4">
              {candidate.summary ? (
                <>
                  <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Award className="w-4 h-4 text-blue-500" /> {cd.aiAnalysis}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate.summary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {strengths.length > 0 && (
                      <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                            <TrendingUp className="w-4 h-4" /> {cd.strengths}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{s}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    {weaknesses.length > 0 && (
                      <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                            <TrendingDown className="w-4 h-4" /> {cd.weaknesses}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <XCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">{w}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {(candidate.experience || candidate.education) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {candidate.experience && (
                        <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="w-4 h-4 text-indigo-500" />
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{ci.experience}</p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate.experience}</p>
                          </CardContent>
                        </Card>
                      )}
                      {candidate.education && (
                        <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-purple-500" />
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{ci.education}</p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate.education}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {candidate.recommendation && (
                    <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="text-2xl">{candidate.recommendation === 'strong_yes' ? '🎯' : candidate.recommendation === 'yes' ? '✅' : candidate.recommendation === 'maybe' ? '🤔' : '❌'}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">{ci.aiRecommendation}</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{RECOMMENDATION_LABELS[candidate.recommendation] || candidate.recommendation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                  <CardContent className="py-12 text-center">
                    <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">{cd.noAnalysis}</p>
                    {candidate.cvContent && (
                      <Button onClick={handleReanalyze} disabled={analyzing} size="sm" className="mt-4 gradient-bg">
                        {analyzing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                        {analyzing ? cd.analyzing : cd.analyzeNow}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Notes tab ── */}
            <TabsContent value="notes" className="mt-4">
              <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" /> {cd.notes}
                    </CardTitle>
                    <span className={`text-xs ${notesSaved ? 'text-green-500' : 'text-gray-400'}`}>
                      {notesSaved ? `✓ ${cd.notesSaved}` : '...'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={e => handleNotesChange(e.target.value)}
                    placeholder={cd.notesPlaceholder}
                    className="w-full min-h-64 p-3 text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Email source tab ── */}
            {hasEmailSource && (
              <TabsContent value="email" className="mt-4">
                <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" /> {cd.emailPanel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.emailSource ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ci.from}</p>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{candidate.emailSource.sender}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ci.received}</p>
                            <p className="text-gray-700 dark:text-gray-300">{formatDate(candidate.emailSource.receivedAt)}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{cd.emailSubject}</p>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{candidate.emailSource.subject}</p>
                          </div>
                          {candidate.emailSource.attachments && (
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ci.attachments}</p>
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
                        <p className="text-xs text-gray-400">{ci.cvExtractedFromEmail}</p>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">{ci.candidateViaEmail}</p>
                        <p className="text-gray-400 text-xs mt-1">{ci.emailMetadataUnavailable}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* ── Interview Questions tab ── */}
            <TabsContent value="interview" className="mt-4">
              <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4 text-purple-500" /> {ci.aiInterviewQuestions}
                    </CardTitle>
                    <Button onClick={handleGenerateQuestions} disabled={loadingQuestions || !candidate.cvContent} size="sm" className="gap-2 gradient-bg">
                      {loadingQuestions ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {loadingQuestions ? ci.generatingQuestions : interviewQuestions ? ci.regenerate : ci.generateQuestions}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {interviewQuestions ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(interviewQuestions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}\n   Why: ${q.rationale}\n   Expected answer: ${q.expectedAnswer}`).join('\n\n'))}>
                          <Copy size={12} /> {ci.copyAll}
                        </Button>
                      </div>
                      {interviewQuestions.map((q, i) => (
                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{i + 1}. {q.question}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              q.category === 'technical' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                              q.category === 'behavioral' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                              q.category === 'situational' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                              'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                            }`}>{ci.categories[q.category as keyof typeof ci.categories] || q.category}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.rationale}</p>
                          {q.expectedAnswer && (
                            <div className="pt-1">
                              <button
                                onClick={() => setVisibleAnswers(prev => {
                                  const next = new Set(prev)
                                  if (next.has(i)) next.delete(i)
                                  else next.add(i)
                                  return next
                                })}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
                              >
                                {visibleAnswers.has(i) ? <EyeOff size={12} /> : <Eye size={12} />}
                                {visibleAnswers.has(i) ? cd.hideExpectedAnswer : cd.showExpectedAnswer}
                              </button>
                              {visibleAnswers.has(i) && (
                                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                  <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">{q.expectedAnswer}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <MessageSquareText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm mb-1">{ci.personalizedQuestions}</p>
                      <p className="text-gray-400 text-xs">{ci.questionsExplainer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Hiring Report tab ── */}
            <TabsContent value="report" className="mt-4">
              <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-500" /> {ci.aiHiringReport}
                    </CardTitle>
                    <div className="flex gap-2">
                      {hiringReport && (
                        <>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(hiringReport)}>
                            <Copy size={12} /> {ci.copy}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            disabled={downloadingReportPdf}
                            onClick={async () => {
                              setDownloadingReportPdf(true)
                              try {
                                await exportHiringReportPDF(
                                  hiringReport,
                                  `${candidate.firstName} ${candidate.lastName}`,
                                  candidate.vacancy?.title
                                )
                                toast({ title: ci.pdfDownloaded })
                              } catch {
                                toast({ title: ci.pdfFailed, variant: 'destructive' })
                              } finally {
                                setDownloadingReportPdf(false)
                              }
                            }}
                          >
                            {downloadingReportPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            {downloadingReportPdf ? ci.exportingPdf : ci.downloadPdf}
                          </Button>
                        </>
                      )}
                      <Button onClick={handleGenerateReport} disabled={loadingReport} size="sm" className="gap-2 gradient-bg">
                        {loadingReport ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {loadingReport ? ci.generatingReport : hiringReport ? ci.regenerate : ci.generateReport}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {hiringReport ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-xl p-6">{hiringReport}</pre>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm mb-1">{ci.professionalReport}</p>
                      <p className="text-gray-400 text-xs">{ci.reportExplainer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Activity tab ── */}
            <TabsContent value="activity" className="mt-4">
              <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" /> {cd.activityTimeline}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingActivities ? (
                    <div className="py-12 text-center">
                      <Loader2 className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
                      <p className="text-gray-400 text-sm">{cd.loadingActivity}</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="py-12 text-center">
                      <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">{cd.noActivityYet}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-4">
                        {activities.map((activity: any) => (
                          <div key={activity.id} className="relative flex items-start gap-4 pl-1">
                            {/* Dot on the timeline */}
                            <div className="relative z-10 flex items-center justify-center w-[30px] shrink-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${getActivityDotColor(activity.type)} ring-4 ring-white dark:ring-gray-900`} />
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                {getActivityIcon(activity.type)}
                                <p className="text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>
                              </div>
                              <p className="text-xs text-gray-400">{timeAgo(activity.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── CV tab ── */}
            <TabsContent value="cv" className="mt-4">
              <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" /> CV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.cvContent ? (
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                      {candidate.cvContent}
                    </pre>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-8">{ci.noCvText}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Motivation tab ── */}
            {hasMotivationText && (
              <TabsContent value="motivation" className="mt-4">
                <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> Motivation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                      {candidate.motivationText}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Email sending dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{cd.sendEmail} — {candidate.firstName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <Mail size={14} className="text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">To: <strong>{candidate.email}</strong></span>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">From (your email)</Label>
                <Input
                  value={emailFrom}
                  onChange={e => setEmailFrom(e.target.value)}
                  placeholder={t.dashboard?.settingsProfile?.email || 'your-email@company.com'}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {[
                { type: 'interview', label: `📅 ${cd.interview}`, color: 'border-blue-300 text-blue-700 bg-blue-50' },
                { type: 'rejection', label: `❌ ${cd.rejection}`, color: 'border-red-300 text-red-700 bg-red-50' },
                { type: 'followup', label: `📩 ${cd.followup}`, color: 'border-gray-300 text-gray-700 bg-gray-50' },
                { type: 'custom', label: `✉️ Email libre`, color: 'border-purple-300 text-purple-700 bg-purple-50' },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setEmailType(opt.type)
                    if (opt.type === 'custom') {
                      setEmailSubject('')
                      setEmailBody('')
                    } else {
                      setEmailSubject('')
                      setEmailBody('')
                    }
                  }}
                  className={`sm:flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-all ${emailType === opt.type ? opt.color : 'border-gray-200 text-gray-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {emailType !== 'custom' && <Button
              onClick={handleGenerateEmail}
              disabled={generatingEmail}
              variant="outline"
              className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950"
            >
              {generatingEmail ? <Loader2 size={14} className="animate-spin" /> : <span>✨</span>}
              {generatingEmail ? '...' : cd.generateWithAI}
            </Button>}

            <div>
              <Label className="text-xs text-gray-500 mb-1.5">{cd.emailSubject}</Label>
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="text-sm" />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5">{cd.emailBody}</Label>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={7}
                className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {emailType === 'interview' && (
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Video size={12} className="text-blue-500" /> {cd.teamsLink}
                </Label>
                <Input
                  value={teamsLink}
                  onChange={e => setTeamsLink(e.target.value)}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  className="text-sm"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEmail(false)} className="flex-1">{cd.cancel}</Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailBody} className="flex-1 gradient-bg gap-2">
                {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sendingEmail ? cd.sending : cd.send}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
