'use client'

export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
      {/* Document shape */}
      <path d="M12 8h10l6 6v18a2 2 0 01-2 2H12a2 2 0 01-2-2V10a2 2 0 012-2z" fill="white" fillOpacity="0.25" />
      <path d="M13 10h8l5 5v15a1 1 0 01-1 1H13a1 1 0 01-1-1V11a1 1 0 011-1z" fill="white" fillOpacity="0.9" />
      {/* Fold corner */}
      <path d="M21 10v5h5" fill="none" stroke="url(#logo-grad)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Checkmark circle */}
      <circle cx="27" cy="26" r="8" fill="url(#logo-grad)" stroke="white" strokeWidth="2" />
      <path d="M23.5 26l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Text lines on document */}
      <rect x="14" y="17" width="8" height="1.5" rx="0.75" fill="url(#logo-grad)" fillOpacity="0.4" />
      <rect x="14" y="20.5" width="6" height="1.5" rx="0.75" fill="url(#logo-grad)" fillOpacity="0.3" />
      <rect x="14" y="24" width="4" height="1.5" rx="0.75" fill="url(#logo-grad)" fillOpacity="0.2" />
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
      {/* Shield */}
      <path d="M20 8l10 4v8c0 6-4 10-10 12-6-2-10-6-10-12v-8l10-4z" fill="white" fillOpacity="0.25" />
      <path d="M20 10l8 3.5v7c0 5-3.2 8.5-8 10.2-4.8-1.7-8-5.2-8-10.2v-7L20 10z" fill="white" fillOpacity="0.9" />
      {/* Check inside shield */}
      <path d="M16 20l3 3 5-5" stroke="url(#logo-admin-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
