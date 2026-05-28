'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Clock, MapPin, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { toast } from '@/components/ui/use-toast'

export default function ContactPage() {
  const { locale } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const content = {
    en: {
      title: 'Contact us',
      subtitle: 'We usually respond within 24 hours on business days.',
      form: {
        name: 'Full name', email: 'Email address', subject: 'Subject', message: 'Message',
        send: 'Send message', sending: 'Sending…', sent: 'Message sent!',
        placeholder_message: 'How can we help you?',
      },
      cards: [
        { icon: Mail, title: 'General enquiries', value: 'contactcvmatchia@gmail.com', href: 'mailto:contactcvmatchia@gmail.com' },
        { icon: MessageSquare, title: 'Support', value: 'contactcvmatchia@gmail.com', href: 'mailto:contactcvmatchia@gmail.com' },
        { icon: Clock, title: 'Response time', value: 'Within 24h (business days)', href: null },
        { icon: MapPin, title: 'Headquarters', value: 'Brussels, Belgium 🇧🇪', href: null },
      ],
      successTitle: 'Message received!',
      successText: 'Thank you for reaching out. We will get back to you within 24 hours.',
    },
    nl: {
      title: 'Contacteer ons',
      subtitle: 'We reageren normaal binnen 24 uur op werkdagen.',
      form: {
        name: 'Volledige naam', email: 'E-mailadres', subject: 'Onderwerp', message: 'Bericht',
        send: 'Bericht versturen', sending: 'Verzenden…', sent: 'Bericht verzonden!',
        placeholder_message: 'Hoe kunnen we u helpen?',
      },
      cards: [
        { icon: Mail, title: 'Algemene vragen', value: 'contactcvmatchia@gmail.com', href: 'mailto:contactcvmatchia@gmail.com' },
        { icon: MessageSquare, title: 'Ondersteuning', value: 'contactcvmatchia@gmail.com', href: 'mailto:contactcvmatchia@gmail.com' },
        { icon: Clock, title: 'Reactietijd', value: 'Binnen 24u (werkdagen)', href: null },
        { icon: MapPin, title: 'Hoofdkantoor', value: 'Brussel, België 🇧🇪', href: null },
      ],
      successTitle: 'Bericht ontvangen!',
      successText: 'Bedankt voor uw bericht. We nemen binnen 24 uur contact met u op.',
    },
    fr: {
      title: 'Contactez-nous',
      subtitle: 'Nous répondons généralement dans les 24h en jours ouvrables.',
      form: {
        name: 'Nom complet', email: 'Adresse e-mail', subject: 'Sujet', message: 'Message',
        send: 'Envoyer le message', sending: 'Envoi…', sent: 'Message envoyé !',
        placeholder_message: 'Comment pouvons-nous vous aider ?',
      },
      cards: [
        { icon: Mail, title: 'Renseignements généraux', value: 'contactcvmatchia@gmail.com', href: 'mailto:contactcvmatchia@gmail.com' },
        { icon: MessageSquare, title: 'Support', value: 'contactcvmatchia@gmail.com', href: 'mailto:contactcvmatchia@gmail.com' },
        { icon: Clock, title: 'Délai de réponse', value: 'Sous 24h (jours ouvrables)', href: null },
        { icon: MapPin, title: 'Siège social', value: 'Bruxelles, Belgique 🇧🇪', href: null },
      ],
      successTitle: 'Message reçu !',
      successText: 'Merci de nous avoir contactés. Nous vous répondrons dans les 24 heures.',
    },
  }

  const c = content[locale as keyof typeof content] || content.fr

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) return
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      toast({ title: c.successTitle, description: c.successText })
    } catch {
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-gray-900 dark:text-white">DeltaMatch</span>
          </Link>
          <div className="flex items-center gap-4">

            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={15} />
              {locale === 'nl' ? 'Terug' : locale === 'en' ? 'Back' : 'Retour'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-900 py-10 sm:py-16 px-4 sm:px-6 text-center border-b border-gray-100 dark:border-gray-800">
        <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{c.title}</h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">{c.subtitle}</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14">
          {c.cards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">{card.title}</p>
                {card.href ? (
                  <a href={card.href} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    {card.value} <ExternalLink size={11} />
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{card.value}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Contact form */}
        <div className="max-w-2xl mx-auto">
          {sent ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{c.successTitle}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{c.successText}</p>
              <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}>
                {locale === 'nl' ? 'Nieuw bericht' : locale === 'en' ? 'Send another' : 'Nouveau message'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{c.form.name} <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{c.form.email} <span className="text-red-500">*</span></label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{c.form.subject} <span className="text-red-500">*</span></label>
                <input
                  type="text" required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{c.form.message} <span className="text-red-500">*</span></label>
                <textarea
                  required rows={6}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={c.form.placeholder_message}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full gradient-bg h-11 text-base font-semibold">
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{c.form.sending}</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" />{c.form.send}</>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} DeltaMatch</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">
              {locale === 'nl' ? 'Privacy' : locale === 'en' ? 'Privacy' : 'Confidentialité'}
            </Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">
              {locale === 'nl' ? 'Voorwaarden' : locale === 'en' ? 'Terms' : 'Conditions'}
            </Link>
            <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white text-blue-600 dark:text-blue-400 font-medium">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
