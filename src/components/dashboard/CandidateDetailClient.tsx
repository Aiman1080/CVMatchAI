'use client'

import { useState, useRef } from 'react'
import {
  Mail, Phone, Linkedin, CheckCircle, XCircle, Clock, Star,
  TrendingUp, TrendingDown, Loader2, RefreshCw, FileText, User, Briefcase,
  GraduationCap, Languages, Award, Flag, Archive, Send, X, Video
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

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_yes: 'bg-green-100 text-green-800 border border-green-200',
  yes: 'bg-blue-100 text-blue-800 border border-blue-200',
  maybe: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  no: 'bg-red-100 text-red-800 border border-red-200',
}
const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_yes: '✅ Très recommandé',
  yes: '👍 Recommandé',
  maybe: '🤔 Peut-être',
  no: '❌ Non recommandé',
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  rejection: {
    subject: 'Votre candidature — Suite du processus',
    body: `Bonjour {name},\n\nNous vous remercions de l'intérêt que vous portez à notre offre et du temps consacré à votre candidature.\n\nAprès examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue pour la suite du processus.\n\nNous vous souhaitons plein succès dans vos recherches.\n\nCordialement`,
  },
  interview: {
    subject: 'Invitation à un entretien',
    body: `Bonjour {name},\n\nNous avons bien étudié votre candidature et nous avons le plaisir de vous inviter à un entretien.\n\nMerci de nous faire part de vos disponibilités ou de cliquer sur le lien ci-dessous pour rejoindre la réunion.\n\nCordialement`,
  },
  followup: {
    subject: 'Suivi de votre candidature',
    body: `Bonjour {name},\n\nNous revenons vers vous concernant votre candidature. Nous souhaitons vous informer que votre dossier est en cours d'examen.\n\nNous reviendrons vers vous dans les prochains jours.\n\nCordialement`,
  },
}

