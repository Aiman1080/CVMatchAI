import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Generate a self-contained HTML PDF page — browser-print or puppeteer-compatible
function buildPDFHtml(candidates: any[], vacancyTitle: string, generatedBy: string, company: string) {
  const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  const rows = candidates.map((c, i) => {
    const score = c.matchScore ? Math.round(c.matchScore) : null
    const scoreColor = !score ? '#9ca3af' : score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
    const skills = (() => { try { return JSON.parse(c.skills || '[]').slice(0, 5).join(', ') } catch { return '' } })()
    const strengths = (() => { try { return JSON.parse(c.strengths || '[]') } catch { return [] } })()
    const weaknesses = (() => { try { return JSON.parse(c.weaknesses || '[]') } catch { return [] } })()

    const statusBg: Record<string, string> = {
      new: '#f0f9ff', reviewing: '#eff6ff', shortlisted: '#f5f3ff',
      hired: '#f0fdf4', rejected: '#fff7ed',
    }
    const statusColor: Record<string, string> = {
      new: '#0369a1', reviewing: '#1d4ed8', shortlisted: '#7c3aed',
      hired: '#15803d', rejected: '#c2410c',
    }

    return `
    <div class="candidate-card">
      <div class="candidate-header">
        <div class="candidate-rank">#${i + 1}</div>
        <div class="candidate-avatar">${(c.firstName?.[0] || '?')}${(c.lastName?.[0] || '')}</div>
        <div class="candidate-info">
          <div class="candidate-name">${c.firstName} ${c.lastName}</div>
          <div class="candidate-meta">
            ${c.email ? `<span>✉ ${c.email}</span>` : ''}
            ${c.phone ? `<span>📞 ${c.phone}</span>` : ''}
            ${c.vacancy?.title ? `<span>📌 ${c.vacancy.title}</span>` : ''}
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
            <span class="status-badge" style="background:${statusBg[c.status] || '#f9fafb'};color:${statusColor[c.status] || '#374151'}">${c.status}</span>
            ${c.recommendation ? `<span class="rec-badge">${c.recommendation === 'strong_yes' ? '🎯 Très recommandé' : c.recommendation === 'yes' ? '✅ Recommandé' : c.recommendation === 'maybe' ? '🤔 À considérer' : '❌ Non recommandé'}</span>` : ''}
            ${c.liked ? '<span style="color:#f59e0b">⭐ Favori</span>' : ''}
            ${c.priority ? '<span style="color:#ef4444">🚩 Prioritaire</span>' : ''}
          </div>
        </div>
        <div class="score-circle" style="background:linear-gradient(135deg,${scoreColor},${scoreColor}dd)">
          <div class="score-number">${score ?? '—'}</div>
          <div class="score-label">${score ? '%' : ''}</div>
        </div>
      </div>
      ${c.summary ? `<div class="summary">${c.summary}</div>` : ''}
      <div class="details-grid">
        ${strengths.length ? `<div class="detail-section strengths"><div class="detail-title">✅ Points forts</div>${strengths.map((s: string) => `<div class="detail-item">• ${s}</div>`).join('')}</div>` : ''}
        ${weaknesses.length ? `<div class="detail-section weaknesses"><div class="detail-title">⚠️ Points d'attention</div>${weaknesses.map((w: string) => `<div class="detail-item">• ${w}</div>`).join('')}</div>` : ''}
      </div>
      ${skills ? `<div class="skills-row"><span class="skills-label">Compétences :</span> <span class="skills-list">${skills}</span></div>` : ''}
      ${c.experience ? `<div class="detail-block"><div class="detail-title">💼 Expérience</div><div class="detail-text">${c.experience}</div></div>` : ''}
      ${c.education ? `<div class="detail-block"><div class="detail-title">🎓 Formation</div><div class="detail-text">${c.education}</div></div>` : ''}
    </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport candidats — CVMatch AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
    .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 32px; border-radius: 16px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .brand-text h1 { font-size: 24px; font-weight: 800; }
    .brand-text p { font-size: 13px; opacity: 0.8; }
    .header-meta { text-align: right; font-size: 13px; opacity: 0.85; line-height: 1.7; }
    .report-title { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; margin-bottom: 6px; }
    .vacancy-name { font-size: 20px; font-weight: 700; }
    .summary-bar { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .stat-box { flex: 1; min-width: 120px; background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); text-align: center; }
    .stat-value { font-size: 28px; font-weight: 800; color: #2563eb; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .section-title { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748b; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .candidate-card { background: white; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.07); border-left: 4px solid #3b82f6; page-break-inside: avoid; }
    .candidate-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
    .candidate-rank { font-size: 13px; font-weight: 700; color: #cbd5e1; min-width: 24px; padding-top: 4px; }
    .candidate-avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .candidate-info { flex: 1; }
    .candidate-name { font-size: 16px; font-weight: 700; color: #1e293b; }
    .candidate-meta { display: flex; gap: 12px; font-size: 12px; color: #64748b; margin-top: 3px; flex-wrap: wrap; }
    .status-badge { font-size: 11px; padding: 2px 10px; border-radius: 99px; font-weight: 600; }
    .rec-badge { font-size: 11px; color: #64748b; }
    .score-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .score-number { font-size: 18px; font-weight: 800; color: white; line-height: 1; }
    .score-label { font-size: 10px; color: rgba(255,255,255,0.8); }
    .summary { font-size: 13px; color: #475569; line-height: 1.6; padding: 10px 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #93c5fd; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
    .detail-section { padding: 10px 12px; border-radius: 8px; }
    .strengths { background: #f0fdf4; }
    .weaknesses { background: #fffbeb; }
    .detail-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; margin-bottom: 6px; }
    .detail-item { font-size: 12px; color: #374151; margin-bottom: 3px; line-height: 1.5; }
    .skills-row { font-size: 12px; margin-bottom: 8px; }
    .skills-label { font-weight: 600; color: #374151; }
    .skills-list { color: #2563eb; }
    .detail-block { margin-top: 8px; }
    .detail-text { font-size: 12px; color: #475569; line-height: 1.6; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print {
      body { background: white; }
      .page { padding: 20px; }
      .candidate-card { box-shadow: none; border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <div class="brand-text">
          <h1>CVMatch AI</h1>
          <p>Intelligent Recruitment Platform</p>
        </div>
      </div>
      <div class="header-meta">
        <div class="report-title">Rapport de candidatures</div>
        <div class="vacancy-name">${vacancyTitle}</div>
        <div>${date}</div>
        <div>Généré par ${generatedBy}${company ? ` · ${company}` : ''}</div>
      </div>
    </div>

    <div class="summary-bar">
      <div class="stat-box">
        <div class="stat-value">${candidates.length}</div>
        <div class="stat-label">Candidats</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${candidates.filter(c => (c.matchScore || 0) >= 75).length}</div>
        <div class="stat-label">Score ≥ 75%</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${candidates.filter(c => c.status === 'shortlisted').length}</div>
        <div class="stat-label">Shortlistés</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${candidates.filter(c => c.liked).length}</div>
        <div class="stat-label">Favoris</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${candidates.length > 0 ? Math.round(candidates.reduce((a, c) => a + (c.matchScore || 0), 0) / candidates.length) : 0}%</div>
        <div class="stat-label">Score moyen</div>
      </div>
    </div>

    <div class="section-title">Classement des candidats</div>
    ${rows}

    <div class="footer">
      Rapport généré le ${date} par CVMatch AI — Plateforme de recrutement intelligente<br>
      Ce document est confidentiel et destiné uniquement aux recruteurs autorisés.
    </div>
  </div>
</body>
</html>`
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vacancyId = searchParams.get('vacancyId')
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  const where: any = isAdmin ? {} : { userId }
  if (vacancyId) where.vacancyId = vacancyId

  const candidates = await prisma.candidate.findMany({
    where,
    include: { vacancy: { select: { title: true, company: true } } },
    orderBy: [{ priority: 'desc' }, { liked: 'desc' }, { matchScore: 'desc' }],
  })

  const vacancyTitle = vacancyId
    ? (await prisma.vacancy.findUnique({ where: { id: vacancyId }, select: { title: true } }))?.title || 'Toutes les offres'
    : 'Toutes les offres'

  const html = buildPDFHtml(
    candidates,
    vacancyTitle,
    session.user.name || 'Recruteur',
    (session.user as any).company || '',
  )

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="cvmatch-rapport-${new Date().toISOString().slice(0, 10)}.html"`,
    },
  })
}
