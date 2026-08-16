export function ProductCardSkeleton() {
  return (
    <div className="bg-[#16171d] border border-[#292a2e] rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full animate-pulse">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="h-3 w-16 bg-[#292a2e] rounded" />
          <div className="h-4 w-20 bg-[#292a2e] rounded" />
        </div>
        <div className="h-5 bg-[#292a2e] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[#292a2e] rounded w-1/2 mb-4" />
      </div>

      <div className="w-full h-48 bg-[#121317] rounded-xl mb-4" />

      <div className="space-y-2 mb-4">
        <div className="h-3 bg-[#292a2e] rounded w-full" />
        <div className="h-3 bg-[#292a2e] rounded w-2/3" />
      </div>

      <div className="space-y-3 pt-2">
        <div className="h-6 bg-[#292a2e] rounded w-1/3" />
        <div className="h-11 bg-[#292a2e] rounded-xl w-full" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="container-max px-4 md:px-8 py-8 space-y-8 animate-pulse">
      <div className="h-8 bg-[#16171d] rounded-lg w-1/3" />
      <div className="h-4 bg-[#16171d] rounded w-1/4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
