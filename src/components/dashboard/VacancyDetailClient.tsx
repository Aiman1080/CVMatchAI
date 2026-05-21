'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Briefcase, DollarSign, Users, Upload, Star, ChevronRight,
  Pencil, Trash2, CheckCircle, XCircle, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UploadCVDialog } from './UploadCVDialog'
import { getStatusColor, formatDate, parseJsonSafe } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string | null
  matchScore: number | null
  status: string
  source: string
  strengths: string | null
  skills: string | null
  createdAt: Date
}

interface Vacancy {
  id: string
  title: string
  company: string
  department: string | null
  location: string | null
  type: string
  description: string
  requirements: string
  niceToHave: string | null
  salary: string | null
  status: string
  language: string
  createdAt: Date
  candidates: Candidate[]
}

export function VacancyDetailClient({ vacancy: initial, userId }: { vacancy: Vacancy; userId: string }) {
  const [vacancy, setVacancy] = useState(initial)
  const [showUpload, setShowUpload] = useState(false)

  const handleCandidateAdded = (candidate: any) => {
    setVacancy(prev => ({
      ...prev,
      candidates: [candidate, ...prev.candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)),
    }))
    setShowUpload(false)
  }

  const handleStatusChange = async (candidateId: string, status: string) => {
    await fetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setVacancy(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => c.id === candidateId ? { ...c, status } : c),
    }))
    toast({ title: 'Status updated', description: `Candidate status changed to ${status}` })
  }

  const sortedCandidates = [...vacancy.candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

  return (
    <div className="space-y-6">
      {/* Vacancy Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{vacancy.title}</h2>
                  <p className="text-gray-500">{vacancy.company} · {vacancy.department}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(vacancy.status)}`}>{vacancy.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {vacancy.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{vacancy.location}</span>}
              <span className="flex items-center gap-1.5"><Briefcase size={14} />{vacancy.type}</span>
              {vacancy.salary && <span className="flex items-center gap-1.5"><DollarSign size={14} />{vacancy.salary}</span>}
              <span className="flex items-center gap-1.5"><Clock size={14} />Posted {formatDate(vacancy.createdAt)}</span>
            </div>

            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{vacancy.description}</p>
              </TabsContent>
              <TabsContent value="requirements">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{vacancy.requirements}</p>
                {vacancy.niceToHave && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Nice to Have:</p>
                    <p className="text-gray-600 text-sm">{vacancy.niceToHave}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900">{vacancy.candidates.length}</div>
                <div className="text-sm text-gray-500">Total Candidates</div>
              </div>
              <div className="space-y-2 text-sm">
                {['new', 'reviewing', 'shortlisted', 'rejected'].map(s => {
                  const count = vacancy.candidates.filter(c => c.status === s).length
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s)}`}>{s}</span>
                      <span className="font-semibold text-gray-700">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setShowUpload(true)} className="w-full gradient-bg gap-2">
            <Upload size={16} /> Upload CV
          </Button>
        </div>
      </div>

      {/* Candidate Rankings */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Candidate Rankings
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowUpload(true)} className="gap-1">
            <Upload size={13} /> Add Candidate
          </Button>
        </CardHeader>
        <CardContent>
          {sortedCandidates.length === 0 ? (
            <div className="text-center py-10">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No candidates yet. Upload CVs to start AI matching.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCandidates.map((c, i) => {
                const initials = `${c.firstName[0]}${c.lastName[0]}`.toUpperCase()
                const score = c.matchScore || 0
                const skills = parseJsonSafe<string[]>(c.skills, [])

                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-1 shrink-0 w-6 text-center">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-gray-300'}`}>
                        #{i + 1}
                      </span>
                    </div>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/candidates/${c.id}`} className="font-semibold text-gray-900 text-sm hover:text-blue-600">
                          {c.firstName} {c.lastName}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                        {c.source === 'email' && <span className="text-xs text-blue-500 font-medium">via email</span>}
                      </div>
                      {c.email && <p className="text-xs text-gray-400 mb-1.5">{c.email}</p>}
                      {skills.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {skills.slice(0, 4).map((s, j) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {score.toFixed(0)}%
                        </div>
                        <Progress value={score} className="w-16 h-1.5 mt-1" />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(c.id, 'shortlisted')}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-gray-400 hover:text-green-600"
                          title="Shortlist"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(c.id, 'rejected')}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                      <Link href={`/candidates/${c.id}`} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadCVDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        vacancyId={vacancy.id}
        vacancyTitle={vacancy.title}
        onUploaded={handleCandidateAdded}
      />
    </div>
  )
}
