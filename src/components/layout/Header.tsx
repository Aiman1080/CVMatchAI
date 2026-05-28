'use client'

export function Header({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 pl-16 md:pl-8 pr-4 sm:pr-8 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words">{title}</h1>
          {description && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">{action}</div>}
      </div>
    </header>
  )
}
