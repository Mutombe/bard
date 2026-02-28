"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Clock,
  Play,
  Mic,
  ArrowRight,
  Globe,
  Building2,
  Pickaxe,
  Cpu,
  Landmark,
  Wheat,
  FileText,
  MapPin,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";
import { toast } from "sonner";
import {
  useArticles,

  useCNBCAfricaVideo,
} from "@/hooks";

// Types
interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featured_image?: string | null;
  featured_image_url?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    full_name: string;
  };
  published_at?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_premium?: boolean;
  read_time_minutes?: number;
}

// =====================
// HELPERS
// =====================

function timeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getArticleImage(article: NewsArticle): string | null {
  return article.featured_image || article.featured_image_url || null;
}

/** Consistent tag color for all topic tags — burgundy brand color */
const TAG_COLOR = "text-primary";

/**
 * Smart keyword extraction: scans article title + excerpt for real
 * contextual tags. Returns exactly 2 tags that feel editorially curated.
 */
const KEYWORD_BANK: Record<string, string> = {
  // Macro & policy
  "central bank": "central banks", "interest rate": "interest rates",
  "monetary policy": "monetary policy", "fiscal policy": "fiscal policy",
  "inflation": "inflation", "gdp": "gdp", "recession": "recession",
  "debt": "sovereign debt", "bond": "bonds", "treasury": "bonds",
  "imf": "imf", "world bank": "world bank", "afcfta": "afcfta",
  "trade war": "trade war", "tariff": "tariffs", "sanctions": "sanctions",
  "budget": "budget", "stimulus": "stimulus", "austerity": "austerity",
  "currency": "currency", "forex": "forex", "exchange rate": "forex",
  "devaluation": "currency", "dollar": "dollar", "euro": "euro",
  "yuan": "yuan", "rand": "rand", "naira": "naira", "cedi": "cedi",
  "shilling": "shilling", "kwacha": "kwacha",

  // Markets & investing
  "stock": "equities", "equity": "equities", "ipo": "ipo",
  "listing": "ipo", "dividend": "dividends", "earnings": "earnings",
  "profit": "earnings", "revenue": "earnings", "bull": "bull market",
  "bear": "bear market", "rally": "rally", "crash": "sell-off",
  "sell-off": "sell-off", "market cap": "valuation",
  "private equity": "private equity", "venture capital": "venture capital",
  "hedge fund": "hedge funds", "etf": "etfs", "mutual fund": "funds",
  "commodit": "commodities", "gold": "gold", "oil": "oil",
  "crude": "oil", "copper": "copper", "lithium": "lithium",
  "platinum": "platinum", "diamond": "diamonds", "coal": "coal",

  // Sectors
  "bank": "banking", "fintech": "fintech", "mobile money": "mobile money",
  "m-pesa": "mobile money", "crypto": "crypto", "bitcoin": "crypto",
  "blockchain": "blockchain", "digital payment": "digital payments",
  "insurtech": "insurtech", "neobank": "neobanks", "lending": "lending",
  "microfinance": "microfinance",
  "mining": "mining", "agricult": "agriculture", "farm": "agriculture",
  "food": "food security", "grain": "agriculture",
  "tech": "technology", "ai": "ai", "artificial intelligence": "ai",
  "startup": "startups", "unicorn": "startups",
  "telecom": "telecoms", "5g": "telecoms", "data center": "data centers",
  "cloud": "cloud", "semiconductor": "chips",
  "renewable": "renewables", "solar": "solar", "wind energy": "wind",
  "green bond": "green bonds", "esg": "esg", "climate": "climate",
  "carbon": "carbon", "electric vehicle": "evs", "ev ": "evs",
  "hydrogen": "hydrogen", "battery": "batteries",
  "real estate": "real estate", "property": "real estate",
  "construction": "construction", "infrastructure": "infrastructure",
  "rail": "infrastructure", "port": "infrastructure", "airport": "infrastructure",
  "oil and gas": "oil & gas", "pipeline": "oil & gas",
  "pharmaceutical": "pharma", "health": "healthcare", "hospital": "healthcare",

  // Africa-specific
  "nigeria": "nigeria", "kenya": "kenya", "south africa": "south africa",
  "ghana": "ghana", "egypt": "egypt", "morocco": "morocco",
  "tanzania": "tanzania", "uganda": "uganda", "rwanda": "rwanda",
  "ethiopia": "ethiopia", "côte d'ivoire": "ivory coast",
  "senegal": "senegal", "drc": "drc", "congo": "drc",
  "mozambique": "mozambique", "angola": "angola", "botswana": "botswana",
  "namibia": "namibia", "zambia": "zambia", "zimbabwe": "zimbabwe",
  "tunisia": "tunisia", "cameroon": "cameroon",
  "jse": "jse", "ngx": "ngx", "nse": "nse", "gse": "gse",
  "safaricom": "safaricom", "dangote": "dangote", "mtn": "mtn",
  "naspers": "naspers", "shoprite": "shoprite",

  // Corporate actions & themes
  "merger": "m&a", "acquisition": "m&a", "takeover": "m&a",
  "buyout": "m&a", "deal": "deals", "partnership": "partnerships",
  "regulation": "regulation", "compliance": "regulation",
  "corruption": "governance", "governance": "governance",
  "privatization": "privatization", "subsidy": "subsidies",
  "remittance": "remittances", "diaspora": "diaspora",
  "employment": "jobs", "unemployment": "jobs", "labor": "labor",
  "strike": "labor", "wage": "wages",
  "tourism": "tourism", "aviation": "aviation", "airline": "aviation",
  "shipping": "logistics", "supply chain": "supply chain",
  "e-commerce": "e-commerce", "retail": "retail",
};

