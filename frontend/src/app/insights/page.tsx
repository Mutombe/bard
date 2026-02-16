"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import {
  useInfiniteArticles,
  useCategories,
  useFeaturedArticles,
} from "@/hooks";

// Types
interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
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

// Helpers
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

// Hero Featured Article
function HeroArticle({ article }: { article: NewsArticle }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-terminal-bg-secondary overflow-hidden border border-terminal-border hover:border-primary/50 transition-colors">
        <div className="relative aspect-video md:aspect-auto md:min-h-[320px] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 md:bg-gradient-to-l md:from-terminal-bg-secondary/50 md:to-transparent" />
          {article.is_breaking && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-semibold uppercase tracking-wide">
              Breaking
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {article.category?.name || "Featured"}
            </span>
            {article.read_time_minutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.read_time_minutes} min read
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors mb-4">
            {article.title}
          </h2>

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

// Article Card for the grid
function ArticleCard({ article }: { article: NewsArticle }) {
  const imageUrl = getArticleImage(article);

  return (
    <Link href={`/news/${article.slug}`} className="group block h-full">
      <article className="h-full bg-terminal-bg-secondary border border-terminal-border overflow-hidden hover:border-primary/50 transition-colors">
        <div className="relative aspect-[16/10] overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              {article.category?.name || "Insight"}
            </span>
            <h3 className="font-serif font-bold text-white leading-snug group-hover:text-primary transition-colors text-lg line-clamp-3">
              {article.title}
            </h3>
          </div>

          {article.is_premium && (
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

// Skeleton for hero
function HeroSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-terminal-bg-secondary border border-terminal-border overflow-hidden animate-pulse">
      <Skeleton className="aspect-video md:min-h-[320px]" />
      <div className="p-6 md:p-8 flex flex-col justify-center">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

// Skeleton for article cards
function CardSkeleton() {
  return (
    <div className="bg-terminal-bg-secondary border border-terminal-border overflow-hidden animate-pulse">
      <Skeleton className="aspect-[16/10]" />
      <div className="p-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Data fetching
  const { data: categories } = useCategories();
  const { data: featuredArticles, isLoading: featuredLoading } = useFeaturedArticles();
  const {
    articles,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useInfiniteArticles({
    category: selectedCategory,
    page_size: 12,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  const heroArticle = featuredArticles?.[0] as NewsArticle | undefined;

  // Filter out the hero article from the grid to avoid duplication
  const gridArticles = heroArticle
    ? articles.filter((a: any) => a.id !== heroArticle.id)
    : articles;

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Page Header */}
        <section className="pt-8 pb-4">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Insights</span>
            </nav>

            <div className="mb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
                Insights & Analysis
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                In-depth research, expert commentary, and editorial analysis on African markets and global finance.
              </p>
            </div>
          </div>
        </section>

        {/* Hero Featured Article */}
        <section className="pb-8">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            {featuredLoading ? (
              <HeroSkeleton />
            ) : heroArticle ? (
              <HeroArticle article={heroArticle} />
            ) : null}
          </div>
        </section>

        {/* Category Filter Tabs */}
        <section className="border-y border-terminal-border bg-terminal-bg-secondary/50 sticky top-0 z-10">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={cn(
                  "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                )}
              >
                All
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-10">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : gridArticles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No articles found for this category.</p>
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className="mt-4 text-primary hover:text-primary/80"
                >
                  View all articles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(gridArticles as NewsArticle[]).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more articles...</span>
              </div>
            )}

            {/* Sentinel for IntersectionObserver */}
            <div ref={sentinelRef} className="h-1" />

            {/* End of feed */}
            {!hasMore && !isLoading && gridArticles.length > 0 && (
              <div className="text-center py-10 text-muted-foreground border-t border-terminal-border mt-8">
                <p className="text-sm">You've reached the end of the feed.</p>
                <Link
                  href="/news"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  Browse all news <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
