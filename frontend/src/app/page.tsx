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
  BookOpen,
  TrendingUp,
  TrendingDown,
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
  useIndices,
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

interface MarketIndex {
  code: string;
  name: string;
  current_value: number;
  previous_close: number;
  change?: number;
  change_percent?: number;
}

// Helper functions
function timeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getArticleImage(article: NewsArticle): string | null {
  return article.featured_image || article.featured_image_url || null;
}

// Industry/Sector data for navigation
const industries = [
  { name: "Banking & Finance", slug: "banking", icon: Landmark, color: "text-blue-500" },
  { name: "Mining & Resources", slug: "mining", icon: Pickaxe, color: "text-amber-500" },
  { name: "Technology", slug: "technology", icon: Cpu, color: "text-purple-500" },
  { name: "Agriculture", slug: "agriculture", icon: Wheat, color: "text-green-500" },
  { name: "Infrastructure", slug: "infrastructure", icon: Building2, color: "text-slate-500" },
  { name: "Global Markets", slug: "global", icon: Globe, color: "text-cyan-500" },
];

// Topics for quick navigation
const featuredTopics = [
  { name: "Central Banks", slug: "central-banks", description: "Monetary policy across Africa" },
  { name: "Fintech", slug: "fintech", description: "Digital finance innovation" },
  { name: "AfCFTA", slug: "trade-policy", description: "Continental free trade" },
  { name: "ESG & Sustainability", slug: "sustainability", description: "Climate finance & green bonds" },
];

// Featured research reports (mock data)
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

// Regional quick links
const regions = [
  { name: "Southern Africa", slug: "southern-africa", countries: "South Africa, Botswana, Namibia" },
  { name: "East Africa", slug: "east-africa", countries: "Kenya, Tanzania, Uganda, Rwanda" },
  { name: "West Africa", slug: "west-africa", countries: "Nigeria, Ghana, Côte d'Ivoire" },
  { name: "North Africa", slug: "north-africa", countries: "Egypt, Morocco, Tunisia" },
];

// Skeleton Components
function FeaturedInsightSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="aspect-[21/9] mb-6" />
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-10 w-full mb-3" />
      <Skeleton className="h-10 w-4/5 mb-4" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-3/4 mb-4" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

function InsightCardSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="aspect-[16/10] mb-4" />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function SidebarInsightSkeleton() {
  return (
    <div className="flex mb-3 bg-terminal-bg-secondary border border-terminal-border overflow-hidden animate-pulse">
      <Skeleton className="w-24 h-20 flex-shrink-0" />
      <div className="flex-1 p-3">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Featured Insight - Hero Section
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {article.is_breaking && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold tracking-wide uppercase">
                Breaking
              </div>
            )}
          </div>
        )}

        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              {article.category?.name || "Insight"}
            </span>
            {article.read_time_minutes && (
              <span className="text-sm text-muted-foreground">
                {article.read_time_minutes} min read
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
            {article.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-4 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{article.author?.full_name || "BGFI Research"}</span>
            <span className="text-muted-foreground">{formatDate(article.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Insight Card - Grid Item
function InsightCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link href={`/news/${article.slug}`} className="group block h-full">
      <article className={cn("h-full", featured && "")}>
        {imageUrl && (
          <div className="relative aspect-[16/10] mb-4 overflow-hidden bg-terminal-bg-elevated">
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {article.category?.name || "Insight"}
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

        <div className="text-xs text-muted-foreground">
          {article.author?.full_name || "BGFI Research"} · {timeAgo(article.published_at)}
        </div>
      </article>
    </Link>
  );
}

// Overlay Card - Title & Category on image, other info below
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
        {/* Image with overlay - only title and category */}
        <div className={cn("relative overflow-hidden", imageAspect[size])}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Only title and category on image */}
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              {article.category?.name || "Insight"}
            </span>

            <h3 className={cn(
              "font-serif font-bold text-white leading-snug group-hover:text-primary transition-colors line-clamp-3",
              size === "large" ? "text-2xl md:text-3xl" : size === "medium" ? "text-xl" : "text-lg"
            )}>
              {article.title}
            </h3>
          </div>

          {/* Premium/Breaking badges */}
          {article.is_breaking && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-semibold uppercase tracking-wide">
              Breaking
            </div>
          )}
          {article.is_premium && !article.is_breaking && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wide">
              Premium
            </div>
          )}
        </div>

        {/* Card info section below image */}
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

// Featured Grid Card - Large with side info
function FeaturedGridCard({ article }: { article: NewsArticle }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-terminal-bg-secondary overflow-hidden border border-terminal-border hover:border-primary/50 transition-colors">
        <div className="relative aspect-video md:aspect-auto md:min-h-[280px] overflow-hidden">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 md:bg-gradient-to-l md:from-terminal-bg-secondary/50 md:to-transparent" />
        </div>

        <div className="flex flex-col justify-center p-6 md:p-8">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            {article.category?.name || "Featured"}
          </span>

          <h3 className="font-serif text-2xl font-bold leading-tight group-hover:text-primary transition-colors mb-4">
            {article.title}
          </h3>

          <p className="text-muted-foreground line-clamp-3 mb-4">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium">{article.author?.full_name || "BGFI Research"}</span>
            <span>{formatDate(article.published_at)}</span>
          </div>

          <div className="mt-4 flex items-center text-sm text-primary font-medium">
            Read Article <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}

// Sidebar Insight - Compact List Item
function SidebarInsight({ article }: { article: NewsArticle }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex mb-3 bg-terminal-bg-secondary border border-terminal-border hover:border-primary/50 transition-colors overflow-hidden"
    >
      {imageUrl && (
        <div className="relative w-24 flex-shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>
      )}
      <div className="flex-1 min-w-0 p-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          {article.category?.name || "Insight"}
        </span>
        <h4 className="font-serif font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-1">
          {article.title}
        </h4>
        <span className="text-xs text-muted-foreground mt-1 block">
          {timeAgo(article.published_at)}
        </span>
      </div>
    </Link>
  );
}

// Industry Navigation Section
function IndustryNavigation() {
  return (
    <section className="py-8 border-y border-terminal-border bg-terminal-bg-secondary/50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
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
              className="group flex items-center gap-3 p-4 bg-terminal-bg border border-terminal-border hover:border-primary/50 transition-all"
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

// Featured Research Section
function FeaturedResearchSection() {
  return (
    <section className="py-12 border-b border-terminal-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Featured Research</h2>
          </div>
          <Link
            href="/research"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            All Publications <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredResearch.map((report) => (
            <Link
              key={report.id}
              href={`/research/${report.slug}`}
              className="group p-6 border border-terminal-border bg-terminal-bg-secondary/50 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded">
                  {report.category}
                </span>
                <span className="text-xs text-muted-foreground">{report.date}</span>
              </div>
              <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.description}
              </p>
              <div className="mt-4 flex items-center text-sm text-primary font-medium">
                Read Report <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Topics & Regions Section
function TopicsRegionsSection() {
  return (
    <section className="py-12 bg-terminal-bg-secondary/30">
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

// Podcast Section
function PodcastSection({ video }: { video: any }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video) return null;

  return (
    <section className="py-12 bg-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-serif font-bold text-white">The BGFI Podcast</h2>
          </div>
          <Link
            href="/podcasts"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            All Episodes <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Video/Thumbnail */}
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

          {/* Info */}
          <div className="text-white">
            <span className="text-sm text-primary font-semibold uppercase tracking-wider">
              Latest Episode
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-bold mt-2 mb-4 leading-tight">
              {video.title}
            </h3>
            <p className="text-slate-300 mb-6 line-clamp-3 leading-relaxed">
              {video.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{video.channel_title}</span>
              <span>·</span>
              <span>{video.view_count?.toLocaleString()} views</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Newsletter CTA Section
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
    <section className="py-16 bg-primary/5 border-y border-primary/20">
      <div className="max-w-[800px] mx-auto px-4 md:px-6 text-center">
        <BookOpen className="h-10 w-10 mx-auto mb-4 text-primary" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Stay Informed
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Subscribe to African Finance Insights for the latest research, analysis, and market intelligence delivered to your inbox.
        </p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-primary">
            <span className="text-lg font-medium">Thank you for subscribing!</span>
          </div>
        ) : (
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
              className="px-6 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "..." : "Subscribe"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// Market Summary Widget (Subtle)
function MarketSummaryWidget({ indices }: { indices: MarketIndex[] }) {
  if (!indices || indices.length === 0) return null;

  return (
    <div className="p-5 bg-terminal-bg-secondary border border-terminal-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Market Summary
        </h3>
        <Link href="/markets" className="text-xs text-primary hover:text-primary/80">
          Full Data →
        </Link>
      </div>

      <div className="space-y-3">
        {indices.slice(0, 4).map((index) => {
          const currentValue = Number(index.current_value) || 0;
          const previousClose = Number(index.previous_close) || 1;
          const change = Number(index.change) || (currentValue - previousClose);
          const changePercent = Number(index.change_percent) || ((change / previousClose) * 100);
          const isUp = change >= 0;

          return (
            <Link
              key={index.code}
              href={`/markets/indices/${index.code}`}
              className="flex items-center justify-between py-2 hover:bg-terminal-bg-elevated -mx-2 px-2 rounded transition-colors"
            >
              <div>
                <span className="font-mono font-semibold text-sm">{index.code}</span>
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{index.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">{currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isUp ? "text-green-500" : "text-red-500"
                )}>
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isUp ? "+" : ""}{changePercent.toFixed(2)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Editors' Picks Section with Overlay Cards - Balanced 3-column grid
function EditorsPicks({ articles }: { articles: NewsArticle[] }) {
  if (articles.length < 3) return null;

  return (
    <section className="py-12 bg-terminal-bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-bold">Editor's Picks</h2>
          <Link
            href="/news?featured=true"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            All Featured <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <OverlayCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Trending Section with numbered list
function TrendingSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length < 5) return null;

  return (
    <section className="py-12 border-y border-terminal-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="font-serif text-2xl font-bold">Trending Now</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group flex gap-4"
            >
              <span className="text-4xl font-serif font-bold text-primary/30 group-hover:text-primary transition-colors">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div className="flex-1">
                <span className="text-xs text-primary uppercase tracking-wider">
                  {article.category?.name}
                </span>
                <h3 className="font-serif font-semibold leading-snug group-hover:text-primary transition-colors mt-1 line-clamp-3">
                  {article.title}
                </h3>
                <span className="text-xs text-muted-foreground mt-2 block">
                  {timeAgo(article.published_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Deep Dives Section - Clean grid layout
function DeepDivesSection({ articles }: { articles: NewsArticle[] }) {
  if (articles.length < 2) return null;

  return (
    <section className="py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="font-serif text-2xl font-bold">Deep Dives</h2>
          </div>
          <Link
            href="/news?type=analysis"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            All Analysis <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.slice(0, 2).map((article) => (
            <OverlayCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Mixed Content Grid - Varied layouts
function MixedContentGrid({ articles, title }: { articles: NewsArticle[]; title: string }) {
  if (articles.length < 4) return null;

  return (
    <section className="py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-bold">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* First two as overlay cards */}
          <div className="md:col-span-2">
            <OverlayCard article={articles[0]} size="medium" />
          </div>
          {/* Next two as regular cards */}
          {articles.slice(1, 3).map((article) => (
            <InsightCard key={article.id} article={article} />
          ))}
        </div>

        {/* Bottom row - 4 regular cards */}
        {articles.length >= 7 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {articles.slice(3, 7).map((article) => (
              <InsightCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Quick Reads - Compact horizontal cards
function QuickReads({ articles }: { articles: NewsArticle[] }) {
  if (articles.length < 4) return null;

  return (
    <section className="py-12 bg-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="font-serif text-2xl font-bold text-white">Quick Reads</h2>
          </div>
          <span className="text-sm text-slate-400">Under 5 minutes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.slice(0, 4).map((article) => {
            const imageUrl = getArticleImage(article);
            return (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex gap-4 p-4 bg-slate-800/50 border border-slate-700 hover:border-primary/50 transition-colors"
              >
                {imageUrl && (
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-primary uppercase tracking-wider">
                    {article.category?.name}
                  </span>
                  <h4 className="font-semibold text-white leading-snug group-hover:text-primary transition-colors mt-1 line-clamp-2">
                    {article.title}
                  </h4>
                  <span className="text-xs text-slate-400 mt-2 block">
                    {article.read_time_minutes || 3} min read
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Overlay Grid Section - All cards with text on images
function OverlayGridSection({ articles, title }: { articles: NewsArticle[]; title: string }) {
  if (articles.length < 4) return null;

  return (
    <section className="py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <h2 className="font-serif text-2xl font-bold mb-8">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.slice(0, 4).map((article) => (
            <OverlayCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Large Feature Grid - 3 equal cards in a row
function LargeFeatureGrid({ articles, title }: { articles: NewsArticle[]; title: string }) {
  if (articles.length < 3) return null;

  return (
    <section className="py-12 bg-terminal-bg-secondary/50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <h2 className="font-serif text-2xl font-bold mb-8">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <OverlayCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Horizontal Scroll Section
function HorizontalScrollSection({ articles, title }: { articles: NewsArticle[]; title: string }) {
  if (articles.length < 4) return null;

  return (
    <section className="py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <h2 className="font-serif text-2xl font-bold mb-8">{title}</h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {articles.map((article) => (
            <div key={article.id} className="flex-shrink-0 w-72">
              <OverlayCard article={article} size="small" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Alternating Layout Section - Balanced grid
function AlternatingSection({ articles, title }: { articles: NewsArticle[]; title: string }) {
  if (articles.length < 6) return null;

  return (
    <section className="py-12 border-y border-terminal-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <h2 className="font-serif text-2xl font-bold mb-8">{title}</h2>
        {/* Top row - 2 medium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <OverlayCard article={articles[0]} size="medium" />
          <OverlayCard article={articles[1]} size="medium" />
        </div>
        {/* Bottom row - 4 smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.slice(2, 6).map((article) => (
            <OverlayCard key={article.id} article={article} size="small" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Main Page Component
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [extendedArticles, setExtendedArticles] = useState<NewsArticle[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  // FAST initial load - only 15 articles for above-the-fold content
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ page_size: 15 });
  const { data: indicesData, isLoading: indicesLoading } = useIndices();
  const { data: cnbcVideoData, isLoading: videosLoading } = useCNBCAfricaVideo();


  useEffect(() => {
    setMounted(true);
  }, []);

  // Load more articles when user scrolls down
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

  // Combine initial and extended articles
  const initialArticles = articlesData?.results || [];
  const allArticles = [...initialArticles, ...extendedArticles];

  // Load more articles automatically after initial load completes
  // This ensures content appears quickly while still prioritizing above-the-fold
  useEffect(() => {
    if (!articlesLoading && initialArticles.length > 0 && !hasLoadedMore && !loadingMore) {
      // Small delay to let initial content render first
      const timer = setTimeout(() => {
        loadMoreArticles();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [articlesLoading, initialArticles.length, hasLoadedMore, loadingMore, loadMoreArticles]);

  // Hero section: 1 featured + 4 side articles (from initial fast load)
  const featuredArticle = initialArticles[0];
  const heroSideArticles = initialArticles.slice(1, 5);
  // Main grid (from initial load)
  const mainInsights = initialArticles.slice(5, 9);
  const sidebarInsights = initialArticles.slice(9, 14);

  // Extended sections (from lazy load) - only render when loaded
  const editorsPicksArticles = allArticles.slice(14, 17);
  const trendingArticles = allArticles.slice(17, 22);
  const deepDiveArticles = allArticles.slice(22, 24);
  const moreSectionOne = allArticles.slice(24, 31);
  const quickReadArticles = allArticles.slice(31, 35);
  const moreSectionTwo = allArticles.slice(35, 42);
  const finalSection = allArticles.slice(42, 48);
  // Additional sections for longer feed
  const overlayGridOne = allArticles.slice(48, 52);
  const largeFeatureOne = allArticles.slice(52, 55);
  const horizontalScroll = allArticles.slice(55, 63);
  const alternatingSection = allArticles.slice(63, 70);
  const overlayGridTwo = allArticles.slice(70, 74);
  const largeFeatureTwo = allArticles.slice(74, 77);
  const bottomOverlay = allArticles.slice(77, 85);
  const finalOverlay = allArticles.slice(85, 93);
  // Even more sections
  const commoditiesSection = allArticles.slice(93, 100);
  const marketIndices = indicesData || [];
  const featuredVideo = cnbcVideoData || null;

  const loading = articlesLoading;

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero Section - Featured + Side Articles */}
        <section className="py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            {loading ? (
              <FeaturedInsightSkeleton />
            ) : featuredArticle ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Featured Article */}
                <div className="lg:col-span-7">
                  <FeaturedInsight article={featuredArticle} />
                </div>
                {/* Side Articles - Spread attention */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Top Stories
                  </h3>
                  {heroSideArticles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group flex bg-terminal-bg-secondary border border-terminal-border hover:border-primary/50 transition-colors overflow-hidden"
                    >
                      {getArticleImage(article) && (
                        <div className="relative w-28 flex-shrink-0 overflow-hidden">
                          <Image
                            src={getArticleImage(article)!}
                            alt={article.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 p-3">
                        <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                          {article.category?.name || "Insight"}
                        </span>
                        <h4 className="font-serif font-semibold leading-snug group-hover:text-primary transition-colors mt-1 line-clamp-2">
                          {article.title}
                        </h4>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {timeAgo(article.published_at)}
                        </span>
                      </div>
                    </Link>
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

        {/* Industry Navigation */}
        <IndustryNavigation />

        {/* Main Content Grid */}
        <section className="py-12">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-2xl font-bold">Latest Insights</h2>
                  <Link
                    href="/news"
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <InsightCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First two as large overlay cards */}
                    {mainInsights.slice(0, 2).map((article) => (
                      <OverlayCard key={article.id} article={article} size="medium" />
                    ))}
                    {/* Next two as regular cards */}
                    {mainInsights.slice(2, 4).map((article) => (
                      <InsightCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                {/* Market Summary */}
                {!indicesLoading && marketIndices.length > 0 && (
                  <div className="mb-8">
                    <MarketSummaryWidget indices={marketIndices} />
                  </div>
                )}

                {/* Most Read */}
                <div className="mb-8">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Most Read
                  </h3>
                  {loading ? (
                    <div className="space-y-0">
                      {[...Array(4)].map((_, i) => (
                        <SidebarInsightSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                    <div>
                      {sidebarInsights.map((article) => (
                        <SidebarInsight key={article.id} article={article} />
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Featured Research */}
        <FeaturedResearchSection />

        {/* Podcast Section */}
        {!videosLoading && featuredVideo && (
          <PodcastSection video={featuredVideo} />
        )}

        {/* Topics & Regions */}
        <TopicsRegionsSection />

        {/* Newsletter CTA */}
        <NewsletterSection />

        {/* ====== EXTENDED FEED (loads automatically after initial content) ====== */}

        {/* Show loading indicator or content */}
        {loadingMore && !hasLoadedMore && (
          <section className="py-12">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <InsightCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Extended sections - only render when data is loaded */}
        {hasLoadedMore && (
          <>
            {/* Editors' Picks with Overlay Cards */}
            <EditorsPicks articles={editorsPicksArticles} />

            {/* Trending Section */}
            <TrendingSection articles={trendingArticles} />

            {/* Deep Dives */}
            <DeepDivesSection articles={deepDiveArticles} />

            {/* More Insights Section 1 */}
            <MixedContentGrid articles={moreSectionOne} title="Markets & Economy" />

            {/* Quick Reads - Dark Section */}
            <QuickReads articles={quickReadArticles} />

            {/* More Insights Section 2 */}
            <MixedContentGrid articles={moreSectionTwo} title="Industry Spotlight" />

            {/* Final Grid Section */}
            {finalSection.length > 0 && (
              <section className="py-12 bg-terminal-bg-secondary/30">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-serif text-2xl font-bold">More from African Finance Insights</h2>
                    <Link
                      href="/news"
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      Browse Archive <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {finalSection.map((article) => (
                      <OverlayCard key={article.id} article={article} size="medium" />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ====== ADDITIONAL SECTIONS FOR LONGER FEED ====== */}

            {/* Overlay Grid 1 */}
            <OverlayGridSection articles={overlayGridOne} title="Banking & Finance" />

            {/* Large Feature 1 */}
            <LargeFeatureGrid articles={largeFeatureOne} title="Featured Analysis" />

            {/* Horizontal Scroll Section */}
            <HorizontalScrollSection articles={horizontalScroll} title="Quick Browse" />

            {/* Alternating Layout */}
            <AlternatingSection articles={alternatingSection} title="Regional Focus" />

            {/* Overlay Grid 2 */}
            <OverlayGridSection articles={overlayGridTwo} title="Technology & Innovation" />

            {/* Large Feature 2 */}
            <LargeFeatureGrid articles={largeFeatureTwo} title="In-Depth Reports" />

            {/* Bottom Overlay Grid */}
            {bottomOverlay.length >= 4 && (
              <section className="py-12">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                  <h2 className="font-serif text-2xl font-bold mb-8">Latest Updates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {bottomOverlay.slice(0, 8).map((article) => (
                      <OverlayCard key={article.id} article={article} size="small" />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Final Large Overlay Section */}
            {finalOverlay.length >= 4 && (
              <section className="py-12 bg-slate-900">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                  <h2 className="font-serif text-2xl font-bold text-white mb-8">Don't Miss</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {finalOverlay.slice(0, 8).map((article) => (
                      <OverlayCard key={article.id} article={article} size="medium" />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Commodities & Resources Section */}
            {commoditiesSection.length >= 4 && (
              <section className="py-12">
                <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                  <div className="flex items-center gap-3 mb-8">
                    <Pickaxe className="h-6 w-6 text-primary" />
                    <h2 className="font-serif text-2xl font-bold">Commodities & Resources</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {commoditiesSection.slice(0, 4).map((article) => (
                      <OverlayCard key={article.id} article={article} size="small" />
                    ))}
                  </div>
                  {commoditiesSection.length > 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      {commoditiesSection.slice(4, 7).map((article) => (
                        <InsightCard key={article.id} article={article} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Final Mosaic Grid */}
        {hasLoadedMore && allArticles.length > 93 && (
          <section className="py-12 bg-terminal-bg-secondary/50">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
              <h2 className="font-serif text-2xl font-bold mb-8">More Stories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {allArticles.slice(93, 99).map((article) => {
                  const imageUrl = getArticleImage(article);
                  return (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-square overflow-hidden mb-2">
                        {imageUrl && (
                          <Image
                            src={imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">
                            {article.category?.name}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-16 text-center">
          <div className="max-w-[800px] mx-auto px-4 md:px-6">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Explore All Content
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Discover in-depth analysis, research reports, and expert commentary on African markets.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/news" className="btn-primary flex items-center gap-2">
                All Articles <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/research" className="btn-secondary flex items-center gap-2">
                Research Reports <FileText className="h-4 w-4" />
              </Link>
              <Link href="/podcasts" className="btn-secondary flex items-center gap-2">
                Podcasts <Mic className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