// Category fallbacks when keyword extraction finds < 2 matches
const CATEGORY_FALLBACKS: Record<string, string> = {
  "banking": "banking", "banking-finance": "banking", "finance": "finance",
  "mining": "mining", "mining-resources": "mining",
  "technology": "tech", "tech": "tech",
  "agriculture": "agriculture", "infrastructure": "infrastructure",
  "global": "global markets", "global-markets": "global markets",
  "fintech": "fintech", "energy": "energy",
  "trade-policy": "trade", "sustainability": "esg",
};

function getArticleTopics(article: NewsArticle): [string, string] {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  const found: string[] = [];
  const seen = new Set<string>();

  // Scan for keyword matches — longer phrases first for accuracy
  const sortedKeys = Object.keys(KEYWORD_BANK).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (found.length >= 2) break;
    if (text.includes(key)) {
      const tag = KEYWORD_BANK[key];
      if (!seen.has(tag)) {
        seen.add(tag);
        found.push(tag);
      }
    }
  }

  // Fill remaining slots with category fallback
  if (found.length < 2) {
    const catSlug = article.category?.slug || "";
    const catTag = CATEGORY_FALLBACKS[catSlug];
    if (catTag && !seen.has(catTag)) {
      seen.add(catTag);
      found.push(catTag);
    }
  }

  // Last resort: generic
  if (found.length < 1) found.push("markets");
  if (found.length < 2) found.push("analysis");

  return [found[0], found[1]] as [string, string];
}

/** useFadeIn - IntersectionObserver callback ref for scroll-triggered fade-in */
function useFadeIn() {
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
  }, []);
  return ref;
}

// =====================
// STATIC DATA
// =====================

const industries = [
  { name: "Banking & Finance", slug: "banking", icon: Landmark, color: "text-blue-500" },
  { name: "Mining & Resources", slug: "mining", icon: Pickaxe, color: "text-amber-500" },
  { name: "Technology", slug: "technology", icon: Cpu, color: "text-violet-500" },
  { name: "Agriculture", slug: "agriculture", icon: Wheat, color: "text-emerald-500" },
  { name: "Infrastructure", slug: "infrastructure", icon: Building2, color: "text-slate-500" },
  { name: "Global Markets", slug: "global", icon: Globe, color: "text-cyan-500" },
];

const featuredTopics = [
  { name: "Central Banks", slug: "central-banks", description: "Monetary policy across Africa" },
  { name: "Fintech", slug: "fintech", description: "Digital finance innovation" },
  { name: "AfCFTA", slug: "trade-policy", description: "Continental free trade" },
  { name: "ESG & Sustainability", slug: "sustainability", description: "Climate finance & green bonds" },
];

