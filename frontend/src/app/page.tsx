"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  BarChart3,
  Newspaper,
  Play,
  ExternalLink,
  Heart,
  Bookmark,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { YouTubeVideo } from "@/services/media";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";
import { toast } from "sonner";
import {
  useArticles,
  useIndices,
  useGainers,
  useLosers,
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
  view_count?: number;
}

interface MarketIndex {
  code: string;
  name: string;
  current_value: number;
  previous_close: number;
  change?: number;
  change_percent?: number;
}

interface Company {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  price_change?: number;
  price_change_percent?: number;
}

// Helper to format time ago
function timeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// LocalStorage utilities for likes and bookmarks
const LIKES_KEY = "bardiq_likes";
const BOOKMARKS_KEY = "bardiq_bookmarks";

function getLikes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
  } catch {
    return [];
  }
}

function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function toggleLike(articleId: string): boolean {
  const likes = getLikes();
  const index = likes.indexOf(articleId);
  if (index > -1) {
    likes.splice(index, 1);
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    return false;
  } else {
    likes.push(articleId);
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    return true;
  }
}

function toggleBookmark(articleId: string): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(articleId);
  if (index > -1) {
    bookmarks.splice(index, 1);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return false;
  } else {
    bookmarks.push(articleId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    return true;
  }
}

// Skeleton Components
function FeaturedArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <Skeleton className="aspect-[16/9] mb-4 rounded-lg" />
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function SecondaryArticleSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      <Skeleton className="w-24 h-24 rounded flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function MarketCardSkeleton() {
  return (
    <div className="p-3 rounded-lg bg-terminal-bg-elevated border border-terminal-border animate-pulse">
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-20 mb-2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

function StockMoverSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      <Skeleton className="h-4 w-4" />
      <div className="flex-1">
        <Skeleton className="h-4 w-12 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-12 mb-1" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

function NewsListSkeleton() {
  return (
    <div className="py-3 border-b border-terminal-border animate-pulse">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-5 w-full" />
    </div>
  );
}

// Article Action Buttons
function ArticleActions({ articleId, compact = false }: { articleId: string; compact?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setLiked(getLikes().includes(articleId));
    setBookmarked(getBookmarks().includes(articleId));
  }, [articleId]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleLike(articleId);
    setLiked(newState);
    toast.success(newState ? "Added to liked articles" : "Removed from liked articles");
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleBookmark(articleId);
    setBookmarked(newState);
    toast.success(newState ? "Saved to reading list" : "Removed from reading list");
  };

  return (
    <div className={cn("flex items-center gap-1", compact ? "gap-0.5" : "gap-1")}>
      <button
        onClick={handleLike}
        className={cn(
          "p-1.5 rounded-full transition-colors",
          liked ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        )}
        title={liked ? "Unlike" : "Like"}
      >
        <Heart className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", liked && "fill-current")} />
      </button>
      <button
        onClick={handleBookmark}
        className={cn(
          "p-1.5 rounded-full transition-colors",
          bookmarked ? "text-brand-orange bg-brand-orange/10" : "text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/10"
        )}
        title={bookmarked ? "Remove from reading list" : "Save to reading list"}
      >
        <Bookmark className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", bookmarked && "fill-current")} />
      </button>
    </div>
  );
}

