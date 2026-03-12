"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Burgundy-themed gradient backgrounds for users without avatars
// Variations on the brand burgundy for visual distinction
const AVATAR_GRADIENTS = [
  "from-[#9b2335] via-[#7a1c2a] to-[#5e1520]",     // Deep burgundy
  "from-[#b83a4b] via-[#9b2335] to-[#7a1c2a]",     // Light to dark burgundy
  "from-[#9b2335] via-[#8a1f30] to-[#6b1825]",     // Classic burgundy
  "from-[#a82d40] via-[#9b2335] to-[#6b1825]",     // Rose burgundy
  "from-[#7a1c2a] via-[#9b2335] to-[#a82d40]",     // Inverted burgundy
  "from-[#8a1f30] via-[#6b1825] to-[#4d111b]",     // Dark burgundy
  "from-[#b83a4b] via-[#a82d40] to-[#9b2335]",     // Warm burgundy
  "from-[#9b2335] via-[#a82d40] to-[#8a1f30]",     // Mid burgundy
  "from-[#6b1825] via-[#7a1c2a] to-[#9b2335]",     // Deep to light
  "from-[#a82d40] via-[#b83a4b] to-[#9b2335]",     // Bright burgundy
];

// Geometric patterns for visual interest
const PATTERNS = [
  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)",
  "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)",
  "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%)",
  "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2) 0%, transparent 40%)",
];

// Generate a consistent gradient based on name/id
function getGradientForUser(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getPatternForUser(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 3) - hash) + char;
  }
  return PATTERNS[Math.abs(hash) % PATTERNS.length];
}

// Get initials from name
function getInitials(name: string | undefined | null, fallback: string = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "h-6 w-6", text: "text-[10px]" },
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-10 w-10", text: "text-sm" },
  lg: { container: "h-12 w-12", text: "text-base" },
  xl: { container: "h-16 w-16", text: "text-lg" },
  "2xl": { container: "h-24 w-24", text: "text-2xl" },
};

export interface UserAvatarProps {
  /** User's avatar URL */
  src?: string | null;
  /** User's full name for initials and gradient generation */
  name?: string | null;
  /** Alternative identifier for gradient consistency (e.g., user ID or email) */
  identifier?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Optional link to author/user page */
  href?: string;
  /** Additional className */
  className?: string;
  /** Whether to show a ring/border */
  showRing?: boolean;
  /** Alt text for the image */
  alt?: string;
}

export function UserAvatar({
  src,
  name,
  identifier,
  size = "md",
  href,
  className,
  showRing = false,
  alt,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(name);
  const gradientId = identifier || name || "default";
  const gradient = getGradientForUser(gradientId);
  const pattern = getPatternForUser(gradientId);
  const sizeConfig = sizeClasses[size];

  const hasValidImage = src && !imageError;

  const avatarContent = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 transition-transform duration-200",
        sizeConfig.container,
        showRing && "ring-2 ring-border ring-offset-2 ring-offset-background",
        href && "group-hover:scale-105",
        className
      )}
    >
      {hasValidImage ? (
        <Image
          src={src}
          alt={alt || name || "User avatar"}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized
        />
      ) : (
        <>
          {/* Gradient background */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradient
            )}
          />
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0"
            style={{ background: pattern }}
          />
          {/* Initials */}
          <span
            className={cn(
              "relative font-semibold text-white drop-shadow-sm",
              sizeConfig.text
            )}
          >
            {initials}
          </span>
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        {avatarContent}
      </Link>
    );
  }

  return avatarContent;
}

// Preset component for author avatars with link
export interface AuthorAvatarProps extends Omit<UserAvatarProps, "href"> {
  /** Author's slug for the profile link */
  slug?: string;
  /** Whether to link to author page */
  linkToProfile?: boolean;
}

export function AuthorAvatar({
  slug,
  linkToProfile = true,
  name,
  ...props
}: AuthorAvatarProps) {
  const href = linkToProfile && slug
    ? `/people/${slug}`
    : linkToProfile && name
    ? `/people/${name.toLowerCase().replace(/\s+/g, "-")}`
    : undefined;

  return <UserAvatar {...props} name={name} href={href} />;
}

// Export default gradient list for potential reuse
export { AVATAR_GRADIENTS, getInitials, getGradientForUser };
