'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, ArrowRight, CheckCircle, Sparkles,
  Brain, FileText, MessageSquareText, Trophy, ClipboardList, Mail,
  Upload, Plug, Shield, Users, BarChart3, Kanban
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const AI_FEATURES = [
  {
    icon: Brain,
    title: 'AI CV Analysis',
    desc: 'Upload a CV, get an instant match score (0-100), strengths, weaknesses, skills extraction, and a hire/reject recommendation.',
    tag: 'Core feature',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MessageSquareText,
    title: 'AI Interview Questions',
    desc: 'Generate 8 personalized interview questions based on each candidate\'s CV and the job requirements. Technical, behavioral, situational — not generic.',
    tag: 'Save 30 min per interview',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: FileText,
    title: 'AI Job Description',
    desc: 'Type a job title and a few keywords. Get a complete, professional job description with requirements and nice-to-haves in seconds.',
    tag: 'Write vacancies 10x faster',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Trophy,
    title: 'AI Candidate Ranking',
    desc: 'Compare all candidates side-by-side with AI reasoning. Know exactly WHY candidate #1 is better than #2 for this specific role.',
    tag: 'Data-driven hiring decisions',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: ClipboardList,
    title: 'AI Hiring Report',
    desc: 'Generate a professional 1-page report for the hiring manager. Candidate overview, score, strengths, concerns, recommendation — ready to share.',
    tag: 'Professional reports in 1 click',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Mail,
    title: 'AI Email Generator',
    desc: 'Generate personalized interview invitations or rejection emails. One click, professional tone, in the candidate\'s language (EN/NL/FR).',
    tag: 'Multilingual AI emails',
    color: 'from-sky-500 to-blue-500',
  },
]

