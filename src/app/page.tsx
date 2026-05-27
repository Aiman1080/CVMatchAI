'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, ArrowRight, CheckCircle, Sparkles,
  Brain, FileText, MessageSquareText, Trophy, ClipboardList, Mail,
  Upload, Plug, Shield, Users, BarChart3, Kanban, Send, Bot
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

/* ═══════════════════════════════════════════════
   useScrollReveal – IntersectionObserver hook
   Fades in + slides up when element enters viewport
   ═══════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el) } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

/* ═══════════════════════════════════════════════
   <ScrollReveal> – wrapper with stagger support
   ═══════════════════════════════════════════════ */
function ScrollReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal(0.1)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   useAnimatedCounter – counts from 0 to target
   Uses requestAnimationFrame + easeOutExpo
   Starts only when element is in viewport
   ═══════════════════════════════════════════════ */
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          observer.unobserve(el)
          const startTime = performance.now()
          const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { ref, count }
}

/* ═══════════════════════════════════════════════
   AnimatedStat – single animated stat display
   ═══════════════════════════════════════════════ */
function AnimatedStat({ label, rawValue, color }: { label: string; rawValue: string; color: string }) {
  const numeric = parseInt(rawValue.replace(/[^0-9]/g, ''), 10)
  const suffix = rawValue.includes('%') ? '%' : ''
  const formatted = rawValue.includes(',')
  const { ref, count } = useAnimatedCounter(numeric)

  const displayValue = formatted
    ? count.toLocaleString() + suffix
    : count + suffix

  return (
    <div ref={ref} className="bg-white/80 dark:bg-white/5 rounded-xl p-4">
      <div className={`text-2xl font-bold ${color}`}>{displayValue}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Floating particles data
   ═══════════════════════════════════════════════ */
const PARTICLES = [
  { size: 6, top: '12%', left: '8%',  color: 'bg-blue-400',   cls: 'particle-1', opacity: 0.15 },
  { size: 4, top: '25%', left: '85%', color: 'bg-indigo-400', cls: 'particle-2', opacity: 0.12 },
  { size: 8, top: '60%', left: '12%', color: 'bg-cyan-400',   cls: 'particle-3', opacity: 0.1  },
  { size: 5, top: '75%', left: '78%', color: 'bg-blue-400',   cls: 'particle-4', opacity: 0.18 },
  { size: 7, top: '40%', left: '92%', color: 'bg-indigo-400', cls: 'particle-5', opacity: 0.13 },
  { size: 4, top: '18%', left: '55%', color: 'bg-cyan-400',   cls: 'particle-6', opacity: 0.1  },
  { size: 6, top: '85%', left: '35%', color: 'bg-blue-400',   cls: 'particle-7', opacity: 0.15 },
]

export default function LandingPage() {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [heroReady, setHeroReady] = useState(false)

  const AI_FEATURES = [
    {
      icon: Brain,
      title: t.landing.aiFeatures.cvAnalysis.title,
      desc: t.landing.aiFeatures.cvAnalysis.desc,
      tag: t.landing.aiFeatures.cvAnalysis.tag,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageSquareText,
      title: t.landing.aiFeatures.interviewQuestions.title,
      desc: t.landing.aiFeatures.interviewQuestions.desc,
      tag: t.landing.aiFeatures.interviewQuestions.tag,
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: FileText,
      title: t.landing.aiFeatures.jobDescription.title,
      desc: t.landing.aiFeatures.jobDescription.desc,
      tag: t.landing.aiFeatures.jobDescription.tag,
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Trophy,
      title: t.landing.aiFeatures.candidateRanking.title,
      desc: t.landing.aiFeatures.candidateRanking.desc,
      tag: t.landing.aiFeatures.candidateRanking.tag,
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: ClipboardList,
      title: t.landing.aiFeatures.hiringReport.title,
      desc: t.landing.aiFeatures.hiringReport.desc,
      tag: t.landing.aiFeatures.hiringReport.tag,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Mail,
      title: t.landing.aiFeatures.emailGenerator.title,
      desc: t.landing.aiFeatures.emailGenerator.desc,
      tag: t.landing.aiFeatures.emailGenerator.tag,
      color: 'from-sky-500 to-blue-500',
    },
    {
      icon: Send,
      title: t.landing.aiFeatures.summaryEmail?.title || 'AI Summary Email',
      desc: t.landing.aiFeatures.summaryEmail?.desc || 'Send a professional summary of all shortlisted candidates to the hiring manager. Includes scores, strengths, weaknesses, and interview notes.',
      tag: t.landing.aiFeatures.summaryEmail?.tag || '1-click hiring report',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Bot,
      title: t.landing.aiFeatures.supportChat?.title || 'AI Support Chat',
      desc: t.landing.aiFeatures.supportChat?.desc || 'Built-in AI assistant answers user questions instantly. If it can\'t help, it creates a support ticket with full context.',
      tag: t.landing.aiFeatures.supportChat?.tag || '24/7 AI support',
      color: 'from-indigo-500 to-violet-500',
    },
  ]

  const PLATFORM_FEATURES = [
    { icon: Upload, title: t.landing.platformFeatures.bulkUpload.title, desc: t.landing.platformFeatures.bulkUpload.desc, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' },
    { icon: Mail, title: t.landing.platformFeatures.emailScanning.title, desc: t.landing.platformFeatures.emailScanning.desc, color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
    { icon: Plug, title: t.landing.platformFeatures.atsIntegrations.title, desc: t.landing.platformFeatures.atsIntegrations.desc, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
    { icon: Users, title: t.landing.platformFeatures.pipeline.title, desc: t.landing.platformFeatures.pipeline.desc, color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' },
    { icon: BarChart3, title: t.landing.platformFeatures.analytics.title, desc: t.landing.platformFeatures.analytics.desc, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
    { icon: Shield, title: t.landing.platformFeatures.gdpr.title, desc: t.landing.platformFeatures.gdpr.desc, color: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400' },
  ]

  useEffect(() => {
    setMounted(true)
    // Trigger hero animation after mount
    requestAnimationFrame(() => { setHeroReady(true) })
  }, [])

  /* Smooth-scroll handler for nav links */
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href')
    if (href?.startsWith('#')) {
      e.preventDefault()
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

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
            <a href="#ai-features" onClick={handleNavClick} className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.landing.navAiFeatures}</a>
            <a href="#platform" onClick={handleNavClick} className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.landing.navPlatform}</a>
            <a href="#pricing" onClick={handleNavClick} className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.nav.pricing}</a>
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
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 dark:from-slate-950 dark:via-blue-950 dark:to-blue-950 text-gray-900 dark:text-white py-28 px-6">
        {/* Background blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className={`particle ${p.cls} ${p.color}`}
            style={{ width: p.size, height: p.size, top: p.top, left: p.left, opacity: p.opacity }}
          />
        ))}

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-blue-600/10 dark:bg-blue-500/10 border border-blue-400/30 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full mb-8"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
            }}
          >
            <Sparkles size={14} className="text-blue-400" />
            {t.hero.badge}
          </div>

          {/* Hero title line 1 – fades in + slides down */}
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            <span
              className="block"
              style={{
                opacity: heroReady ? 1 : 0,
                transform: heroReady ? 'translateY(0)' : 'translateY(-20px)',
                transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
              }}
            >
              {t.hero.title1}
            </span>
            {/* Hero title line 2 – fades in + slides up, 200ms delay */}
            <span
              className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"
              style={{
                opacity: heroReady ? 1 : 0,
                transform: heroReady ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.7s ease-out 0.2s, transform 0.7s ease-out 0.2s',
              }}
            >
              {t.hero.title2}
            </span>
          </h1>

          {/* Subtitle – 400ms delay */}
          <p
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 0.7s ease-out 0.4s, transform 0.7s ease-out 0.4s',
            }}
          >
            {t.hero.subtitle}
          </p>

          {/* CTA buttons – 600ms delay */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 0.7s ease-out 0.6s, transform 0.7s ease-out 0.6s',
            }}
          >
            <Link href="/register">
              <Button size="lg" className="gradient-bg shadow-xl gap-2">
                {t.hero.startFree} <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-blue-300 dark:border-white/30 text-blue-700 dark:text-white bg-blue-50 dark:bg-white/10 hover:bg-blue-100 dark:hover:bg-white/20 backdrop-blur-sm">
                {t.hero.viewDemo}
              </Button>
            </Link>
          </div>
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mt-4"
            style={{
              opacity: heroReady ? 1 : 0,
              transition: 'opacity 0.7s ease-out 0.7s',
            }}
          >
            {t.hero.tagline}
          </p>
        </div>

        {/* Mock UI */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-blue-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: t.landing.mockUi.candidatesAnalyzed, value: '1,247', color: 'text-blue-400' },
                { label: t.landing.mockUi.avgMatchScore, value: '78%', color: 'text-green-400' },
                { label: t.landing.mockUi.timeSaved, value: '80%', color: 'text-purple-400' },
              ].map(s => (
                <AnimatedStat key={s.label} label={s.label} rawValue={s.value} color={s.color} />
              ))}
            </div>
            <div className="space-y-2">
              {[
                { name: 'Sophie De Groote', role: 'Senior Developer', score: 92 },
                { name: 'Lena Braun', role: 'UX Designer', score: 88 },
                { name: 'Thomas Vermeersch', role: 'Full-Stack Dev', score: 74 },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                  <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.role}</div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{c.score}%</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-white/10">
              <div className="text-xs text-gray-500 mb-2">{t.landing.mockUi.connectedAts}</div>
              <div className="flex gap-2">
                {[
                  { name: 'Teamtailor', dot: 'bg-green-400' },
                  { name: 'Greenhouse', dot: 'bg-emerald-400' },
                  { name: 'Bullhorn', dot: 'bg-orange-400' },
                  { name: 'Personio', dot: 'bg-pink-400' },
                  { name: '+10 more', dot: 'bg-gray-400' },
                ].map(ats => (
                  <div key={ats.name} className="flex items-center gap-1.5 bg-blue-100 dark:bg-white/10 rounded-full px-3 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${ats.dot}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{ats.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI FEATURES ═══ */}
      <section id="ai-features" className="py-24 px-6 bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 text-gray-900 dark:text-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-600/10 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full mb-6">
                <Sparkles size={14} /> {t.landing.aiSection.badge}
              </div>
              <h2 className="text-4xl font-bold mb-4">{t.landing.aiSection.title}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t.landing.aiSection.subtitle}</p>
            </div>
          </ScrollReveal>

          {/* Main AI feature: CV Analysis (hero card) */}
          <ScrollReveal delay={100}>
            <div className="group mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 backdrop-blur-sm hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{t.landing.aiFeatures.cvAnalysis.title}</h3>
                      <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">{t.landing.aiFeatures.cvAnalysis.tag}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t.landing.aiFeatures.cvAnalysis.desc}</p>
                  <div className="flex flex-wrap gap-3">
                    {t.landing.aiFeatures.cvAnalysis.tags.map(tag => (
                      <span key={tag} className="text-xs bg-blue-100 dark:bg-white/10 text-blue-700 dark:text-gray-300 px-3 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-72 shrink-0">
                  <div className="bg-white/80 dark:bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-blue-200 dark:border-white/10">
                    <div className="text-center mb-3">
                      <div className="text-4xl font-extrabold text-green-400">87%</div>
                      <div className="text-xs text-gray-400 mt-1">{t.landing.mockUi.matchScore}</div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2"><CheckCircle size={12} className="text-green-400 shrink-0" /><span className="text-gray-300">5 years React experience</span></div>
                      <div className="flex items-center gap-2"><CheckCircle size={12} className="text-green-400 shrink-0" /><span className="text-gray-300">TypeScript & Node.js</span></div>
                      <div className="flex items-center gap-2"><CheckCircle size={12} className="text-amber-400 shrink-0" /><span className="text-gray-300">No Kubernetes experience</span></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-white/10 text-center">
                      <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-medium">{t.landing.mockUi.recommended}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Other 5 AI features in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_FEATURES.slice(1).map((feature, i) => {
              const Icon = feature.icon
              return (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="group p-6 rounded-2xl bg-white/60 dark:bg-white/5 border border-blue-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 transition-all duration-300">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-3">{feature.desc}</p>
                    <span className="inline-block text-xs bg-blue-100 dark:bg-white/10 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">{feature.tag}</span>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM FEATURES ═══ */}
      <section id="platform" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.landing.platformSection.title}</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{t.landing.platformSection.subtitle}</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300 border-l-0 hover:border-l-[3px] hover:border-l-blue-500">
                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.howItWorks.title}</h2>
            </div>
          </ScrollReveal>
          <div className="space-y-8">
            {t.howItWorks.steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-white font-bold text-lg">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{step.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t.pricing.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">{t.pricing.subtitle}</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {t.pricing.plans.map((plan, idx) => {
              const highlight = idx === 1
              return (
                <ScrollReveal key={plan.name} delay={idx * 150}>
                  <div className={`p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${highlight ? 'border-blue-500 shadow-xl md:scale-105' : 'border-gray-100 dark:border-gray-800'}`}>
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
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-4">{t.cta.title}</h2>
            <p className="text-xl text-blue-100 mb-10">{t.cta.subtitle}</p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl gap-2">
                {t.cta.button} <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
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
