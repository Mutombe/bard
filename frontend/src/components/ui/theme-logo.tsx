"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * Logo component that switches between light and dark versions based on theme.
 * - Light theme: uses logo-dark.png (dark logo on light background)
 * - Dark theme: uses logo-light.png (light logo on dark background)
 */
export function ThemeLogo({
  className,
  width = 40,
  height = 40,
  priority = false,
}: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark logo (for light theme) during SSR
  const logoSrc = mounted
    ? resolvedTheme === "dark"
      ? "/images/logo-light.png"
      : "/images/logo-dark.png"
    : "/images/logo-dark.png";

  return (
    <Image
      src={logoSrc}
      alt="Bardiq Journal"
      width={width}
      height={height}
      className={cn("transition-opacity duration-300", className)}
      priority={priority}
    />
  );
}

/**
 * Full logo with text that adapts to theme
 */
export function ThemeLogoFull({
  className,
  logoWidth = 40,
  logoHeight = 40,
}: {
  className?: string;
  logoWidth?: number;
  logoHeight?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted
    ? resolvedTheme === "dark"
      ? "/images/logo-light.png"
      : "/images/logo-dark.png"
    : "/images/logo-dark.png";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={logoSrc}
        alt="Bardiq Journal"
        width={logoWidth}
        height={logoHeight}
        className="transition-opacity duration-300"
        priority
      />
      <div className="hidden sm:block">
        <div className="font-bold text-xl tracking-tight">
          <span className="text-foreground">Bardiq</span>
          <span className="text-primary"> Journal</span>
        </div>
        <div className="text-[10px] text-muted-foreground tracking-widest uppercase -mt-0.5">
          A publication of the BGFI
        </div>
      </div>
    </div>
  );
}

export default ThemeLogo;
