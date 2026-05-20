import Link from 'next/link'
import { Zap, ArrowRight, CheckCircle, Upload, Brain, BarChart3, Mail, Shield, Users, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">CVMatch AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/register"><Button size="sm" className="gradient-bg">Start free</Button></Link>
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
            <Zap size={14} className="text-blue-400" />
            Powered by Claude AI
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Hire smarter with
            <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AI-powered recruitment
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload CVs, connect your inbox, and let AI rank candidates, generate match scores, and surface the best talent — in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"><Button size="lg" className="gradient-bg shadow-xl gap-2">Start for free <ArrowRight size={18} /></Button></Link>
            <Link href="/login"><Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">View Demo</Button></Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required · GDPR compliant · Free forever plan</p>
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
              {[{label:'Total Candidates',value:'247',color:'text-blue-400'},{label:'Avg. Match Score',value:'78%',color:'text-green-400'},{label:'Shortlisted',value:'34',color:'text-purple-400'}].map(s=>(
                <div key={s.label} className="bg-white/5 rounded-xl p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[{name:'Sophie De Groote',role:'Senior Developer',score:92},{name:'Lena Braun',role:'UX Designer',score:88},{name:'Thomas Vermeersch',role:'Full-Stack Dev',score:74}].map((c,i)=>(
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white">{i+1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.role}</div>
                  </div>
                  <div className="text-sm font-bold text-white">{c.score}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to hire faster</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">AI automation handles screening so your team can focus on finding the right people.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {icon:Brain,title:'AI-Powered Analysis',desc:'Claude AI reads every CV, extracts skills, and generates a detailed compatibility score.',color:'bg-blue-100 text-blue-600'},
              {icon:Upload,title:'Bulk CV Upload',desc:'Upload PDF, DOCX, or text files. Parser extracts text and sends it to AI analysis automatically.',color:'bg-indigo-100 text-indigo-600'},
              {icon:Mail,title:'Email Inbox Scanning',desc:'Connect your recruitment inbox. AI auto-detects CVs, ignores spam, creates candidate profiles.',color:'bg-purple-100 text-purple-600'},
              {icon:BarChart3,title:'Smart Ranking',desc:'Candidates are ranked by match score. See strengths, weaknesses, and AI recommendations.',color:'bg-green-100 text-green-600'},
              {icon:Users,title:'Pipeline Management',desc:'Move candidates through stages: New → Reviewing → Shortlisted → Hired.',color:'bg-amber-100 text-amber-600'},
              {icon:Shield,title:'GDPR Compliant',desc:'Encrypted storage, consent tracking, data export, automatic deletion, DPA agreement.',color:'bg-teal-100 text-teal-600'},
            ].map((f,i)=>(
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
          </div>
          <div className="space-y-8">
            {[
              {step:'01',title:'Create a vacancy',desc:'Post your job requirements, skills, and description. Takes 2 minutes.'},
              {step:'02',title:'Upload CVs or connect inbox',desc:'Drag and drop PDF/DOCX files, or connect your email to auto-scan incoming applications.'},
              {step:'03',title:'AI analyzes & ranks',desc:'Claude AI reads every document, computes match scores, and ranks candidates automatically.'},
              {step:'04',title:'Review & hire',desc:'See ranked candidates with scores, summaries, strengths and weaknesses. Pick the best fit.'},
            ].map((step,i)=>(
              <div key={i} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-500">{step.desc}</p>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Start free, upgrade when you need more</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {name:'Free',price:'€0',period:'forever',features:['5 active vacancies','50 candidates/month','AI match scoring','Basic dashboard'],cta:'Get started free',highlight:false},
              {name:'Pro',price:'€49',period:'/month',features:['Unlimited vacancies','500 candidates/month','Advanced AI analysis','Email inbox scanning','Analytics','Priority support'],cta:'Start Pro trial',highlight:true},
              {name:'Enterprise',price:'Custom',period:'pricing',features:['Unlimited everything','Custom AI models','API & webhooks','SSO & SAML','Dedicated manager','SLA 99.9%'],cta:'Contact sales',highlight:false},
            ].map(plan=>(
              <div key={plan.name} className={`p-8 rounded-2xl border-2 ${plan.highlight?'border-blue-500 shadow-xl scale-105':'border-gray-100'}`}>
                {plan.highlight&&<div className="text-center mb-4"><span className="gradient-bg text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</span></div>}
                <h3 className="font-bold text-gray-900 text-xl mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f,i)=>(
                    <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className={`w-full ${plan.highlight?'gradient-bg':''}`} variant={plan.highlight?'default':'outline'}>{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to hire 5× faster?</h2>
          <p className="text-xl text-blue-100 mb-10">Join hundreds of recruiters who cut screening time by 80%.</p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl gap-2">
              Start for free today <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold">CVMatch AI</span>
          </div>
          <p className="text-sm">© 2025 CVMatch AI. Built for modern recruiters. GDPR compliant.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
