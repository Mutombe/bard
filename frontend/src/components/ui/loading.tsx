"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type?: "card" | "article" | "table" | "text" | "dashboard-stat" | "article-row" | "user-row" | "newsletter-row" | "video" | "market-card" | "opinion-card";
  count?: number;
  className?: string;
}

// Base skeleton pulse animation
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-terminal-border rounded", className)} />
  );
}

export function LoadingSkeleton({
  type = "card",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  // Dashboard stat cards (4-column grid)
  if (type === "dashboard-stat") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Article table rows (for admin)
  if (type === "article-row") {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 card-terminal animate-pulse">
            <Skeleton className="h-5 w-5 rounded" /> {/* checkbox */}
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" /> {/* status badge */}
            <Skeleton className="h-4 w-16" /> {/* views */}
            <Skeleton className="h-4 w-24" /> {/* date */}
            <Skeleton className="h-8 w-8 rounded" /> {/* actions */}
          </div>
        ))}
      </div>
    );
  }

  // User table rows
  if (type === "user-row") {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 card-terminal animate-pulse">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-10 w-10 rounded-full" /> {/* avatar */}
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" /> {/* role */}
            <Skeleton className="h-6 w-20 rounded-full" /> {/* tier */}
            <Skeleton className="h-6 w-16 rounded-full" /> {/* status */}
            <Skeleton className="h-4 w-24" /> {/* last login */}
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Newsletter table rows
  if (type === "newsletter-row") {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 card-terminal animate-pulse">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" /> {/* type */}
            <Skeleton className="h-6 w-20 rounded-full" /> {/* status */}
            <Skeleton className="h-4 w-16" /> {/* recipients */}
            <Skeleton className="h-4 w-12" /> {/* open rate */}
            <Skeleton className="h-4 w-24" /> {/* date */}
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Opinion cards (grid)
  if (type === "opinion-card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal p-4 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Video cards
  if (type === "video") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal overflow-hidden animate-pulse">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Market data cards
  if (type === "market-card") {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal p-3 animate-pulse">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  // Default card skeleton
  if (type === "card") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal p-4 animate-pulse">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Article cards (for news grid)
  if (type === "article") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal overflow-hidden animate-pulse">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-20 mb-3" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table rows
  if (type === "table") {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 card-terminal animate-pulse"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Text skeleton (default)
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((i) => (
        <div key={i} className="animate-pulse">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

// Inline skeleton component for custom layouts
export { Skeleton };

export function LoadingSpinner({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border",
    default: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("border-brand-orange border-t-transparent rounded-full animate-spin", sizeClasses[size])} />
    </div>
  );
}

export function LoadingPage({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
      <div className="text-center">
        <LoadingSpinner className="mb-4" size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Loading overlay for optimistic updates
export function LoadingOverlay({ show, message }: { show: boolean; message?: string }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-terminal-bg/80 flex items-center justify-center z-50 rounded-lg">
      <div className="text-center">
        <LoadingSpinner size="sm" className="mb-2" />
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

// Button loading state
export function ButtonLoading({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <>
      {loading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </>
  );
}
