"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ChevronRight,
  Search,
  TrendingUp,
  Newspaper,
  Check,
  Heart,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import apiClient from "@/services/api/client";
import { toast } from "sonner";
import { useCategories } from "@/hooks";

// Types
interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featured_image?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  author?: {
    id: number;
    full_name: string;
  };
  published_at?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_premium?: boolean;
  view_count?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

// LocalStorage utilities
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

// Helper to format time ago
function timeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

// Skeleton Components
function FeaturedSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-terminal-bg-secondary animate-pulse">
      <Skeleton className="aspect-[16/9]" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Skeleton className="h-5 w-20 mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <Skeleton className="w-32 h-24 flex-shrink-0 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <Skeleton className="w-6 h-6" />
      <div className="flex-1">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Article Actions Component
function ArticleActions({ articleId, compact = false }: { articleId: string; compact?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLiked(getLikes().includes(articleId));
    setBookmarked(getBookmarks().includes(articleId));
  }, [articleId]);

  if (!mounted) return null;

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
    <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-1")}>
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

// Article Card Component
function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article className="flex gap-4 p-4 rounded-lg hover:bg-terminal-bg-elevated transition-colors">
        {article.featured_image && (
          <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden rounded bg-terminal-bg-secondary">
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
              {article.is_breaking && (
                <span className="px-1.5 py-0.5 bg-market-down text-white text-[10px] font-semibold rounded">
                  BREAKING
                </span>
              )}
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
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{article.author?.full_name || "Staff Writer"}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(article.published_at)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Featured Article Component
function FeaturedArticle({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-lg bg-terminal-bg-secondary">
        {article.featured_image ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-terminal-bg-elevated flex items-center justify-center">
            <Newspaper className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {article.is_breaking && (
                <span className="px-2 py-1 bg-market-down text-white text-xs font-semibold rounded">
                  BREAKING
                </span>
              )}
              <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
                {article.category?.name || "News"}
              </span>
            </div>
            <ArticleActions articleId={`article-${article.slug}`} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-orange transition-colors leading-tight">
            {article.title}
          </h2>
          <p className="text-white/80 mb-3 line-clamp-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span>{article.author?.full_name || "Staff Writer"}</span>
            <span>{timeAgo(article.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Newsletter Component
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
        newsletter_type: "breaking_news",
      });
      setSubscribed(true);
      toast.success("Successfully subscribed to breaking news alerts!");
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
      <h3 className="font-bold mb-2">Stay Informed</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get breaking news alerts and daily market summaries delivered to your inbox.
      </p>
      {subscribed ? (
        <div className="flex items-center gap-2 text-market-up">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">Subscribed!</span>
        </div>
      ) : (
        <form className="space-y-2" onSubmit={handleSubscribe}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            className="w-full px-3 py-2 text-sm bg-terminal-bg border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Subscribe"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function NewsPage() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trendingArticles, setTrendingArticles] = useState<NewsArticle[]>([]);

  // Use SWR hook for categories (cached for 1 hour)
  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  // Fetch articles when category or page changes
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page: currentPage,
          page_size: 12,
        };

        if (selectedCategory !== "all") {
          params.category = selectedCategory;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await apiClient.get("/news/articles/", { params });
        const data = response.data;

        setArticles(data.results || data || []);
        if (data.count) {
          setTotalPages(Math.ceil(data.count / 12));
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedCategory, currentPage, searchQuery]);

  // Fetch trending articles (most viewed)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await apiClient.get("/news/articles/", {
          params: { ordering: "-view_count", page_size: 5 }
        });
        const data = response.data.results || response.data || [];
        setTrendingArticles(data);
      } catch (error) {
        console.error("Failed to fetch trending:", error);
      }
    };
    fetchTrending();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
  };

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">News</h1>
            <p className="text-muted-foreground">
              Latest financial news and market updates from Africa and beyond
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </form>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange("all")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
              selectedCategory === "all"
                ? "bg-brand-orange text-white"
                : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            All News
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedCategory === category.slug
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <>
                <FeaturedSkeleton />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <ArticleSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : articles.length > 0 ? (
              <>
                {/* Featured */}
                {featuredArticle && <FeaturedArticle article={featuredArticle} />}

                {/* Article List */}
                <div className="space-y-2">
                  {remainingArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-terminal-border rounded-md text-sm font-medium hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-terminal-border rounded-md text-sm font-medium hover:bg-terminal-bg-elevated transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center bg-terminal-bg-secondary rounded-lg">
                <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">No articles found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term."
                    : "Check back soon for the latest news."}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-brand-orange" />
                Trending
              </h2>
              <div className="space-y-3">
                {loading ? (
                  [...Array(5)].map((_, i) => <TrendingSkeleton key={i} />)
                ) : trendingArticles.length > 0 ? (
                  trendingArticles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="flex gap-3 group"
                    >
                      <span className="text-2xl font-bold text-muted-foreground/50 w-6">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium group-hover:text-brand-orange transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(article.published_at)}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No trending articles</p>
                )}
              </div>
            </section>

            {/* Newsletter */}
            <NewsletterSignup />

            {/* Topics */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4">Popular Topics</h2>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 10).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className="px-3 py-1 text-sm bg-terminal-bg-elevated rounded-full hover:bg-brand-orange hover:text-white transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
