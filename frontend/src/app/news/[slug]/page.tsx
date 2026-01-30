"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Share2,
  Bookmark,
  MessageSquare,
  Heart,
  ChevronRight,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import { CommentSection } from "@/components/news";
import apiClient from "@/services/api/client";
import { toast } from "sonner";

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

// Types
interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  featured_image_caption?: string;
  image_attribution?: {
    html?: string;
    photographer?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  tags?: { id: number; name: string; slug: string }[];
  author?: {
    id: number;
    full_name: string;
    email?: string;
  };
  published_at?: string;
  created_at?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_premium?: boolean;
  view_count?: number;
  read_time_minutes?: number;
  source?: string;
  external_url?: string;
  external_source_name?: string;
  related_companies?: {
    symbol: string;
    name: string;
    current_price: number;
    price_change_percent: number;
  }[];
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  category?: { name: string };
  published_at?: string;
  featured_image?: string;
}

// Helper to format time
function formatDate(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(dateString);
}

// Loading skeleton
function ArticleSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 animate-pulse">
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="aspect-video w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setSubscribing(true);
    try {
      await apiClient.post("/engagement/newsletters/", {
        email: subscribeEmail.trim(),
        newsletter_type: "daily_digest",
      });
      toast.success("Subscribed! Check your email for confirmation.");
      setSubscribeEmail("");
    } catch (err: any) {
      console.error("Subscription error:", err);
      const errorMsg = err.response?.data?.email?.[0] ||
                       err.response?.data?.detail ||
                       "Failed to subscribe. Please try again.";
      toast.error(errorMsg);
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch article details
        const response = await apiClient.get(`/news/articles/${slug}/`);
        setArticle(response.data);

        // Update likes/bookmarks state
        if (mounted) {
          setLiked(getLikes().includes(`article-${slug}`));
          setBookmarked(getBookmarks().includes(`article-${slug}`));
        }

        // Fetch related articles (same category)
        try {
          const categorySlug = response.data.category?.slug;
          if (categorySlug) {
            const relatedResponse = await apiClient.get(
              `/news/articles/?category=${categorySlug}&limit=4`
            );
            // Filter out current article
            const related = (relatedResponse.data.results || [])
              .filter((a: any) => a.slug !== slug)
              .slice(0, 4);
            setRelatedArticles(related);
          }
        } catch (e) {
          // Related articles are not critical
          console.warn("Failed to fetch related articles:", e);
        }
      } catch (err: any) {
        console.error("Failed to fetch article:", err);
        if (err.response?.status === 404) {
          setError("Article not found");
        } else {
          setError("Failed to load article");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, mounted]);

  const handleLike = () => {
    const newState = toggleLike(`article-${slug}`);
    setLiked(newState);
    toast.success(newState ? "Added to liked articles" : "Removed from liked articles");
  };

  const handleBookmark = () => {
    const newState = toggleBookmark(`article-${slug}`);
    setBookmarked(newState);
    toast.success(newState ? "Saved to reading list" : "Removed from reading list");
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = article?.title || "";

    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "copy":
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
        break;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <ArticleSkeleton />
      </MainLayout>
    );
  }

  if (error || !article) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Render article content - handle HTML content safely
  const renderContent = () => {
    if (!article.content) return null;

    // If content looks like HTML, render it
    if (article.content.includes("<") && article.content.includes(">")) {
      return (
        <div
          className="prose prose-invert prose-orange max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      );
    }

    // Otherwise, render as plain text with paragraphs
    return (
      <div className="prose prose-invert prose-orange max-w-none mb-8">
        {article.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <article className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/news" className="hover:text-foreground">News</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-brand-orange">{article.category?.name || "Article"}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-brand-orange text-white text-xs font-semibold rounded">
                  {article.category?.name || "News"}
                </span>
                {article.is_breaking && (
                  <span className="px-3 py-1 bg-market-down text-white text-xs font-semibold rounded">
                    BREAKING
                  </span>
                )}
                {article.is_premium && (
                  <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-semibold rounded">
                    PREMIUM
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {article.read_time_minutes ? `${article.read_time_minutes} min read` : ""}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                {article.title}
              </h1>

              {article.subtitle && (
                <h2 className="text-xl text-muted-foreground mb-4">
                  {article.subtitle}
                </h2>
              )}

              <p className="text-xl text-muted-foreground mb-6">
                {article.excerpt}
              </p>

              {/* Author & Meta */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-terminal-bg-elevated flex items-center justify-center">
                    <span className="font-semibold text-brand-orange">
                      {(article.author?.full_name || "S").split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{article.author?.full_name || "Staff Writer"}</div>
                    <div className="text-sm text-muted-foreground">
                      {article.external_source_name && (
                        <span>via {article.external_source_name} • </span>
                      )}
                      {timeAgo(article.published_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDate(article.published_at)}
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.featured_image && (
              <div className="mb-8">
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-terminal-bg-elevated">
                  <Image
                    src={article.featured_image}
                    alt={article.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {article.featured_image_caption && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {article.featured_image_caption}
                  </p>
                )}
                {article.image_attribution?.photographer && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Photo by {article.image_attribution.photographer} on Unsplash
                  </p>
                )}
              </div>
            )}

            {/* External Link Notice */}
            {article.external_url && (
              <div className="mb-6 p-4 bg-terminal-bg-elevated border border-terminal-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  This article was originally published by {article.external_source_name || "an external source"}.
                </p>
                <a
                  href={article.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-light text-sm"
                >
                  Read original article <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {/* Article Content */}
            {renderContent()}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/news?tag=${tag.slug}`}
                    className="px-3 py-1 text-sm bg-terminal-bg-elevated rounded-full hover:bg-brand-orange hover:text-white transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Share & Actions */}
            <div className="flex items-center justify-between py-4 border-t border-b border-terminal-border mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-colors",
                    liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                  <span>{liked ? "Liked" : "Like"}</span>
                </button>
                <button
                  onClick={handleBookmark}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-colors",
                    bookmarked ? "text-brand-orange" : "text-muted-foreground hover:text-brand-orange"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                  <span>{bookmarked ? "Saved" : "Save"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">Share:</span>
                <button
                  onClick={() => handleShare("twitter")}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
                >
                  <FaXTwitter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShare("linkedin")}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
                >
                  <Linkedin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
                >
                  <Facebook className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border hover:border-brand-orange/50 transition-colors group"
                    >
                      <span className="text-xs font-semibold text-brand-orange uppercase">
                        {item.category?.name || "News"}
                      </span>
                      <h3 className="font-semibold mt-1 group-hover:text-brand-orange transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {timeAgo(item.published_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Comments Section */}
            {article.id && (
              <CommentSection articleId={article.id} />
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Related Companies/Stocks */}
            {article.related_companies && article.related_companies.length > 0 && (
              <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <h3 className="font-bold mb-4">Mentioned Stocks</h3>
                <div className="space-y-3">
                  {article.related_companies.map((stock) => {
                    const isUp = (stock.price_change_percent || 0) >= 0;
                    return (
                      <Link
                        key={stock.symbol}
                        href={`/companies/${stock.symbol.toLowerCase()}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors"
                      >
                        <div>
                          <div className="font-mono font-semibold">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground">{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{Number(stock.current_price).toFixed(2)}</div>
                          <div className={cn("text-xs flex items-center gap-1", isUp ? "text-market-up" : "text-market-down")}>
                            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isUp ? "+" : ""}{Number(stock.price_change_percent).toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Newsletter */}
            <section className="p-4 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
              <h3 className="font-bold mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get breaking news and market analysis delivered to your inbox.
              </p>
              <form className="space-y-2" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  disabled={subscribing}
                  className="w-full px-3 py-2 text-sm bg-terminal-bg border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
            </section>

            {/* Author Bio */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="font-bold mb-3">About the Author</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-terminal-bg-elevated flex items-center justify-center">
                  <span className="font-semibold text-brand-orange">
                    {(article.author?.full_name || "S").split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{article.author?.full_name || "Staff Writer"}</div>
                  <div className="text-sm text-muted-foreground">Reporter</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Covering African markets and economics with focus on financial news and market analysis.
              </p>
            </section>

            {/* View Count */}
            {article.view_count !== undefined && article.view_count > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                {article.view_count.toLocaleString()} views
              </div>
            )}
          </aside>
        </div>
      </article>
    </MainLayout>
  );
}
