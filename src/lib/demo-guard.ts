// Admin (admin@cvmatch.ai) is a REAL admin account with full rights, NOT a demo.
// Only the recruiter demo accounts are read-only.
const DEMO_EMAILS = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'free@cvmatch.ai']

export function isDemoAccount(email?: string | null): boolean {
  return DEMO_EMAILS.includes((email || '').toLowerCase())
}
