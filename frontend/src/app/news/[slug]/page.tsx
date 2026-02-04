"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Printer,
  Volume2,
  Mail,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import { CommentSection } from "@/components/news";
import apiClient from "@/services/api/client";
import { toast } from "sonner";
import { addKeywordLinks } from "@/lib/keyword-linker";

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

// Reading Progress Bar component
function ReadingProgressBar({ progress }: { progress: number }) {
  return (
    <div className="reading-progress">
      <div
        className="reading-progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Sticky Article Header (appears on scroll)
function StickyArticleHeader({
  title,
  visible,
  progress,
  onShare,
  onBookmark,
  bookmarked
}: {
  title: string;
  visible: boolean;
  progress: number;
  onShare: () => void;
  onBookmark: () => void;
  bookmarked: boolean;
}) {
  return (
    <div className={cn("sticky-article-header", visible && "visible")}>
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium truncate flex-1">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          <button
            onClick={onBookmark}
            className={cn(
              "p-2 rounded-md transition-colors",
              bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
          </button>
          <button
            onClick={onShare}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Article Toolbar component (Foreign Affairs style)
function ArticleToolbar({
  onPrint,
  onShare,
  onEmail,
  onBookmark,
  bookmarked,
  onLike,
  liked
}: {
  onPrint: () => void;
  onShare: (platform: string) => void;
  onEmail: () => void;
  onBookmark: () => void;
  bookmarked: boolean;
  onLike: () => void;
  liked: boolean;
}) {
  return (
    <div className="article-toolbar flex-wrap">
      <button onClick={onPrint} className="toolbar-btn">
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Print</span>
      </button>

      <button onClick={onEmail} className="toolbar-btn">
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">Email</span>
      </button>

      <button onClick={onBookmark} className={cn("toolbar-btn", bookmarked && "active")}>
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        <span className="hidden sm:inline">{bookmarked ? "Saved" : "Save"}</span>
      </button>

      <div className="toolbar-divider" />

      <button onClick={() => onShare("twitter")} className="toolbar-btn">
        <FaXTwitter className="h-4 w-4" />
      </button>
      <button onClick={() => onShare("linkedin")} className="toolbar-btn">
        <Linkedin className="h-4 w-4" />
      </button>
      <button onClick={() => onShare("facebook")} className="toolbar-btn">
        <Facebook className="h-4 w-4" />
      </button>
      <button onClick={() => onShare("copy")} className="toolbar-btn">
        <LinkIcon className="h-4 w-4" />
      </button>

      <div className="flex-1" />

      <button onClick={onLike} className={cn("toolbar-btn", liked && "active")}>
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
      </button>
    </div>
  );
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
  const [readingProgress, setReadingProgress] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  // Reading progress tracking
  const handleScroll = useCallback(() => {
    if (!articleRef.current) return;

    const element = articleRef.current;
    const totalHeight = element.clientHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY - element.offsetTop;

    // Calculate progress based on article scroll position
    const progress = Math.min(
      Math.max((scrollTop / (totalHeight - windowHeight)) * 100, 0),
      100
    );

    setReadingProgress(progress);

    // Show sticky header after scrolling past the title area (400px)
    setShowStickyHeader(window.scrollY > 400);
  }, []);

  useEffect(() => {
    setMounted(true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle email
  const handleEmail = () => {
    const subject = encodeURIComponent(article?.title || "");
    const body = encodeURIComponent(`Check out this article: ${window.location.href}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Render article content - handle HTML content safely with drop cap and keyword links
  const renderContent = () => {
    if (!article.content) return null;

    // If content looks like HTML, render it
    if (article.content.includes("<") && article.content.includes(">")) {
      // Add drop-cap class to first paragraph and keyword links
      let processedContent = article.content.replace(
        /<p>/,
        '<p class="drop-cap">'
      );
      // Add keyword hyperlinks (max 2 per keyword)
      processedContent = addKeywordLinks(processedContent, 2);

      return (
        <div
          className="prose-journal max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      );
    }

    // Otherwise, render as plain text with paragraphs
    const paragraphs = article.content.split("\n\n");
    // Process all paragraphs together for consistent keyword linking
    const processedParagraphs = paragraphs.map((p) => addKeywordLinks(p, 2));

    return (
      <div className="prose-journal max-w-none mb-8">
        {processedParagraphs.map((paragraph, index) => (
          <p
            key={index}
            className={index === 0 ? "drop-cap" : ""}
            dangerouslySetInnerHTML={{ __html: paragraph }}
          />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      {/* Reading Progress Bar */}
      <ReadingProgressBar progress={readingProgress} />

      {/* Sticky Header (appears on scroll) */}
      <StickyArticleHeader
        title={article.title}
        visible={showStickyHeader}
        progress={readingProgress}
        onShare={() => handleShare("copy")}
        onBookmark={handleBookmark}
        bookmarked={bookmarked}
      />

      <article ref={articleRef} className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/insights" className="hover:text-foreground">Insights</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">{article.category?.name || "Article"}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <header className="mb-8">
              {/* Category & Meta badges */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Link
                  href={`/topics/${article.category?.slug || ''}`}
                  className="label-uppercase text-primary hover:underline"
                >
                  {article.category?.name || "Analysis"}
                </Link>
                {article.is_breaking && (
                  <span className="px-2 py-0.5 bg-destructive text-white text-xs font-semibold rounded">
                    BREAKING
                  </span>
                )}
                {article.is_premium && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded">
                    PREMIUM
                  </span>
                )}
              </div>

              {/* Title - Journal style serif */}
              <h1 className="headline-xl text-balance mb-5">
                {article.title}
              </h1>

              {/* Subtitle/Deck */}
              {article.subtitle && (
                <h2 className="text-xl md:text-2xl text-muted-foreground mb-5 font-serif leading-relaxed">
                  {article.subtitle}
                </h2>
              )}

              {/* Excerpt/Lede */}
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed prose-article">
                {article.excerpt}
              </p>

              {/* Author & Meta - Journal style */}
              <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-terminal-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-terminal-bg-elevated flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {(article.author?.full_name || "S").split(" ").map((n) => n[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{article.author?.full_name || "Staff Writer"}</div>
                    <div className="text-sm text-muted-foreground">
                      {article.external_source_name ? (
                        <span>via {article.external_source_name}</span>
                      ) : (
                        <span>African Finance Insights</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(article.published_at)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-end gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.read_time_minutes ? `${article.read_time_minutes} min read` : "5 min read"}
                  </div>
                </div>
              </div>

              {/* Article Toolbar - Foreign Affairs style */}
              <ArticleToolbar
                onPrint={handlePrint}
                onShare={handleShare}
                onEmail={handleEmail}
                onBookmark={handleBookmark}
                bookmarked={bookmarked}
                onLike={handleLike}
                liked={liked}
              />
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

            {/* Topics & Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-8 pt-6 border-t border-terminal-border">
                <h3 className="label-uppercase mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/topics/${tag.slug}`}
                      className="topic-tag"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="article-toolbar mb-8">
              <button onClick={handlePrint} className="toolbar-btn">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button onClick={handleEmail} className="toolbar-btn">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </button>
              <button onClick={handleBookmark} className={cn("toolbar-btn", bookmarked && "active")}>
                <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                <span>{bookmarked ? "Saved" : "Save"}</span>
              </button>
              <div className="toolbar-divider" />
              <button onClick={() => handleShare("twitter")} className="toolbar-btn">
                <FaXTwitter className="h-4 w-4" />
              </button>
              <button onClick={() => handleShare("linkedin")} className="toolbar-btn">
                <Linkedin className="h-4 w-4" />
              </button>
              <button onClick={() => handleShare("copy")} className="toolbar-btn">
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Related Insights */}
            {relatedArticles.length > 0 && (
              <section className="mb-8">
                <h2 className="headline text-xl mb-6">Related Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((item) => {
                    // Generate fallback image based on article ID for uniqueness
                    const fallbackImage = `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&sig=${item.id}`;
                    const imageUrl = item.featured_image || fallbackImage;

                    return (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-3 bg-terminal-bg-elevated">
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                      <span className="label-uppercase text-primary">
                        {item.category?.name || "Analysis"}
                      </span>
                      <h3 className="headline text-lg mt-1 group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-sm text-muted-foreground mt-1 block">
                        {formatDate(item.published_at)}
                      </span>
                    </Link>
                  );
                  })}
                </div>
              </section>
            )}

            {/* Comments Section */}
            {article.id && (
              <CommentSection articleId={article.id} />
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {/* Author Bio - Enhanced Card */}
            <section className="author-card">
              <h3 className="label-uppercase mb-4">About the Author</h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="author-card-avatar flex-shrink-0">
                  {(article.author?.full_name || "S").split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-lg">{article.author?.full_name || "Staff Writer"}</div>
                  <div className="text-sm text-primary">Senior Analyst</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Covering African markets and economics with a focus on emerging market dynamics,
                policy analysis, and institutional investment trends across the continent.
              </p>
              <Link
                href={`/authors/${article.author?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'staff'}`}
                className="text-sm text-primary hover:underline"
              >
                View all articles by this author →
              </Link>
            </section>

            {/* Newsletter - Journal style */}
            <section className="p-6 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="headline text-lg mb-2">African Finance Insights</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Weekly analysis and research on African markets, delivered to your inbox.
              </p>
              <form className="space-y-3" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  disabled={subscribing}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-terminal-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe to Newsletter"
                  )}
                </button>
              </form>
            </section>

            {/* Related Companies/Stocks - Subtle */}
            {article.related_companies && article.related_companies.length > 0 && (
              <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <h3 className="label-uppercase mb-3">Related Markets</h3>
                <div className="space-y-2">
                  {article.related_companies.slice(0, 4).map((stock) => {
                    const isUp = (stock.price_change_percent || 0) >= 0;
                    return (
                      <Link
                        key={stock.symbol}
                        href={`/companies/${stock.symbol.toLowerCase()}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors"
                      >
                        <div>
                          <div className="font-mono text-sm font-medium">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground">{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">{Number(stock.current_price).toFixed(2)}</div>
                          <div className={cn("text-xs flex items-center gap-1", isUp ? "text-up" : "text-down")}>
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

            {/* View Count - Subtle */}
            {article.view_count !== undefined && article.view_count > 0 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                {article.view_count.toLocaleString()} readers
              </div>
            )}
          </aside>
        </div>
      </article>
    </MainLayout>
  );
}
