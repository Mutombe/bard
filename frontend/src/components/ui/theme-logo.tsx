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
 * The logo images already contain the brand text "Bard Global Finance Institute"
 * - Light theme: uses logo-dark.png (dark logo on light background)
 * - Dark theme: uses logo-light.png (light logo on dark background)
 */
export function ThemeLogo({
  className,
  width = 180,
  height = 50,
  priority = true,
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
      alt="Bard Global Finance Institute"
      width={width}
      height={height}
      className={cn("h-auto max-h-[60px] w-auto object-contain", className)}
      priority={priority}
      loading="eager"
    />
  );
}

/**
 * @deprecated Use ThemeLogo instead - logo already contains brand text
 */
export const ThemeLogoFull = ThemeLogo;

export default ThemeLogo;