export function CandidateDetailClient({ candidate: initial }: { candidate: any }) {
  const [candidate, setCandidate] = useState(initial)
  const [analyzing, setAnalyzing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState(initial.notes || '')
  const [notesSaved, setNotesSaved] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [emailType, setEmailType] = useState('rejection')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [teamsLink, setTeamsLink] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const score = candidate.matchScore || 0
  const strengths = parseJsonSafe<string[]>(candidate.strengths, [])
  const weaknesses = parseJsonSafe<string[]>(candidate.weaknesses, [])
  const skills = parseJsonSafe<string[]>(candidate.skills, [])
  const initials = `${candidate.firstName?.[0] ?? '?'}${candidate.lastName?.[0] ?? '?'}`.toUpperCase()

  const patch = async (data: any) => {
    setUpdating(true)
    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setCandidate((prev: any) => ({ ...prev, ...updated }))
    setUpdating(false)
    return updated
  }

  const handleStatusChange = async (status: string) => {
    await patch({ status })
    toast({ title: 'Statut mis à jour' })
  }

  const handleToggle = async (field: 'liked' | 'priority' | 'savedToPool') => {
    await patch({ [field]: !candidate[field] })
  }

  const handleNotesChange = (val: string) => {
    setNotes(val)
    setNotesSaved(false)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: val }),
      })
      setNotesSaved(true)
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
        toast({ title: 'Analyse IA terminée', description: `Score : ${data.candidate.matchScore?.toFixed(0)}%` })
      }
    } catch {
      toast({ title: 'Analyse échouée', variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  const openEmailDialog = (type: string) => {
    const tpl = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES.rejection
    const name = `${candidate.firstName} ${candidate.lastName}`
    setEmailType(type)
    setEmailSubject(tpl.subject)
    setEmailBody(tpl.body.replace('{name}', candidate.firstName || name))
    setTeamsLink('')
    setShowEmail(true)
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
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Email envoyé !', description: `Message envoyé à ${candidate.email}` })
        setShowEmail(false)
        if (emailType === 'rejection') setCandidate((p: any) => ({ ...p, status: 'rejected' }))
        if (emailType === 'interview') setCandidate((p: any) => ({ ...p, status: 'shortlisted' }))
      } else {
        toast({ title: data.error || 'Erreur envoi email', variant: 'destructive' })
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
  const scoreBg = score >= 75 ? 'from-green-500 to-emerald-600' : score >= 50 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
  const hasEmailSource = candidate.source === 'email' || candidate.emailSource
  const hasMotivationText = !!candidate.motivationText

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarFallback className="text-xl gradient-bg text-white font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h2>
                  {candidate.liked && <Star className="w-5 h-5 text-amber-500" fill="currentColor" />}
                  {candidate.priority && <Flag className="w-5 h-5 text-red-500" />}
                  {candidate.savedToPool && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-medium border border-amber-200">Vivier talent</span>}
                </div>
                <p className="text-gray-500 mb-2">{candidate.vacancy?.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(candidate.status)}`}>{candidate.status}</span>
                  {candidate.recommendation && (
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${RECOMMENDATION_COLORS[candidate.recommendation] || ''}`}>
                      IA : {RECOMMENDATION_LABELS[candidate.recommendation] || candidate.recommendation}
                    </span>
                  )}
                  {hasEmailSource && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Mail size={10} /> via email</span>}
                  {candidate.language && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full font-medium uppercase">{candidate.language}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Score circle */}
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${scoreBg} flex flex-col items-center justify-center shadow-lg shrink-0`}>
                <span className="text-xl font-bold text-white">{score > 0 ? `${score.toFixed(0)}%` : '—'}</span>
                <span className="text-xs text-white/80">score</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Select value={candidate.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nouveau</SelectItem>
                    <SelectItem value="reviewing">En révision</SelectItem>
                    <SelectItem value="shortlisted">Shortlisté</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                    <SelectItem value="hired">Embauché</SelectItem>
                  </SelectContent>
                </Select>

                {/* Like / Priority / Pool */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle('liked')}
                    disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${candidate.liked ? 'bg-amber-50 text-amber-600 border-amber-200' : 'border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-500'}`}
                    title="Favori"
                  >
                    <Star size={12} fill={candidate.liked ? 'currentColor' : 'none'} /> Favori
                  </button>
                  <button
                    onClick={() => handleToggle('priority')}
                    disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${candidate.priority ? 'bg-red-50 text-red-600 border-red-200' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'}`}
                    title="Priorité"
                  >
                    <Flag size={12} /> Priorité
                  </button>
                  <button
                    onClick={() => handleToggle('savedToPool')}
                    disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${candidate.savedToPool ? 'bg-amber-50 text-amber-700 border-amber-200' : 'border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600'}`}
                    title="Vivier talent"
                  >
                    <Archive size={12} /> Vivier
                  </button>
                </div>

                {candidate.cvContent && (
                  <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={analyzing} className="w-full gap-2">
                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Ré-analyser
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick email actions */}
          {candidate.email && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              <p className="text-xs text-gray-400 self-center mr-1">Contacter :</p>
              <Button size="sm" variant="outline" onClick={() => openEmailDialog('interview')} className="gap-1.5 h-7 text-xs">
                <Video size={12} /> Inviter à un entretien
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEmailDialog('rejection')} className="gap-1.5 h-7 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                <X size={12} /> Envoyer un refus
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEmailDialog('followup')} className="gap-1.5 h-7 text-xs">
                <Send size={12} /> Suivi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Contact
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
                <p>Ajouté le {formatDate(candidate.createdAt)}</p>
                {candidate.analyzedAt && <p>Analysé le {formatDate(candidate.analyzedAt)}</p>}
                {candidate.gdprConsent && <p className="text-green-600">RGPD : Consenti ✓</p>}
              </div>
            </CardContent>
          </Card>

          {skills.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Compétences</CardTitle>
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

          {score > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Score de correspondance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Global</span>
                  <span className={`font-bold text-sm ${scoreColor}`}>{score.toFixed(0)}%</span>
                </div>
                <Progress value={score} className="h-2" />
                <div className="grid grid-cols-3 text-center text-xs text-gray-400">
                  <span className="text-red-500">0–49<br />Faible</span>
                  <span className="text-amber-500">50–74<br />Moyen</span>
                  <span className="text-green-500">75–100<br />Fort</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="analysis">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="analysis">Analyse IA</TabsTrigger>
              <TabsTrigger value="notes">Notes internes</TabsTrigger>
              {hasEmailSource && <TabsTrigger value="email">Email source</TabsTrigger>}
              <TabsTrigger value="cv">CV</TabsTrigger>
              {hasMotivationText && <TabsTrigger value="motivation">Motivation</TabsTrigger>}
            </TabsList>

            {/* ── AI Analysis tab ── */}
            <TabsContent value="analysis" className="space-y-4 mt-4">
              {candidate.summary ? (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                        <Award className="w-4 h-4 text-blue-500" /> Résumé IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">{candidate.summary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {strengths.length > 0 && (
                      <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                            <TrendingUp className="w-4 h-4" /> Points forts
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
                            <TrendingDown className="w-4 h-4" /> Points d'attention
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
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="w-4 h-4 text-indigo-500" />
                              <p className="text-xs font-semibold text-gray-500 uppercase">Expérience</p>
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
                              <p className="text-xs font-semibold text-gray-500 uppercase">Formation</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{candidate.education}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {candidate.recommendation && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="text-2xl">{candidate.recommendation === 'strong_yes' ? '🎯' : candidate.recommendation === 'yes' ? '✅' : candidate.recommendation === 'maybe' ? '🤔' : '❌'}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Recommandation IA</p>
                          <p className="text-sm font-semibold text-gray-800">{RECOMMENDATION_LABELS[candidate.recommendation] || candidate.recommendation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Aucune analyse IA disponible.</p>
                    {candidate.cvContent && (
                      <Button onClick={handleReanalyze} disabled={analyzing} size="sm" className="mt-4 gradient-bg">
                        {analyzing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                        Lancer l'analyse
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Notes tab ── */}
            <TabsContent value="notes" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" /> Notes internes
                    </CardTitle>
                    <span className={`text-xs ${notesSaved ? 'text-green-500' : 'text-gray-400'}`}>
                      {notesSaved ? '✓ Sauvegardé' : 'En cours…'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={e => handleNotesChange(e.target.value)}
                    placeholder="Ajoutez vos notes après l'entretien, vos impressions, les points à vérifier…"
                    className="w-full min-h-64 p-3 text-sm text-gray-700 border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
                  />
                  <p className="text-xs text-gray-400 mt-2">Les notes sont privées et sauvegardées automatiquement.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Email source tab ── */}
            {hasEmailSource && (
              <TabsContent value="email" className="mt-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" /> Email original
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.emailSource ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">De</p>
                            <p className="text-gray-700 font-medium">{candidate.emailSource.sender}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Reçu le</p>
                            <p className="text-gray-700">{formatDate(candidate.emailSource.receivedAt)}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Sujet</p>
                            <p className="text-gray-700 font-medium">{candidate.emailSource.subject}</p>
                          </div>
                          {candidate.emailSource.attachments && (
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Pièces jointes</p>
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
                        <p className="text-xs text-gray-400">Le CV et la lettre de motivation ont été extraits automatiquement de cet email.</p>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Candidat reçu par email</p>
                        <p className="text-gray-400 text-xs mt-1">Métadonnées email non disponibles pour ce candidat.</p>
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
                    <FileText className="w-4 h-4 text-gray-400" /> Texte du CV extrait
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.cvContent ? (
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                      {candidate.cvContent}
                    </pre>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-8">Aucun texte CV disponible</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Motivation tab ── */}
            {hasMotivationText && (
              <TabsContent value="motivation" className="mt-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> Lettre de motivation
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

      {/* Email sending dialog */}
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Envoyer un email à {candidate.firstName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm">
              <Mail size={14} className="text-gray-400" />
              <span className="text-gray-600">À : <strong>{candidate.email}</strong></span>
            </div>

            <div className="flex gap-2">
              {[
                { type: 'interview', label: '📅 Entretien', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                { type: 'rejection', label: '❌ Refus', color: 'border-red-300 text-red-700 bg-red-50' },
                { type: 'followup', label: '📩 Suivi', color: 'border-gray-300 text-gray-700 bg-gray-50' },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setEmailType(opt.type)
                    const tpl = EMAIL_TEMPLATES[opt.type]
                    setEmailSubject(tpl.subject)
                    setEmailBody(tpl.body.replace('{name}', candidate.firstName))
                  }}
                  className={`flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-all ${emailType === opt.type ? opt.color : 'border-gray-200 text-gray-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5">Sujet</Label>
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="text-sm" />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5">Message</Label>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={7}
                className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {emailType === 'interview' && (
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Video size={12} className="text-blue-500" /> Lien Teams / Meet (optionnel)
                </Label>
                <Input
                  value={teamsLink}
                  onChange={e => setTeamsLink(e.target.value)}
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Le lien sera automatiquement ajouté à la fin du message.</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEmail(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailBody} className="flex-1 gradient-bg gap-2">
                {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
