'use client'

export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  const scale = size / 40
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="magnifier-grad" x1="22" y1="18" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Document background */}
      <rect x="2" y="2" width="26" height="32" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
      {/* Person icon */}
      <circle cx="10" cy="10" r="3" fill="#3B82F6" />
      <ellipse cx="10" cy="16" rx="4.5" ry="2.5" fill="#3B82F6" />
      {/* Text lines */}
      <rect x="18" y="8" width="7" height="2" rx="1" fill="#64748B" />
      <rect x="18" y="12" width="5" height="2" rx="1" fill="#64748B" />
      <rect x="7" y="21" width="14" height="1.5" rx="0.75" fill="#475569" />
      <rect x="7" y="24.5" width="12" height="1.5" rx="0.75" fill="#475569" />
      <rect x="7" y="28" width="10" height="1.5" rx="0.75" fill="#475569" />
      {/* Magnifying glass circle */}
      <circle cx="28" cy="26" r="9" fill="none" stroke="url(#magnifier-grad)" strokeWidth="3" />
      <circle cx="28" cy="26" r="6.5" fill="white" />
      {/* Checkmark inside magnifier */}
      <path d="M24.5 26.5l2.2 2.2 4.5-4.5" stroke="url(#magnifier-grad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Magnifier handle */}
      <line x1="34" y1="32.5" x2="38" y2="37" stroke="url(#magnifier-grad)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LogoAdmin({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-admin-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logo-admin-grad)" />
      <path d="M20 8l10 4v8c0 6-4 10-10 12-6-2-10-6-10-12v-8l10-4z" fill="white" fillOpacity="0.25" />
      <path d="M20 10l8 3.5v7c0 5-3.2 8.5-8 10.2-4.8-1.7-8-5.2-8-10.2v-7L20 10z" fill="white" fillOpacity="0.9" />
      <path d="M16 20l3 3 5-5" stroke="url(#logo-admin-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
