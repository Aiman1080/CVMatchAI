const DEMO_EMAILS = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'admin@cvmatch.ai', 'free@cvmatch.ai']

export function isDemoAccount(email?: string | null): boolean {
  return DEMO_EMAILS.includes(email || '')
}