const featuredResearch = [
  {
    id: "1",
    title: "African Banking Sector Outlook 2025",
    description: "Comprehensive analysis of banking trends, digital transformation, and regulatory developments across key African markets.",
    category: "Banking",
    date: "Q1 2025",
    slug: "african-banking-outlook-2025",
  },
  {
    id: "2",
    title: "The Mobile Money Revolution",
    description: "How mobile financial services are reshaping economic inclusion across Sub-Saharan Africa.",
    category: "Fintech",
    date: "December 2024",
    slug: "mobile-money-revolution",
  },
];

const regions = [
  { name: "Southern Africa", slug: "southern-africa", countries: "South Africa, Botswana, Namibia" },
  { name: "East Africa", slug: "east-africa", countries: "Kenya, Tanzania, Uganda, Rwanda" },
  { name: "West Africa", slug: "west-africa", countries: "Nigeria, Ghana, Côte d'Ivoire" },
  { name: "North Africa", slug: "north-africa", countries: "Egypt, Morocco, Tunisia" },
];

// =====================
// SHARED COMPONENTS
// =====================

/** Finimize-style: exactly 2 lowercase topic tags, same color, separated by · */
function TopicTags({ article }: { article: NewsArticle }) {
  const [tag1, tag2] = getArticleTopics(article);

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("text-xs lowercase", TAG_COLOR)}>{tag1}</span>
      <span className={cn("text-xs", TAG_COLOR)}>·</span>
      <span className={cn("text-xs lowercase", TAG_COLOR)}>{tag2}</span>
    </div>
  );
}

/** Section header with optional action link */
function SectionHeader({
  title,
  href,
  label,
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-8 border-b border-border pb-3">
      <h2 className="font-serif text-xl font-bold">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          {label || "Read More"} <ArrowRight className="h-3.5 w-3.5 cta-arrow" />
        </Link>
      )}
    </div>
  );
}

/** Text-only card — Finimize-inspired, no image, no background box */
function TextCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block py-5 border-b border-border">
      <article>
        {/* Top row: category + time */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("text-xs font-medium lowercase tracking-wide", TAG_COLOR)}>
            {article.category?.name || "insight"}
          </span>
          <span className="text-muted-foreground/50 text-xs">·</span>
          <span className="meta-line">{timeAgo(article.published_at)}</span>
        </div>

        {/* Serif title */}
        <h3 className="font-serif text-lg font-bold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {article.excerpt}
        </p>

        {/* Author + topic tags */}
        <div className="flex items-center gap-2 meta-line">
          <span className="font-medium text-foreground/80">{article.author?.full_name || "BGFI Research"}</span>
          <span className="text-muted-foreground/50">·</span>
          <TopicTags article={article} />
        </div>
      </article>
    </Link>
  );
}

// =====================
// SKELETON COMPONENTS
// =====================

function HeroSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <div className="skeleton-enhanced aspect-[21/9] mb-6" />
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="skeleton-enhanced h-4 w-24" />
            <div className="skeleton-enhanced h-4 w-20" />
          </div>
          <div className="skeleton-enhanced h-12 w-full mb-3" />
          <div className="skeleton-enhanced h-12 w-4/5 mb-4" />
          <div className="skeleton-enhanced h-5 w-full mb-2" />
          <div className="skeleton-enhanced h-5 w-3/4 mb-4" />
          <div className="flex items-center gap-4">
            <div className="skeleton-enhanced h-4 w-32" />
            <div className="skeleton-enhanced h-4 w-28" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="skeleton-enhanced h-4 w-24" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 stagger-item" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="skeleton-enhanced w-8 h-8 flex-shrink-0" />
            <div className="flex-1">
              <div className="skeleton-enhanced h-3 w-16 mb-2" />
              <div className="skeleton-enhanced h-5 w-full mb-1" />
              <div className="skeleton-enhanced h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MainContentSkeleton() {
  return (
    <div className="space-y-0 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="py-5 border-b border-border">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="h-4 w-20 mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4">
          <Skeleton className="w-8 h-8 flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtendedFeedSkeleton() {
  return (
    <section className="py-10 md:py-14 animate-pulse">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="space-y-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="py-5 border-b border-border">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =====================
// ARTICLE COMPONENTS
// =====================

/** FeaturedInsight - Hero article with burgundy rule, headline-hero class */
function FeaturedInsight({ article }: { article: NewsArticle }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article>
        {imageUrl && (
          <div className="relative aspect-[21/9] mb-6 overflow-hidden bg-terminal-bg-elevated">
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {article.is_breaking && (
              <div className="absolute top-4 left-4 badge-breaking">
                Breaking
              </div>
            )}
          </div>
        )}

        <div className="max-w-4xl">
          {/* Burgundy rule */}
          <div className="w-8 h-0.5 bg-primary mb-4" />

          <div className="flex items-center gap-3 mb-3">
            <span className={cn("text-sm font-medium lowercase tracking-wide", TAG_COLOR)}>
              {article.category?.name || "insight"}
            </span>
            {article.read_time_minutes && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="meta-line">{article.read_time_minutes} min read</span>
              </>
            )}
          </div>

          <h1 className="headline-hero mb-4 group-hover:text-primary transition-colors">
            {article.title}
          </h1>

          <p className="text-lg text-muted-foreground/90 mb-4 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-3 meta-line">
            <span className="font-medium text-foreground/80">{article.author?.full_name || "BGFI Research"}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{formatDate(article.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** InsightCard - Card with image, colored category, topic tags */
function InsightCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link href={`/news/${article.slug}`} className="group block h-full">
      <article className="h-full bg-terminal-bg-secondary border border-terminal-border overflow-hidden card-hover">
        {imageUrl && (
          <div className="relative aspect-[16/10] overflow-hidden bg-terminal-bg-elevated">
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              unoptimized
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("text-xs font-medium lowercase tracking-wide", TAG_COLOR)}>
              {article.category?.name || "insight"}
            </span>
          </div>

          <h3 className={cn(
            "font-serif font-bold mb-2 leading-snug group-hover:text-primary transition-colors",
            featured ? "text-xl" : "text-lg"
          )}>
            {article.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-2 meta-line">
            <span className="font-medium text-foreground/80">{article.author?.full_name || "BGFI Research"}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{timeAgo(article.published_at)}</span>
          </div>

          <div className="mt-2">
            <TopicTags article={article} />
          </div>
        </div>
      </article>
    </Link>
  );
}

/** OverlayCard - Only used in Editor's Picks (max 3 cards) */
function OverlayCard({ article, size = "medium" }: { article: NewsArticle; size?: "small" | "medium" | "large" }) {
  const imageUrl = getArticleImage(article);

  const imageAspect = {
    small: "aspect-[4/3]",
    medium: "aspect-[16/10]",
    large: "aspect-[21/12]",
  };

  return (
    <Link href={`/news/${article.slug}`} className="group block h-full">
      <article className="h-full bg-terminal-bg-secondary border border-terminal-border overflow-hidden hover:border-primary/50 transition-colors">
        <div className={cn("relative overflow-hidden", imageAspect[size])}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}

          {/* Lighter gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <span className={cn("text-xs font-medium lowercase tracking-wide mb-2", TAG_COLOR)}>
              {article.category?.name || "insight"}
            </span>

            <h3 className={cn(
              "font-serif font-bold text-white leading-snug group-hover:text-primary transition-colors line-clamp-3",
              size === "large" ? "text-2xl md:text-3xl" : size === "medium" ? "text-xl" : "text-lg"
            )}>
              {article.title}
            </h3>
          </div>

          {article.is_breaking && (
            <div className="absolute top-3 left-3 badge-breaking">
              Breaking
            </div>
          )}
          {article.is_premium && !article.is_breaking && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wide">
              Premium
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{article.author?.full_name || "BGFI Research"}</span>
            <div className="flex items-center gap-2">
              <span>{timeAgo(article.published_at)}</span>
              {article.read_time_minutes && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.read_time_minutes} min
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** SidebarInsight - Rank number + category + title + time (no image) */
function SidebarInsight({ article, rank }: { article: NewsArticle; rank: number }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex gap-4 py-3 border-b border-border last:border-0"
    >
      {/* Large rank number */}
      <span className="text-2xl font-serif font-bold text-muted-foreground/20 flex-shrink-0 w-8 text-right leading-none pt-1">
        {rank.toString().padStart(2, "0")}
      </span>

      <div className="flex-1 min-w-0">
        <span className={cn("text-xs font-medium lowercase tracking-wide", TAG_COLOR)}>
          {article.category?.name || "insight"}
        </span>
        <h4 className="font-serif font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
          {article.title}
        </h4>
        <span className="meta-line mt-1 block">
          {timeAgo(article.published_at)}
        </span>
      </div>
    </Link>
  );
}

// =====================
// SECTION COMPONENTS
// =====================

/** Industry chips with left-color accent on hover */
function IndustryNavigation() {
  return (
    <section className="py-6 border-y border-terminal-border bg-terminal-bg-secondary/50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Explore by Industry
          </h2>
          <Link
            href="/industries"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            All Industries <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {industries.map((industry) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="group flex items-center gap-3 p-4 bg-terminal-bg border border-terminal-border hover:border-l-2 hover:border-l-current transition-all"
            >
              <industry.icon className={cn("h-5 w-5", industry.color)} />
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                {industry.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Featured Research with left burgundy border treatment */
function FeaturedResearchSection() {
  return (
    <section className="py-10 md:py-14 border-b border-terminal-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <SectionHeader title="Featured Research" href="/research" label="All Publications" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredResearch.map((report) => (
            <Link
              key={report.id}
              href={`/research/${report.slug}`}
              className="group p-6 border-l-2 border-l-primary border border-terminal-border bg-terminal-bg-secondary/50 hover:border-primary/50 transition-all card-hover"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 text-xs font-medium lowercase tracking-wide bg-primary/10 text-primary">
                  {report.category}
                </span>
                <span className="meta-line">{report.date}</span>
              </div>
              <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.description}
              </p>
              <div className="mt-4 flex items-center text-sm text-primary font-medium">
                Read Report <ArrowRight className="ml-1 h-4 w-4 cta-arrow" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Topics & Regions */
function TopicsRegionsSection() {
  return (
    <section className="py-10 md:py-14 bg-terminal-bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Topics */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Topics in Focus
                </h3>
              </div>
              <Link
                href="/topics"
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                All Topics <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featuredTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/topics/${topic.slug}`}
                  className="group p-4 bg-terminal-bg border border-terminal-border hover:border-primary/50 transition-all"
                >
                  <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {topic.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{topic.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Regional Coverage
                </h3>
              </div>
              <Link
                href="/regions"
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                All Regions <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {regions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/regions/${region.slug}`}
                  className="group p-4 bg-terminal-bg border border-terminal-border hover:border-primary/50 transition-all"
                >
                  <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    {region.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{region.countries}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Podcast section with section-media class */
function PodcastSection({ video }: { video: any }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video) return null;

  return (
    <section className="py-12 md:py-16 section-media">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-serif font-bold text-white">Global Media</h2>
          </div>
          <Link
            href="/podcasts"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            All Episodes <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-video overflow-hidden">
            {isPlaying ? (
              <iframe
                src={`${video.embed_url}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div
                className="relative w-full h-full cursor-pointer group"
                onClick={() => setIsPlaying(true)}
              >
                <Image
                  src={video.thumbnail_url}
                  alt={video.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-10 w-10 text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 text-white text-sm">
                  {video.duration_formatted}
                </div>
              </div>
            )}
          </div>

          <div className="text-white">
            <span className="text-sm text-primary font-medium lowercase tracking-wide">
              Latest Episode
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-4 leading-tight">
              {video.title}
            </h3>
            <p className="text-slate-300 mb-6 line-clamp-3 leading-relaxed">
              {video.description}
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{video.channel_title}</span>
              <span className="text-slate-600">·</span>
              <span>{video.view_count?.toLocaleString()} views</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Newsletter CTA - Redesigned: narrower, burgundy rule, shorter copy */
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/engagement/newsletters/", {
        email,
        newsletter_type: "morning_brief",
      });
      setSubscribed(true);
      toast.success("Successfully subscribed!");
      setEmail("");
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.email) {
        toast.error("This email is already subscribed");
      } else {
        toast.error("Failed to subscribe. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 md:py-20 border-y border-border">
      <div className="max-w-[600px] mx-auto px-4 md:px-6 text-center">
        {/* Burgundy rule */}
        <div className="w-8 h-0.5 bg-primary mx-auto mb-6" />

        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
          African markets, explained.
        </h2>
        <p className="text-muted-foreground mb-8">
          Every weekday morning.
        </p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-primary">
            <span className="text-lg font-medium">Thank you for subscribing!</span>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className="flex-1 px-4 py-3 text-base bg-background border border-terminal-border focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-press"
              >
                {loading ? "..." : "Subscribe"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="meta-line mt-4">
              Free. No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

/** Editor's Picks — 3 OverlayCards (the ONLY overlay section) */
function EditorsPicks({ articles }: { articles: NewsArticle[] }) {
  const fadeRef = useFadeIn();
  if (articles.length < 3) return null;

  return (
    <section ref={fadeRef} className="py-10 md:py-14 bg-terminal-bg-secondary/30 fade-in-section">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <SectionHeader title="Editor's Picks" href="/news?featured=true" label="All Featured" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <OverlayCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Trending Section - keep numbered layout (already great) */
function TrendingSection({ articles }: { articles: NewsArticle[] }) {
  const fadeRef = useFadeIn();
  if (articles.length < 5) return null;

  return (
    <section ref={fadeRef} className="py-10 md:py-14 border-y border-terminal-border fade-in-section">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <SectionHeader title="Trending Now" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {articles.map((article, index) => (
            <div key={article.id} className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
              <Link
                href={`/news/${article.slug}`}
                className="group flex gap-4"
              >
                <span className="text-4xl font-serif font-bold text-primary/20 group-hover:text-primary transition-colors leading-none pt-1">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <span className={cn("text-xs font-medium lowercase tracking-wide", TAG_COLOR)}>
                    {article.category?.name}
                  </span>
                  <h3 className="font-serif font-semibold leading-snug group-hover:text-primary transition-colors mt-1 line-clamp-3">
                    {article.title}
                  </h3>
                  <span className="meta-line mt-2 block">
                    {timeAgo(article.published_at)}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** More Stories - Simple list of TextCards with border-b separators */
function MoreStories({ articles }: { articles: NewsArticle[] }) {
  const fadeRef = useFadeIn();
  if (articles.length < 2) return null;

  return (
    <section ref={fadeRef} className="py-10 md:py-14 fade-in-section">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <SectionHeader title="More Stories" href="/news" label="Browse Archive" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          {articles.map((article) => (
            <TextCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

// =====================
// MAIN PAGE
// =====================

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [extendedArticles, setExtendedArticles] = useState<NewsArticle[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  // FAST initial load - only 15 articles for above-the-fold content
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ page_size: 15 });

  const { data: cnbcVideoData, isLoading: videosLoading } = useCNBCAfricaVideo();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load more articles when initial load completes
  const loadMoreArticles = useCallback(async () => {
    if (loadingMore || hasLoadedMore) return;
    setLoadingMore(true);
    try {
      const response = await apiClient.get("/news/articles/", {
        params: { page_size: 85, offset: 15 }
      });
      setExtendedArticles(response.data?.results || []);
      setHasLoadedMore(true);
    } catch (error) {
      console.error("Failed to load more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasLoadedMore]);

  const initialArticles = articlesData?.results || [];
  const allArticles = [...initialArticles, ...extendedArticles];

  // Auto-load extended articles after initial render
  useEffect(() => {
    if (!articlesLoading && initialArticles.length > 0 && !hasLoadedMore && !loadingMore) {
      const timer = setTimeout(() => {
        loadMoreArticles();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [articlesLoading, initialArticles.length, hasLoadedMore, loadingMore, loadMoreArticles]);

  // ---- Article slicing ----
  // Above the fold (initial 15)
  const featuredArticle = initialArticles[0];
  const heroSideArticles = initialArticles.slice(1, 5);
  const mainInsights = initialArticles.slice(5, 9);   // 2 InsightCard + 2 TextCard
  const sidebarInsights = initialArticles.slice(9, 14); // 5 Most Read with ranks

  // Below the fold (extended)
  const editorsPicksArticles = allArticles.slice(14, 17);
  const trendingArticles = allArticles.slice(17, 22);
  const moreStoriesArticles = allArticles.slice(22, 38); // 12-16 TextCards

  const featuredVideo = cnbcVideoData || null;

  const loading = articlesLoading;

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* ===== HERO + TOP STORIES with grid pattern ===== */}
        <div className="relative">
          {/* Grid pattern background — variable burgundy */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.04] dark:opacity-[0.06]">
              <defs>
                <pattern
                  id="hero-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="hsl(355, 70%, 38%)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>

          {/* ===== 1. HERO ===== */}
          <section className="relative py-8 md:py-12">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
              {loading ? (
                <HeroSectionSkeleton />
              ) : featuredArticle ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Main Featured Article — 7 cols */}
                  <div className="lg:col-span-7">
                    <FeaturedInsight article={featuredArticle} />
                  </div>
                  {/* Side Articles with ranks — 5 cols */}
                  <div className="lg:col-span-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      Top Stories
                    </h3>
                    {heroSideArticles.map((article, index) => (
                      <div key={article.id} className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
                        <SidebarInsight article={article} rank={index + 1} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No featured insights available</p>
                </div>
              )}
            </div>
          </section>

          {/* ===== 2. INDUSTRY CHIPS ===== */}
          <IndustryNavigation />
        </div>

        {/* ===== 3. LATEST INSIGHTS + SIDEBAR ===== */}
        <section className="py-10 md:py-14">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                <SectionHeader title="Latest Insights" href="/news" label="View All" />

                {loading ? (
                  <MainContentSkeleton />
                ) : (
                  <>
                    {/* First 2 as InsightCards with images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                      {mainInsights.slice(0, 2).map((article, index) => (
                        <div key={article.id} className="stagger-item" style={{ animationDelay: `${index * 100}ms` }}>
                          <InsightCard article={article} />
                        </div>
                      ))}
                    </div>
                    {/* Next 2 as TextCards */}
                    {mainInsights.slice(2, 4).map((article, index) => (
                      <div key={article.id} className="stagger-item" style={{ animationDelay: `${(index + 2) * 100}ms` }}>
                        <TextCard article={article} />
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                {loading ? (
                  <SidebarSkeleton />
                ) : (
                  <>
                    <div className="mb-8">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 pb-2 border-b border-border">
                        Most Read
                      </h3>
                      {sidebarInsights.map((article, index) => (
                        <div key={article.id} className="stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
                          <SidebarInsight article={article} rank={index + 1} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </aside>
            </div>
          </div>
        </section>

        {/* ===== 4. FEATURED RESEARCH ===== */}
        <FeaturedResearchSection />

        {/* ===== 5. PODCAST ===== */}
        {!videosLoading && featuredVideo && (
          <PodcastSection video={featuredVideo} />
        )}

        {/* ===== 6. TOPICS & REGIONS ===== */}
        <TopicsRegionsSection />

        {/* ===== 7. NEWSLETTER CTA ===== */}
        <NewsletterSection />

        {/* ====== EXTENDED FEED ====== */}

        {loadingMore && !hasLoadedMore && (
          <ExtendedFeedSkeleton />
        )}

        {hasLoadedMore && (
          <>
            {/* ===== 8. EDITOR'S PICKS (only overlay section) ===== */}
            <EditorsPicks articles={editorsPicksArticles} />

            {/* ===== 9. TRENDING ===== */}
            <TrendingSection articles={trendingArticles} />

            {/* ===== 10. MORE STORIES (TextCard list) ===== */}
            <MoreStories articles={moreStoriesArticles} />
          </>
        )}

        {/* Bottom CTA */}
        <section className="py-14 md:py-20 text-center">
          <div className="max-w-[600px] mx-auto px-4 md:px-6">
            <div className="w-8 h-0.5 bg-primary mx-auto mb-6" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
              Explore All Content
            </h2>
            <p className="text-muted-foreground mb-8">
              In-depth analysis, research reports, and expert commentary on African markets.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/news" className="btn-primary btn-press flex items-center gap-2">
                All Articles <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/research" className="btn-secondary btn-press flex items-center gap-2">
                Research Reports <FileText className="h-4 w-4" />
              </Link>
              <Link href="/podcasts" className="btn-secondary btn-press flex items-center gap-2">
                Podcasts <Mic className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
