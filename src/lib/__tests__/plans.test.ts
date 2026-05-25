import { describe, it, expect } from 'vitest'
import { getPlanLimits, PLAN_LIMITS } from '../plans'

describe('getPlanLimits', () => {
  describe('free plan', () => {
    it('returns correct limits', () => {
      const limits = getPlanLimits('free')
      expect(limits.maxVacancies).toBe(3)
      expect(limits.maxCandidatesPerMonth).toBe(25)
      expect(limits.aiAnalysis).toBe(true)
    })

    it('has emailInbox disabled', () => {
      expect(getPlanLimits('free').emailInbox).toBe(false)
    })

    it('has atsIntegrations disabled', () => {
      expect(getPlanLimits('free').atsIntegrations).toBe(false)
    })

    it('has analytics disabled', () => {
      expect(getPlanLimits('free').analytics).toBe(false)
    })

    it('has pro features disabled', () => {
      const limits = getPlanLimits('free')
      expect(limits.interviewQuestions).toBe(false)
      expect(limits.hiringReport).toBe(false)
      expect(limits.candidateRanking).toBe(false)
      expect(limits.csvImport).toBe(false)
      expect(limits.export).toBe(false)
    })
  })

  describe('pro plan', () => {
    it('returns correct limits', () => {
      const limits = getPlanLimits('pro')
      expect(limits.maxVacancies).toBe(Infinity)
      expect(limits.maxCandidatesPerMonth).toBe(Infinity)
      expect(limits.aiAnalysis).toBe(true)
    })

    it('has all features enabled', () => {
      const limits = getPlanLimits('pro')
      expect(limits.emailInbox).toBe(true)
      expect(limits.atsIntegrations).toBe(true)
      expect(limits.analytics).toBe(true)
      expect(limits.interviewQuestions).toBe(true)
      expect(limits.hiringReport).toBe(true)
      expect(limits.candidateRanking).toBe(true)
      expect(limits.csvImport).toBe(true)
      expect(limits.export).toBe(true)
    })
  })

  describe('unknown plan', () => {
    it('falls back to free plan limits', () => {
      expect(getPlanLimits('unknown')).toEqual(PLAN_LIMITS.free)
    })

    it('falls back to free for empty string', () => {
      expect(getPlanLimits('')).toEqual(PLAN_LIMITS.free)
    })
  })
})