// Components
function FeaturedArticle({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article className="relative">
        {article.featured_image && (
          <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-lg bg-terminal-bg-elevated">
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            {article.is_breaking && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-market-down text-white text-xs font-semibold rounded">
                BREAKING
              </div>
            )}
            {article.is_premium && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-brand-orange text-white text-xs font-semibold rounded">
                PREMIUM
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
              {article.category?.name || "News"}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo(article.published_at)}</span>
          </div>
          <ArticleActions articleId={`article-${article.slug}`} />
        </div>
        <h2 className="text-2xl font-bold mb-2 group-hover:text-brand-orange transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-muted-foreground mb-3 line-clamp-2">
          {article.excerpt}
        </p>
        <div className="text-sm text-muted-foreground">
          By <span className="text-foreground">{article.author?.full_name || "Staff Writer"}</span>
        </div>
      </article>
    </Link>
  );
}

function SecondaryArticle({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article className="flex gap-4">
        {article.featured_image && (
          <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded bg-terminal-bg-elevated">
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
                {article.category?.name || "News"}
              </span>
              {article.is_premium && (
                <span className="px-1.5 py-0.5 bg-brand-orange/20 text-brand-orange text-[10px] font-semibold rounded">
                  PREMIUM
                </span>
              )}
            </div>
            <ArticleActions articleId={`article-${article.slug}`} compact />
          </div>
          <h3 className="font-semibold mb-1 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
        </div>
      </article>
    </Link>
  );
}

function NewsListItem({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block py-3 border-b border-terminal-border last:border-0">
      <article>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
              {article.category?.name || "News"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(article.published_at)}
            </span>
          </div>
          <ArticleActions articleId={`article-${article.slug}`} compact />
        </div>
        <h3 className="font-medium group-hover:text-brand-orange transition-colors leading-snug">
          {article.title}
        </h3>
      </article>
    </Link>
  );
}

function MarketIndexCard({ index }: { index: MarketIndex }) {
  const currentValue = Number(index.current_value) || 0;
  const previousClose = Number(index.previous_close) || 1;
  const change = Number(index.change) || (currentValue - previousClose);
  const changePercent = Number(index.change_percent) || ((change / previousClose) * 100);
  const isUp = change >= 0;

  return (
    <Link
      href={`/markets/indices/${index.code}`}
      className="block p-3 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-semibold text-sm">{index.code}</span>
        <span className={cn("text-xs font-medium", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? "+" : ""}{changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-1 truncate">{index.name}</div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg">{currentValue.toLocaleString()}</span>
        <span className={cn("flex items-center gap-0.5 text-xs", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "+" : ""}{change.toFixed(2)}
        </span>
      </div>
    </Link>
  );
}

function StockMoverRow({ stock, rank }: { stock: Company; rank: number }) {
  const currentPrice = Number(stock.current_price) || 0;
  const previousClose = Number(stock.previous_close) || 1;
  const change = Number(stock.price_change) || (currentPrice - previousClose);
  const changePercent = Number(stock.price_change_percent) || ((change / previousClose) * 100);
  const isUp = change >= 0;

  return (
    <Link
      href={`/companies/${stock.symbol}`}
      className="flex items-center gap-3 py-2 hover:bg-terminal-bg-elevated rounded px-2 -mx-2 transition-colors"
    >
      <span className="text-xs text-muted-foreground w-4">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="font-mono font-semibold text-sm">{stock.symbol}</div>
        <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm">{currentPrice.toFixed(2)}</div>
        <div className={cn("text-xs font-medium", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? "+" : ""}{changePercent.toFixed(2)}%
        </div>
      </div>
    </Link>
  );
}

// Featured Video Component
function FeaturedVideoSection({ video }: { video: YouTubeVideo | null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (video) {
      setLiked(getLikes().includes(`video-${video.video_id}`));
      setBookmarked(getBookmarks().includes(`video-${video.video_id}`));
    }
  }, [video]);

  if (!video) return null;

  const handleLike = () => {
    const newState = toggleLike(`video-${video.video_id}`);
    setLiked(newState);
    toast.success(newState ? "Added to liked videos" : "Removed from liked videos");
  };

  const handleBookmark = () => {
    const newState = toggleBookmark(`video-${video.video_id}`);
    setBookmarked(newState);
    toast.success(newState ? "Saved to watch later" : "Removed from watch later");
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Play className="h-5 w-5 text-brand-orange" />
          Featured Video
        </h2>
        <Link
          href="/videos"
          className="text-sm text-brand-orange hover:text-brand-orange-light flex items-center gap-1"
        >
          More Videos <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-lg overflow-hidden bg-terminal-bg-elevated border border-terminal-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Video Player / Thumbnail */}
          <div className="md:col-span-3 relative aspect-video">
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
                  <div className="w-16 h-16 rounded-full bg-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-white ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs rounded">
                  {video.duration_formatted}
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="md:col-span-2 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                  VIDEO
                </span>
                <span className="text-xs text-muted-foreground">
                  {video.channel_title}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLike}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    liked ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                </button>
                <button
                  onClick={handleBookmark}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    bookmarked ? "text-brand-orange bg-brand-orange/10" : "text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/10"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
              {video.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{video.view_count.toLocaleString()} views</span>
              <span className="text-muted-foreground">
                {video.duration_formatted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Newsletter Subscription Component
function NewsletterSignup() {
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
      toast.success("Successfully subscribed to the Morning Briefing!");
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
    <section className="p-4 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
      <h3 className="font-bold mb-2">Morning Briefing</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get the day&apos;s top stories and market analysis delivered to your inbox every morning.
      </p>
      {subscribed ? (
        <div className="flex items-center gap-2 text-market-up">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">Subscribed!</span>
        </div>
      ) : (
        <form className="flex gap-2" onSubmit={handleSubscribe}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm bg-terminal-bg border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Subscribe"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  // Use SWR hooks for all data fetching with automatic caching and revalidation
  const { data: articlesData, isLoading: articlesLoading } = useArticles();
  const { data: indicesData, isLoading: indicesLoading } = useIndices();
  const { data: gainersData, isLoading: gainersLoading } = useGainers(undefined, 5);
  const { data: losersData, isLoading: usersLoading } = useLosers(undefined, 5);
  const { data: cnbcVideoData, isLoading: videosLoading } = useCNBCAfricaVideo();

  // Handle client-side mounting for localStorage access
  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive data from SWR responses
  const articles = articlesData?.results || [];
  const featuredArticles = articles.slice(0, 3);
  const latestArticles = articles.slice(3, 12);
  const marketIndices = (indicesData || []).slice(0, 5);
  const topGainers = (gainersData || []).slice(0, 5);
  const topLosers = (losersData || []).slice(0, 5);
  const featuredVideo = cnbcVideoData || null;

  // Combined loading state
  const loading = articlesLoading || indicesLoading || gainersLoading || usersLoading;

  if (!mounted) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Featured Stories */}
            {loading ? (
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-1">
                    <FeaturedArticleSkeleton />
                  </div>
                  <div className="md:col-span-1 space-y-4">
                    <SecondaryArticleSkeleton />
                    <SecondaryArticleSkeleton />
                  </div>
                </div>
              </section>
            ) : featuredArticles.length > 0 ? (
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Main Featured */}
                  <div className="md:col-span-1">
                    <FeaturedArticle article={featuredArticles[0]} />
                  </div>

                  {/* Secondary Featured */}
                  <div className="md:col-span-1 space-y-4">
                    {featuredArticles.slice(1).map((article) => (
                      <SecondaryArticle key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <div className="p-8 text-center text-muted-foreground bg-terminal-bg-secondary rounded-lg">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">No articles yet</h3>
                <p className="text-sm">Check back soon for the latest African financial news and market analysis.</p>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-terminal-border" />

            {/* Featured YouTube Video - Second item after news */}
            {videosLoading ? (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="rounded-lg overflow-hidden bg-terminal-bg-elevated border border-terminal-border">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                    <Skeleton className="md:col-span-3 aspect-video" />
                    <div className="md:col-span-2 p-4">
                      <Skeleton className="h-5 w-20 mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              featuredVideo && (
                <>
                  <FeaturedVideoSection video={featuredVideo} />
                  <div className="border-t border-terminal-border" />
                </>
              )
            )}

            {/* Latest News Grid */}
            {loading ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <NewsCardSkeleton key={i} />
                  ))}
                </div>
              </section>
            ) : latestArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-brand-orange" />
                    Latest News
                  </h2>
                  <Link
                    href="/news"
                    className="text-sm text-brand-orange hover:text-brand-orange-light flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latestArticles.slice(0, 6).map((article) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                      <article className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors h-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
                              {article.category?.name || "News"}
                            </span>
                            <span className="text-xs text-muted-foreground">{timeAgo(article.published_at)}</span>
                          </div>
                          <ArticleActions articleId={`article-${article.slug}`} compact />
                        </div>
                        <h3 className="font-semibold mb-2 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
                        </p>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Market Summary */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-orange" />
                  Market Summary
                </h2>
                <Link href="/markets" className="text-xs text-brand-orange hover:text-brand-orange-light">
                  Full Data
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <MarketCardSkeleton key={i} />
                  ))}
                </div>
              ) : marketIndices.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {marketIndices.map((index) => (
                    <MarketIndexCard key={index.code} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Market data unavailable
                </p>
              )}
            </section>

            {/* Top Movers */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Top Movers</h2>
                <Link href="/markets/gainers" className="text-xs text-brand-orange hover:text-brand-orange-light">
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <>
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      {[...Array(3)].map((_, i) => (
                        <StockMoverSkeleton key={i} />
                      ))}
                    </div>
                    <div className="border-t border-terminal-border pt-4">
                      <Skeleton className="h-5 w-24 mb-2" />
                      {[...Array(3)].map((_, i) => (
                        <StockMoverSkeleton key={i} />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Gainers */}
                    {topGainers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-market-up" />
                          <span className="text-sm font-medium text-market-up">Top Gainers</span>
                        </div>
                        <div className="space-y-0">
                          {topGainers.slice(0, 3).map((stock, i) => (
                            <StockMoverRow key={stock.symbol} stock={stock} rank={i + 1} />
                          ))}
                        </div>
                      </div>
                    )}

                    {topGainers.length > 0 && topLosers.length > 0 && (
                      <div className="border-t border-terminal-border" />
                    )}

                    {/* Losers */}
                    {topLosers.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="h-4 w-4 text-market-down" />
                          <span className="text-sm font-medium text-market-down">Top Losers</span>
                        </div>
                        <div className="space-y-0">
                          {topLosers.slice(0, 3).map((stock, i) => (
                            <StockMoverRow key={stock.symbol} stock={stock} rank={i + 1} />
                          ))}
                        </div>
                      </div>
                    )}

                    {topGainers.length === 0 && topLosers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Market data unavailable
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Latest Headlines */}
            {loading ? (
              <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                {[...Array(5)].map((_, i) => (
                  <NewsListSkeleton key={i} />
                ))}
              </section>
            ) : latestArticles.length > 0 && (
              <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold">Headlines</h2>
                  <Link href="/news" className="text-xs text-brand-orange hover:text-brand-orange-light">
                    More
                  </Link>
                </div>

                <div>
                  {latestArticles.map((article) => (
                    <NewsListItem key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Newsletter Signup */}
            <NewsletterSignup />
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