const PLATFORM_FEATURES = [
  { icon: Upload, title: 'Bulk CV Upload', desc: 'Upload PDF, DOCX, or text files. Parser extracts text and triggers AI analysis automatically.', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' },
  { icon: Mail, title: 'Email Inbox Scanning', desc: 'Connect your recruitment inbox. AI auto-detects CVs in emails, ignores spam, creates candidate profiles.', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
  { icon: Plug, title: 'ATS Integrations', desc: 'Connect Teamtailor, Recruitee, SmartRecruiters. Import candidates and vacancies with one click.', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { icon: Users, title: 'Pipeline Management', desc: 'Move candidates through stages: New, Reviewing, Shortlisted, Hired. Full recruitment workflow.', color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track hiring metrics, pipeline conversion rates, time-to-hire, and candidate source performance.', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  { icon: Shield, title: 'GDPR Compliant', desc: 'Encrypted storage, consent tracking, data export, automatic deletion. Full GDPR compliance built-in.', color: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400' },
]

export default function LandingPage() {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-bold text-gray-900 dark:text-white text-lg">CVMatch AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <a href="#ai-features" className="hover:text-gray-900 dark:hover:text-white transition-colors">AI Features</a>
            <a href="#platform" className="hover:text-gray-900 dark:hover:text-white transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.nav.pricing}</a>
          </div>
          <div className="flex items-center gap-3">
            {mounted ? (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            ) : null}
            <LanguageSwitcher />
            <Link href="/login"><Button variant="ghost" size="sm">{t.nav.signIn}</Button></Link>
            <Link href="/register"><Button size="sm" className="gradient-bg">{t.nav.startFree}</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-blue-950 text-white py-28 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-4 py-1.5 rounded-full mb-8">
            <Sparkles size={14} className="text-blue-400" />
            {t.hero.badge}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            {t.hero.title1}
            <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gradient-bg shadow-xl gap-2">
                {t.hero.startFree} <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                {t.hero.viewDemo}
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">{t.hero.tagline}</p>
        </div>

        {/* Mock UI */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Candidates Analyzed', value: '1,247', color: 'text-blue-400' },
                { label: 'Avg. Match Score', value: '78%', color: 'text-green-400' },
                { label: 'Time Saved', value: '80%', color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { name: 'Sophie De Groote', role: 'Senior Developer', score: 92 },
                { name: 'Lena Braun', role: 'UX Designer', score: 88 },
                { name: 'Thomas Vermeersch', role: 'Full-Stack Dev', score: 74 },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.role}</div>
                  </div>
                  <div className="text-sm font-bold text-white">{c.score}%</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-500 mb-2">Connected ATS platforms</div>
              <div className="flex gap-2">
                {[
                  { name: 'Teamtailor', dot: 'bg-green-400' },
                  { name: 'Recruitee', dot: 'bg-blue-400' },
                  { name: 'SmartRecruiters', dot: 'bg-purple-400' },
                ].map(ats => (
                  <div key={ats.name} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${ats.dot}`} />
                    <span className="text-xs text-gray-300">{ats.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI FEATURES ═══ */}
      <section id="ai-features" className="py-24 px-6 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm px-4 py-1.5 rounded-full mb-6">
              <Sparkles size={14} /> 6 AI-Powered Features
            </div>
            <h2 className="text-4xl font-bold mb-4">AI That Does the Work For You</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Every repetitive HR task — automated. Every decision — backed by AI analysis. Save hours every week and hire with confidence.</p>
          </div>

          {/* Main AI feature: CV Analysis (hero card) */}
          <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">AI CV Analysis</h3>
                    <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">Core feature</span>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-4">Upload a CV, get an instant match score (0-100), detailed strengths and weaknesses, skills extraction, experience summary, and a hire/reject recommendation. Works with PDF, DOCX, and plain text. Supports English, Dutch, French, and German CVs.</p>
                <div className="flex flex-wrap gap-3">
                  {['Match Score 0-100', 'Strengths & Weaknesses', 'Skills Extraction', 'Hire Recommendation', 'Multi-language'].map(tag => (
                    <span key={tag} className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/10">
                  <div className="text-center mb-3">
                    <div className="text-4xl font-extrabold text-green-400">87%</div>
                    <div className="text-xs text-gray-400 mt-1">Match Score</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><CheckCircle size={12} className="text-green-400 shrink-0" /><span className="text-gray-300">5 years React experience</span></div>
                    <div className="flex items-center gap-2"><CheckCircle size={12} className="text-green-400 shrink-0" /><span className="text-gray-300">TypeScript & Node.js</span></div>
                    <div className="flex items-center gap-2"><CheckCircle size={12} className="text-amber-400 shrink-0" /><span className="text-gray-300">No Kubernetes experience</span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-center">
                    <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-medium">Recommended</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other 5 AI features in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FEATURES.slice(1).map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">{feature.desc}</p>
                  <span className="inline-block text-xs bg-white/10 text-blue-300 px-3 py-1 rounded-full font-medium">{feature.tag}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM FEATURES ═══ */}
      <section id="platform" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Built for Modern Recruiters</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to manage your recruitment pipeline, from intake to hire.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.howItWorks.title}</h2>
          </div>
          <div className="space-y-8">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.pricing.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.pricing.plans.map((plan, idx) => {
              const highlight = idx === 1
              return (
                <div key={plan.name} className={`p-8 rounded-2xl border-2 ${highlight ? 'border-blue-500 shadow-xl md:scale-105' : 'border-gray-100 dark:border-gray-800'}`}>
                  {highlight && (
                    <div className="text-center mb-4">
                      <span className="gradient-bg text-white text-xs px-3 py-1 rounded-full font-medium">{t.pricing.mostPopular}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className={`w-full ${highlight ? 'gradient-bg' : ''}`} variant={highlight ? 'default' : 'outline'}>{plan.cta}</Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">{t.cta.title}</h2>
          <p className="text-xl text-blue-100 mb-10">{t.cta.subtitle}</p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl gap-2">
              {t.cta.button} <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-white font-semibold">CVMatch AI</span>
          </div>
          <p className="text-sm">{t.footer.copyright}</p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white">{t.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-white">{t.footer.terms}</Link>
            <Link href="/contact" className="hover:text-white">{t.footer.contact}</Link>
            <LanguageSwitcher dark />
          </div>
        </div>
      </footer>
    </div>
  )
}
