'use client'

export function Header({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 pl-16 md:pl-8 pr-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-3">{action}</div>}
      </div>
    </header>
  )
}
