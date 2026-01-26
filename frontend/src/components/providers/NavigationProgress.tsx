"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset loading state when route changes complete
  useEffect(() => {
    setIsLoading(false);
    setProgress(100);

    // Hide the bar after animation
    const timeout = setTimeout(() => {
      setProgress(0);
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Handle click events on links to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link) {
        const href = link.getAttribute("href");
        const isExternal = link.getAttribute("target") === "_blank";
        const isSameOrigin = href?.startsWith("/") || href?.startsWith("#");

        // Only show progress for internal navigation
        if (href && isSameOrigin && !isExternal && href !== pathname) {
          setIsLoading(true);
          setProgress(30);

          // Simulate progress
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 90) {
                clearInterval(interval);
                return prev;
              }
              return prev + Math.random() * 10;
            });
          }, 200);

          // Cleanup after max time (failsafe)
          setTimeout(() => {
            clearInterval(interval);
          }, 10000);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!isLoading && progress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className="h-full bg-brand-orange transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
