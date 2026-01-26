"use client";

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  type?: "card" | "article" | "table" | "text";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "card",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "card") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal p-4 animate-pulse">
            <div className="flex justify-between mb-3">
              <div className="h-5 w-16 bg-terminal-border rounded" />
              <div className="h-5 w-12 bg-terminal-border rounded" />
            </div>
            <div className="h-4 w-24 bg-terminal-border rounded mb-3" />
            <div className="h-8 w-20 bg-terminal-border rounded mb-2" />
            <div className="h-4 w-16 bg-terminal-border rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "article") {
    return (
      <div className={cn("space-y-4", className)}>
        {items.map((i) => (
          <div key={i} className="card-terminal overflow-hidden animate-pulse">
            <div className="aspect-video bg-terminal-border" />
            <div className="p-4">
              <div className="h-4 w-20 bg-terminal-border rounded mb-3" />
              <div className="h-6 w-full bg-terminal-border rounded mb-2" />
              <div className="h-4 w-3/4 bg-terminal-border rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 card-terminal animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-terminal-border rounded" />
              <div>
                <div className="h-4 w-20 bg-terminal-border rounded mb-2" />
                <div className="h-3 w-32 bg-terminal-border rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-5 w-16 bg-terminal-border rounded mb-2" />
              <div className="h-4 w-12 bg-terminal-border rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Text skeleton
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-terminal-border rounded w-full mb-2" />
          <div className="h-4 bg-terminal-border rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="h-8 w-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg">
      <div className="text-center">
        <LoadingSpinner className="mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
