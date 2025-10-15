export function MarketCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
      <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
