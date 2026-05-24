import { describe, it, expect } from 'vitest'
import { getPlanLimits, PLAN_LIMITS } from '../plans'

describe('getPlanLimits', () => {
  describe('free plan', () => {
    it('returns correct limits', () => {
      const limits = getPlanLimits('free')
      expect(limits.maxVacancies).toBe(5)
      expect(limits.maxCandidatesPerMonth).toBe(50)
      expect(limits.aiAnalysis).toBe(true)
    })

    it('has emailInbox disabled', () => {
      const limits = getPlanLimits('free')
      expect(limits.emailInbox).toBe(false)
    })

    it('has atsIntegrations disabled', () => {
      const limits = getPlanLimits('free')
      expect(limits.atsIntegrations).toBe(false)
    })

    it('has analytics disabled', () => {
      const limits = getPlanLimits('free')
      expect(limits.analytics).toBe(false)
    })
  })

  describe('pro plan', () => {
    it('returns correct limits', () => {
      const limits = getPlanLimits('pro')
      expect(limits.maxVacancies).toBe(Infinity)
      expect(limits.maxCandidatesPerMonth).toBe(500)
      expect(limits.aiAnalysis).toBe(true)
    })

    it('has emailInbox enabled', () => {
      const limits = getPlanLimits('pro')
      expect(limits.emailInbox).toBe(true)
    })

    it('has atsIntegrations enabled', () => {
      const limits = getPlanLimits('pro')
      expect(limits.atsIntegrations).toBe(true)
    })

    it('has analytics enabled', () => {
      const limits = getPlanLimits('pro')
      expect(limits.analytics).toBe(true)
    })
  })

  describe('enterprise plan', () => {
    it('returns correct limits', () => {
      const limits = getPlanLimits('enterprise')
      expect(limits.maxVacancies).toBe(Infinity)
      expect(limits.maxCandidatesPerMonth).toBe(Infinity)
      expect(limits.aiAnalysis).toBe(true)
    })

    it('has all features enabled', () => {
      const limits = getPlanLimits('enterprise')
      expect(limits.emailInbox).toBe(true)
      expect(limits.atsIntegrations).toBe(true)
      expect(limits.analytics).toBe(true)
    })
  })

  describe('unknown plan', () => {
    it('falls back to free plan limits', () => {
      const limits = getPlanLimits('unknown')
      expect(limits).toEqual(PLAN_LIMITS.free)
    })

    it('falls back to free for empty string', () => {
      const limits = getPlanLimits('')
      expect(limits).toEqual(PLAN_LIMITS.free)
    })
  })
})
