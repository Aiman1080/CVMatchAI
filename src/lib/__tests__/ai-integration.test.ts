import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test all AI functions in demo mode by forcing no API key
const originalEnv = process.env.ANTHROPIC_API_KEY
beforeEach(() => { process.env.ANTHROPIC_API_KEY = '' })

describe('AI Demo Mode - Full Integration', () => {
  describe('CV Analysis', () => {
    it('returns valid analysis for English CV', async () => {
      const { analyzeCVAgainstVacancy } = await import('@/lib/ai')
      const result = await analyzeCVAgainstVacancy(
        'Alex Johnson\nalex@test.com\n+32 471 555 001\n\nEXPERIENCE\nSenior Developer at TechCorp (2020-2024)\nBuilt React/TypeScript apps\n\nEDUCATION\nMaster CS - KU Leuven (2020)\n\nSKILLS\nReact, TypeScript, Node.js, PostgreSQL',
        'Senior Developer',
        'We need a senior developer with React and TypeScript experience',
        'React, TypeScript, Node.js, 3+ years experience',
      )
      expect(result.matchScore).toBeGreaterThanOrEqual(0)
      expect(result.matchScore).toBeLessThanOrEqual(100)
      expect(result.firstName).toBe('Alex')
      expect(result.lastName).toBe('Johnson')
      expect(result.email).toBe('alex@test.com')
      expect(result.skills.length).toBeGreaterThan(0)
      expect(['strong_yes', 'yes', 'maybe', 'no']).toContain(result.recommendation)
      expect(result.language).toBe('en')
      expect(result.summary).toBeTruthy()
      expect(result.strengths.length).toBeGreaterThan(0)
      expect(result.weaknesses.length).toBeGreaterThan(0)
    })

    it('returns valid analysis for Dutch CV', async () => {
      const { analyzeCVAgainstVacancy } = await import('@/lib/ai')
      const result = await analyzeCVAgainstVacancy(
        'Jan de Vries\njan@test.nl\n\nWERKERVARING\nSoftware Developer bij TechBV (2020-2024)\n\nOPLEIDING\nBachelor Informatica - UGent (2020)\n\nVAARDIGHEDEN\nJava, Python, SQL',
        'Developer', 'Ontwikkelaar gezocht', 'Java, Python',
      )
      expect(result.language).toBe('nl')
      expect(result.firstName).toBe('Jan')
    })

    it('returns valid analysis for French CV', async () => {
      const { analyzeCVAgainstVacancy } = await import('@/lib/ai')
      const result = await analyzeCVAgainstVacancy(
        'Marie Dupont\nmarie@test.fr\n\nEXPÉRIENCE\nDéveloppeuse chez TechSA (2020-2024)\n\nFORMATION\nMaster Informatique - UCLouvain (2020)\n\nCOMPÉTENCES\nPython, Django, PostgreSQL',
        'Développeur', 'Développeur Python recherché', 'Python, Django',
      )
      expect(result.language).toBe('fr')
      expect(result.firstName).toBe('Marie')
    })

    it('handles CV with no name gracefully', async () => {
      const { analyzeCVAgainstVacancy } = await import('@/lib/ai')
      const result = await analyzeCVAgainstVacancy(
        'SKILLS\nReact, Node.js\n\nEXPERIENCE\nDeveloper (2020-2024)',
        'Developer', 'desc', 'React',
      )
      expect(result.matchScore).toBeGreaterThanOrEqual(0)
      // firstName may be undefined, that's OK
    })

    it('handles empty CV gracefully', async () => {
      const { analyzeCVAgainstVacancy } = await import('@/lib/ai')
      const result = await analyzeCVAgainstVacancy('', 'Developer', 'desc', 'reqs')
      expect(result.matchScore).toBeGreaterThanOrEqual(0)
      expect(result.summary).toBeTruthy()
    })

    it('handles CV with motivation letter', async () => {
      const { analyzeCVAgainstVacancy } = await import('@/lib/ai')
      const result = await analyzeCVAgainstVacancy(
        'Alex Test\nalex@test.com\nSKILLS\nReact\nEXPERIENCE\nDev (2020-2024)',
        'Developer', 'desc', 'React',
        'Dear Sir, I am applying for the developer position...',
      )
      expect(result.matchScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Interview Questions', () => {
    it('generates questions with all required fields', async () => {
      const { generateInterviewQuestions } = await import('@/lib/ai')
      const result = await generateInterviewQuestions('CV text', 'Developer', 'desc', 'reqs', 'en')
      expect(result.questions.length).toBeGreaterThanOrEqual(4)
      result.questions.forEach(q => {
        expect(q.question).toBeTruthy()
        expect(q.category).toBeTruthy()
        expect(q.rationale).toBeTruthy()
        expect(['technical', 'behavioral', 'situational', 'cultural']).toContain(q.category)
      })
    })

    it('generates questions with expectedAnswer field', async () => {
      const { generateInterviewQuestions } = await import('@/lib/ai')
      const result = await generateInterviewQuestions('CV', 'Dev', 'd', 'r', 'en')
      result.questions.forEach(q => {
        expect(q).toHaveProperty('expectedAnswer')
      })
    })
  })

  describe('Job Description Generator', () => {
    it('generates complete job description', async () => {
      const { generateJobDescription } = await import('@/lib/ai')
      const result = await generateJobDescription('React Developer', 'React, TypeScript', 'en', 'Acme Corp')
      expect(result.description.length).toBeGreaterThan(50)
      expect(result.requirements.length).toBeGreaterThan(20)
      expect(result.niceToHave.length).toBeGreaterThan(10)
    })

    it('works without company name', async () => {
      const { generateJobDescription } = await import('@/lib/ai')
      const result = await generateJobDescription('Designer', 'Figma, UX', 'fr')
      expect(result.description).toBeTruthy()
    })

    it('works with empty keywords', async () => {
      const { generateJobDescription } = await import('@/lib/ai')
      const result = await generateJobDescription('Manager', '', 'nl')
      expect(result.description).toBeTruthy()
    })
  })

  describe('Candidate Ranking', () => {
    it('ranks candidates by score', async () => {
      const { rankCandidates } = await import('@/lib/ai')
      const result = await rankCandidates(
        [
          { id: '1', firstName: 'Alex', lastName: 'A', matchScore: 85, summary: '', strengths: '', weaknesses: '', skills: 'React', experience: '' },
          { id: '2', firstName: 'Bob', lastName: 'B', matchScore: 72, summary: '', strengths: '', weaknesses: '', skills: 'Vue', experience: '' },
          { id: '3', firstName: 'Charlie', lastName: 'C', matchScore: 91, summary: '', strengths: '', weaknesses: '', skills: 'Angular', experience: '' },
        ],
        'Dev', 'desc', 'reqs', 'en'
      )
      expect(result.ranking.length).toBe(3)
      expect(result.ranking[0].rank).toBe(1)
      expect(result.ranking[0].candidateId).toBe('3') // Highest score
      result.ranking.forEach(r => {
        expect(r.reasoning).toBeTruthy()
        expect(r.standoutFactor).toBeTruthy()
      })
    })

    it('handles 2 candidates', async () => {
      const { rankCandidates } = await import('@/lib/ai')
      const result = await rankCandidates(
        [
          { id: 'a', firstName: 'A', lastName: 'A', matchScore: 50, summary: '', strengths: '', weaknesses: '', skills: '', experience: '' },
          { id: 'b', firstName: 'B', lastName: 'B', matchScore: 80, summary: '', strengths: '', weaknesses: '', skills: '', experience: '' },
        ],
        'Role', 'd', 'r'
      )
      expect(result.ranking.length).toBe(2)
    })
  })

  describe('Hiring Report', () => {
    it('generates complete report with all sections', async () => {
      const { generateHiringReport } = await import('@/lib/ai')
      const result = await generateHiringReport(
        {
          firstName: 'Alex', lastName: 'Johnson', email: 'alex@test.com', phone: '+32 471 555',
          matchScore: 85, summary: 'Strong developer', strengths: '["React expert"]',
          weaknesses: '["No K8s"]', skills: 'React,TypeScript,Node.js',
          experience: '5 years at TechCorp', education: 'Master CS - KU Leuven',
          recommendation: 'yes',
        },
        'Senior Developer', 'We need a senior dev', 'en'
      )
      expect(result.report.length).toBeGreaterThan(100)
      expect(result.report).toContain('Alex')
      expect(result.report).toContain('Johnson')
      expect(result.report).toContain('85')
    })

    it('handles missing optional fields', async () => {
      const { generateHiringReport } = await import('@/lib/ai')
      const result = await generateHiringReport(
        {
          firstName: 'Test', lastName: 'User', matchScore: 50,
          summary: '', strengths: '', weaknesses: '', skills: '',
          experience: '', education: '', recommendation: 'maybe',
        },
        'Role', 'desc'
      )
      expect(result.report).toBeTruthy()
      expect(result.report).toContain('Test')
    })
  })

  describe('Email Classification (demo)', () => {
    it('classifies recruitment email as relevant', async () => {
      const { classifyRecruitmentEmail } = await import('@/lib/ai')
      const result = await classifyRecruitmentEmail(
        'Application for Developer Position',
        'Dear HR, I am applying for the developer role...',
        ['CV_Alex.pdf'],
      )
      expect(result.isRelevant).toBe(true)
      expect(result.confidence).toBeGreaterThan(50)
    })

    it('classifies spam as not relevant', async () => {
      const { classifyRecruitmentEmail } = await import('@/lib/ai')
      const result = await classifyRecruitmentEmail(
        'Special offer - 50% off!',
        'Buy now and save on our amazing products...',
        [],
      )
      expect(result.isRelevant).toBe(false)
    })
  })

  describe('Document Type Detection (demo)', () => {
    it('detects CV', async () => {
      const { detectDocumentType } = await import('@/lib/ai')
      const result = await detectDocumentType('EXPERIENCE\nSenior Developer\nEDUCATION\nMaster CS\nSKILLS\nReact, Node.js')
      expect(result).toBe('cv')
    })

    it('detects motivation letter', async () => {
      const { detectDocumentType } = await import('@/lib/ai')
      const result = await detectDocumentType('Dear Sir, I am writing to apply for the position. My motivation for this role...')
      expect(result).toBe('motivation')
    })
  })
})
