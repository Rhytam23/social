export function PageSkeleton() {
  return (
    <div className="container-max px-4 md:px-8 py-12 space-y-8 animate-pulse">
      <div className="h-8 bg-(--bg-surface-secondary) rounded-lg w-1/3 mx-auto" />
      <div className="h-4 bg-(--bg-surface-secondary) rounded w-1/4 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 h-44 space-y-4">
            <div className="h-5 bg-(--bg-surface-secondary) rounded w-1/2" />
            <div className="h-4 bg-(--bg-surface-secondary) rounded w-3/4" />
            <div className="h-4 bg-(--bg-surface-secondary) rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
