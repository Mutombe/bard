"use client";

/**
 * ExtendedByline — "About the author" card displayed at the foot of the
 * article body on /news/[slug].
 *
 * Implements proposal 3c from the Quarterly review: expand author bylines
 * to include brief biographies, LinkedIn profile links, and direct email
 * contacts so investors can reach BGFI analysts directly. Only shown when
 * the article has a Writer attached (vs an in-house uploader user) — this
 * is the bylined-author path, not the staff path.
 *
 * The email link only renders when the writer has email_public=True on
 * the backend (defaulted off). The backend serializer enforces this.
 */
import Link from "next/link";
import Image from "next/image";
import { LinkedinLogo, Envelope, XLogo } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface Writer {
  id?: string;
  slug?: string;
  full_name?: string;
  title?: string;
  organization?: string;
  bio?: string;
  avatar_display?: string | null;
  linkedin?: string;
  twitter?: string;
  email?: string | null;
}

interface ExtendedBylineProps {
  writer?: Writer | null;
}

function twitterHref(handle?: string): string | null {
  if (!handle) return null;
  const clean = handle.trim().replace(/^@/, "");
  if (!clean) return null;
  // If they pasted a full URL just use it
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://x.com/${clean}`;
}

export function ExtendedByline({ writer }: ExtendedBylineProps) {
  if (!writer || !writer.full_name) return null;

  const hasSocial = !!(writer.linkedin || writer.twitter || writer.email);
  const twitter = twitterHref(writer.twitter);

  return (
    <aside
      className="mt-10 mb-8 p-6 md:p-7 bg-terminal-bg-secondary border border-terminal-border rounded-md"
      aria-label="About the author"
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Avatar — links to the author's archive page */}
        <Link
          href={writer.slug ? `/people/${writer.slug}` : "#"}
          className="flex-shrink-0 self-start group"
          aria-label={`View all articles by ${writer.full_name}`}
        >
          {writer.avatar_display ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-terminal-border group-hover:border-primary transition-colors">
              <Image
                src={writer.avatar_display}
                alt={writer.full_name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <UserAvatar
              name={writer.full_name}
              identifier={writer.id}
              size="lg"
            />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <Link
              href={writer.slug ? `/people/${writer.slug}` : "#"}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
            >
              {writer.full_name}
            </Link>
            {writer.title && (
              <span className="text-sm text-muted-foreground">
                {writer.title}
                {writer.organization ? ` · ${writer.organization}` : ""}
              </span>
            )}
          </div>

          {writer.bio && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {writer.bio}
            </p>
          )}

          {hasSocial && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {writer.linkedin && (
                <a
                  href={writer.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-terminal-bg-elevated hover:bg-terminal-bg border border-terminal-border rounded-md text-foreground hover:text-primary transition-colors"
                  aria-label={`${writer.full_name} on LinkedIn`}
                >
                  <LinkedinLogo className="h-3.5 w-3.5" weight="fill" />
                  LinkedIn
                </a>
              )}
              {twitter && (
                <a
                  href={twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-terminal-bg-elevated hover:bg-terminal-bg border border-terminal-border rounded-md text-foreground hover:text-primary transition-colors"
                  aria-label={`${writer.full_name} on X`}
                >
                  <XLogo className="h-3.5 w-3.5" weight="fill" />
                  X
                </a>
              )}
              {writer.email && (
                <a
                  href={`mailto:${writer.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-terminal-bg-elevated hover:bg-terminal-bg border border-terminal-border rounded-md text-foreground hover:text-primary transition-colors"
                  aria-label={`Email ${writer.full_name}`}
                >
                  <Envelope className="h-3.5 w-3.5" />
                  {writer.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
