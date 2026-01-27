"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  quality?: number;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Lazy Loading Image Component
 *
 * Features:
 * - Intersection Observer for viewport detection
 * - Blur placeholder while loading
 * - Error state fallback
 * - Smooth fade-in animation
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  priority = false,
  placeholder = "empty",
  blurDataURL,
  quality = 75,
  fallback,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Default blur placeholder
  const defaultBlurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=";

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "bg-terminal-bg-elevated flex items-center justify-center",
          fill ? "absolute inset-0" : "",
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        {fallback || (
          <span className="text-muted-foreground text-sm">Failed to load</span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-hidden",
        fill ? "relative" : "",
        containerClassName
      )}
      style={!fill ? { width, height } : undefined}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-terminal-bg-elevated animate-pulse",
            fill ? "" : "w-full h-full"
          )}
        />
      )}

      {/* Image - only render when in view */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL || defaultBlurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          unoptimized // For external images
        />
      )}
    </div>
  );
}

/**
 * Avatar Image with fallback initials
 */
interface AvatarImageProps {
  src?: string | null;
  alt: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  name,
  size = "md",
  className,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-medium",
          sizeClasses[size],
          className
        )}
      >
        {name ? getInitials(name) : alt[0]?.toUpperCase()}
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-full overflow-hidden", sizeClasses[size], className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}
