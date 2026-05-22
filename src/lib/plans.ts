export const PLAN_LIMITS = {
  free: {
    maxVacancies: 5,
    maxCandidatesPerMonth: 50,
    aiAnalysis: true,
    emailInbox: false,
    atsIntegrations: false,
    analytics: false,
  },
  pro: {
    maxVacancies: Infinity,
    maxCandidatesPerMonth: 500,
    aiAnalysis: true,
    emailInbox: true,
    atsIntegrations: true,
    analytics: true,
  },
  enterprise: {
    maxVacancies: Infinity,
    maxCandidatesPerMonth: Infinity,
    aiAnalysis: true,
    emailInbox: true,
    atsIntegrations: true,
    analytics: true,
  },
}

export function getPlanLimits(subscription: string) {
  return PLAN_LIMITS[subscription as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
}
