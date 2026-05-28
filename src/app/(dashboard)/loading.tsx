export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pl-12 md:pl-0">
        <div>
          <div className="h-7 w-40 sm:w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-28 sm:w-32 bg-gray-100 dark:bg-gray-800/60 rounded mt-2" />
        </div>
        <div className="h-10 w-24 sm:w-36 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800/60 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800/40 rounded" />
                </div>
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="h-48 bg-gray-100 dark:bg-gray-800/40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
