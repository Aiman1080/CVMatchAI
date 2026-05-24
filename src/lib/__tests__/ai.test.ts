import { describe, it, expect, vi, beforeEach } from 'vitest'

// Ensure demo mode (no API key)
beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY
})

// Dynamic import after env is set so isDemoMode() picks it up.
// The module reads the env at call time, so this works correctly.
const { analyzeCVAgainstVacancy } = await import('../ai')

describe('generateDemoAnalysis (via analyzeCVAgainstVacancy in demo mode)', () => {
  const sampleCV = `Jan Peeters
Senior Software Developer
jan.peeters@email.com
+32 470 123 456

EXPERIENCE
Software Developer at TechCorp — 2019-2024
Built React and Node.js applications

EDUCATION
Master Computer Science — KU Leuven (2019)

SKILLS
React, TypeScript, Node.js, Python, SQL, Docker`

  const vacancyTitle = 'Full Stack Developer'
  const vacancyDescription = 'Looking for a full stack developer'
  const vacancyRequirements = 'React, Node.js, TypeScript'

  it('returns a valid CVAnalysisResult structure', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)

    expect(result).toHaveProperty('matchScore')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('strengths')
    expect(result).toHaveProperty('weaknesses')
    expect(result).toHaveProperty('skills')
    expect(result).toHaveProperty('experience')
    expect(result).toHaveProperty('education')
    expect(result).toHaveProperty('recommendation')
    expect(result).toHaveProperty('language')
  })

  it('returns a score between 0 and 100', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.matchScore).toBeGreaterThanOrEqual(0)
    expect(result.matchScore).toBeLessThanOrEqual(100)
  })

  it('detects English language for English CV', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.language).toBe('en')
  })

  it('detects Dutch language for Dutch CV', async () => {
    const dutchCV = `Pieter Janssen
Werkervaring
Software Ontwikkelaar bij BedrijfNaam — 2020-2024
Opleiding
Bachelor Informatica — HoGent (2020)
Vaardigheden
React, JavaScript`

    const result = await analyzeCVAgainstVacancy(dutchCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.language).toBe('nl')
  })

  it('detects French language for French CV', async () => {
    const frenchCV = `Marie Dupont
Expérience professionnelle
Développeuse chez Entreprise — 2019-2024
Formation
Licence Informatique — UCLouvain (2019)
Compétences
Python, JavaScript`

    const result = await analyzeCVAgainstVacancy(frenchCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.language).toBe('fr')
  })

  it('extracts name from CV text', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.firstName).toBe('Jan')
    expect(result.lastName).toBe('Peeters')
  })

  it('extracts email from CV text', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.email).toBe('jan.peeters@email.com')
  })

  it('extracts phone from CV text', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.phone).toBeDefined()
  })

  it('detects skills from CV text', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(result.skills.length).toBeGreaterThan(0)
    expect(result.skills).toContain('React')
  })

  it('returns valid recommendation value', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(['strong_yes', 'yes', 'maybe', 'no']).toContain(result.recommendation)
  })

  it('returns strengths as an array', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(Array.isArray(result.strengths)).toBe(true)
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('returns weaknesses as an array', async () => {
    const result = await analyzeCVAgainstVacancy(sampleCV, vacancyTitle, vacancyDescription, vacancyRequirements)
    expect(Array.isArray(result.weaknesses)).toBe(true)
    expect(result.weaknesses.length).toBeGreaterThan(0)
  })
})
