import { Skeleton } from "@/components/ui/loading";

export default function NewsLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full md:w-80 rounded-md" />
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 pb-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured article skeleton */}
          <div className="relative overflow-hidden rounded-lg bg-terminal-bg-secondary">
            <Skeleton className="aspect-[16/9]" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Article list skeletons */}
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 animate-pulse">
                <Skeleton className="w-32 h-24 flex-shrink-0 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <Skeleton className="w-6 h-6" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </aside>
      </div>
    </div>
  );
}
