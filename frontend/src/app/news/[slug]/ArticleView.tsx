"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ShareNetwork,
  BookmarkSimple,
  ChatText,
  Heart,
  CaretRight,
  LinkedinLogo,
  FacebookLogo,
  Link as LinkIcon,
  TrendUp,
  TrendDown,
  ArrowSquareOut,
  CircleNotch,
  ArrowLeft,
  Printer,
  SpeakerHigh,
  Envelope,
  XLogo,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CommentSection } from "@/components/news";
import { publicClient } from "@/services/api/client";
import { editorialService } from "@/services/api/editorial";
import { toast } from "sonner";
import { addKeywordLinks } from "@/lib/keyword-linker";
import { useArticle, useArticles } from "@/hooks";

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
  likes_count?: number;
  saves_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
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
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
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
            <BookmarkSimple className={cn("h-4 w-4")} weight={bookmarked ? "fill" : "regular"} />
          </button>
          <button
            onClick={onShare}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <ShareNetwork className="h-4 w-4" />
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
        <Envelope className="h-4 w-4" />
        <span className="hidden sm:inline">Email</span>
      </button>

      <button onClick={onBookmark} className={cn("toolbar-btn", bookmarked && "active")}>
        <BookmarkSimple className={cn("h-4 w-4")} weight={bookmarked ? "fill" : "regular"} />
        <span className="hidden sm:inline">{bookmarked ? "Saved" : "Save"}</span>
      </button>

      <div className="toolbar-divider" />

      <button onClick={() => onShare("twitter")} className="toolbar-btn">
        <XLogo className="h-4 w-4" />
      </button>
      <button onClick={() => onShare("linkedin")} className="toolbar-btn">
        <LinkedinLogo className="h-4 w-4" />
      </button>
      <button onClick={() => onShare("facebook")} className="toolbar-btn">
        <FacebookLogo className="h-4 w-4" />
      </button>
      <button onClick={() => onShare("copy")} className="toolbar-btn">
        <LinkIcon className="h-4 w-4" />
      </button>

      <div className="flex-1" />

      <button onClick={onLike} className={cn("toolbar-btn", liked && "active")}>
        <Heart className={cn("h-4 w-4")} weight={liked ? "fill" : "regular"} />
        <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
      </button>
    </div>
  );
}

// Loading skeleton
function ArticleSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 animate-pulse">
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

// Props come from the server wrapper in page.tsx. `initialArticle` is the
// SSR-fetched article used both for generateMetadata and as SWR fallback
// data so the first paint has content (and so Googlebot sees real HTML).
interface ArticleViewProps {
  slug: string;
  initialArticle?: any;
}

export default function ArticleView({ slug, initialArticle }: ArticleViewProps) {
  // SWR hooks for article and related articles. fallbackData hydrates
  // immediately from the server fetch — no loading flash on first paint.
  const { data: articleData, error: articleError, isLoading: loading } = useArticle(slug || null, initialArticle);
  const article = articleData as unknown as Article | undefined;
  const categorySlug = article?.category?.slug;
  const { data: relatedData } = useArticles(
    categorySlug ? { category: categorySlug, page_size: 5 } : undefined
  );
  const relatedArticles = (relatedData?.results || [])
    .filter((a: any) => a.slug !== slug)
    .slice(0, 4) as RelatedArticle[];

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  // Lightbox state — when an editor-inserted image in the article body is
  // clicked we show a full-screen overlay with the high-res source. ESC,
  // clicking outside, or the × button all close it.
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string; caption?: string } | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const error = articleError ? (articleError?.response?.status === 404 ? "Article not found" : "Failed to load article") : null;

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

  // Sync like/save state from server on article load
  useEffect(() => {
    if (article) {
      setLiked(Boolean(article.is_liked));
      setBookmarked(Boolean(article.is_saved));
    }
  }, [article]);

  // Close the lightbox with ESC. Body scroll is locked while open so the
  // underlying article doesn't scroll behind the overlay.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  // Event delegation: any <img> the editor inserted into the article body
  // opens the lightbox on click. We listen on the outer article element so
  // dangerouslySetInnerHTML content stays reactive-to-clicks without having
  // to attach individual handlers to every <img> after render.
  const handleContentClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      // Don't open lightbox for the tiny drop-cap or sponsor icons —
      // only for content images in .prose-journal.
      if (!target.closest(".prose-journal")) return;
      e.preventDefault();
      setLightbox({
        src: img.src,
        alt: img.alt || undefined,
        caption:
          img.getAttribute("data-caption") ||
          img.closest("figure")?.querySelector("figcaption")?.textContent ||
          undefined,
      });
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setSubscribing(true);
    try {
      await publicClient.post("/engagement/newsletters/", {
        email: subscribeEmail.trim(),
        newsletter_type: "morning_brief",
      });
      toast.success("Subscribed! Check your email for confirmation.");
      setSubscribeEmail("");
    } catch {
      toast.success("You're already subscribed!");
      setSubscribeEmail("");
    } finally {
      setSubscribing(false);
    }
  };

  const handleLike = async () => {
    if (!slug) return;
    const prev = liked;
    setLiked(!prev);
    try {
      const res = await editorialService.toggleLike(slug);
      setLiked(res.liked);
      toast.success(res.liked ? "Added to liked articles" : "Removed from liked articles");
    } catch {
      setLiked(prev);
      toast.error("Couldn't update like — try again");
    }
  };

  const handleBookmark = async () => {
    if (!slug) return;
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await editorialService.toggleSave(slug);
      setBookmarked(res.saved);
      toast.success(res.saved ? "Saved to reading list" : "Removed from reading list");
    } catch {
      setBookmarked(prev);
      toast.error("Couldn't update save — try again");
    }
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
    // The text may be one giant wall — split into sentences and group every 5-7
    // sentences into visual paragraphs for readability.

    // Normalize: collapse newlines into spaces so we work with one continuous text
    const text = article.content.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    // Split into sentences: match sentence-ending punctuation followed by a space
    // and an uppercase letter — but preserve the punctuation with the sentence.
    // Handles "U.S." / "Dr." style abbreviations by not splitting on them.
    const sentenceRegex = /([^.!?]*(?:(?:U\.S|U\.K|U\.N|E\.U|Dr|Mr|Mrs|Ms|Jr|Sr|Inc|Corp|Ltd|Co|vs|etc)\.\s*)*[^.!?]*[.!?])(?:\s+|$)/g;
    const sentences: string[] = [];
    let match;
    while ((match = sentenceRegex.exec(text)) !== null) {
      const s = match[1].trim();
      if (s) sentences.push(s);
    }

    // Fallback: if regex didn't split well, just use the whole text as one paragraph
    if (sentences.length <= 1) {
      const html = addKeywordLinks(text, 2);
      return (
        <div className="prose-journal max-w-none mb-8">
          <p className="drop-cap" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    }

    // Group sentences into paragraphs of ~6 sentences each
    const SENTENCES_PER_PARAGRAPH = 6;
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
      paragraphs.push(sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join(' '));
    }

    return (
      <div className="prose-journal max-w-none mb-8">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={index === 0 ? "drop-cap" : ""}
            dangerouslySetInnerHTML={{ __html: addKeywordLinks(paragraph, 2) }}
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

      <article ref={articleRef} className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <CaretRight className="h-4 w-4" />
          <Link href="/insights" className="hover:text-foreground">Insights</Link>
          <CaretRight className="h-4 w-4" />
          <span className="text-primary">{article.category?.name || "Article"}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8">
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

              {/* Deck + lede.
                  - Both present and identical: show subtitle only (editors
                    often paste the same text into both — dedupe to one).
                  - Both present and distinct: show subtitle then excerpt.
                  - Only subtitle: show subtitle.
                  - Only excerpt: show excerpt.
                  - Neither: render nothing — we never manufacture a lede
                    from the body for editorial articles. */}
              {(() => {
                const subtitle = article.subtitle?.trim() || "";
                const excerpt = article.excerpt?.trim() || "";
                const sameCopy =
                  subtitle.length > 0 &&
                  excerpt.length > 0 &&
                  subtitle.toLowerCase() === excerpt.toLowerCase();
                const showSubtitle = subtitle.length > 0;
                const showExcerpt = excerpt.length > 0 && !sameCopy;
                return (
                  <>
                    {showSubtitle && (
                      <h2 className="text-xl md:text-2xl text-muted-foreground mb-5 font-serif leading-relaxed">
                        {subtitle}
                      </h2>
                    )}
                    {showExcerpt && (
                      <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed prose-article">
                        {excerpt}
                      </p>
                    )}
                  </>
                );
              })()}

              {/* Author & Meta - Journal style */}
              <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-terminal-border">
                <Link
                  href={`/people/${article.author?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'staff'}`}
                  className="flex items-center gap-4 group"
                >
                  <UserAvatar
                    src={(article.author as any)?.avatar || (article.author as any)?.profile?.avatar}
                    name={article.author?.full_name || "Staff Writer"}
                    identifier={article.author?.id?.toString()}
                    size="lg"
                  />
                  <div>
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {article.author?.full_name || "Staff Writer"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {article.external_source_name ? (
                        <span>via {article.external_source_name}</span>
                      ) : (
                        <span>African Finance Insights</span>
                      )}
                    </div>
                  </div>
                </Link>

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

            {/* Featured Image — object-position biases toward the lower
                half. Most editorial photos have subjects in the bottom half
                (faces, skylines, products); tall images with lots of sky
                were getting cropped to nothing-but-sky. 75% from the top
                keeps subjects framed with only a sliver of headroom. */}
            {article.featured_image && (
              <div className="mb-8">
                <div
                  className="relative aspect-[16/9] rounded-lg overflow-hidden bg-terminal-bg-elevated cursor-zoom-in group"
                  onClick={() =>
                    setLightbox({
                      src: article.featured_image!,
                      alt: article.title,
                      caption: article.featured_image_caption || undefined,
                    })
                  }
                >
                  <Image
                    src={article.featured_image}
                    alt={article.title}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-95"
                    style={{ objectPosition: "center 75%" }}
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
                  className="inline-flex items-center gap-2 text-brand-coral hover:text-brand-coral-light text-sm"
                >
                  Read original article <ArrowSquareOut className="h-4 w-4" />
                </a>
              </div>
            )}

            {/* Article Content — click delegate opens the image lightbox */}
            <div onClick={handleContentClick}>{renderContent()}</div>

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
                <Envelope className="h-4 w-4" />
                <span>Email</span>
              </button>
              <button onClick={handleBookmark} className={cn("toolbar-btn", bookmarked && "active")}>
                <BookmarkSimple className={cn("h-4 w-4")} weight={bookmarked ? "fill" : "regular"} />
                <span>{bookmarked ? "Saved" : "Save"}</span>
              </button>
              <div className="toolbar-divider" />
              <button onClick={() => handleShare("twitter")} className="toolbar-btn">
                <XLogo className="h-4 w-4" />
              </button>
              <button onClick={() => handleShare("linkedin")} className="toolbar-btn">
                <LinkedinLogo className="h-4 w-4" />
              </button>
              <button onClick={() => handleShare("copy")} className="toolbar-btn">
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Comments Section */}
            {article.id && (
              <CommentSection articleId={article.id} />
            )}
          </div>

          {/* Sidebar — sticky, follows reader */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-hide">
            {/* Author Bio - Enhanced Card */}
            <section className="author-card">
              <h3 className="label-uppercase mb-4">About the Author</h3>
              <Link
                href={`/people/${article.author?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'staff'}`}
                className="flex items-start gap-4 mb-4 group"
              >
                <UserAvatar
                  src={(article.author as any)?.avatar || (article.author as any)?.profile?.avatar}
                  name={article.author?.full_name || "Staff Writer"}
                  identifier={article.author?.id?.toString()}
                  size="xl"
                />
                <div>
                  <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {article.author?.full_name || "Staff Writer"}
                  </div>
                  <div className="text-sm text-primary">Senior Analyst</div>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Covering African markets and economics with a focus on emerging market dynamics,
                policy analysis, and institutional investment trends across the continent.
              </p>
              <Link
                href={`/people/${article.author?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'staff'}`}
                className="text-sm text-primary hover:underline"
              >
                View all articles by this author →
              </Link>
            </section>

            {/* Newsletter - Journal style */}
            <section className="relative overflow-hidden p-6 rounded-lg bg-primary/5 border border-primary/20">
              <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="article-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9b70b5" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#article-sub-grid)"/></svg></div>
              <h3 className="relative headline text-lg mb-2">African Finance Insights</h3>
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
                  className="w-full px-4 py-2.5 bg-brand-coral text-white text-sm font-medium rounded-md hover:bg-brand-coral-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing ? (
                    <>
                      <CircleNotch className="h-4 w-4 animate-spin" />
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
                            {isUp ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />}
                            {isUp ? "+" : ""}{Number(stock.price_change_percent).toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Related Insights — in sidebar */}
            {relatedArticles.length > 0 && (
              <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <h3 className="label-uppercase mb-4">Related Insights</h3>
                <div className="space-y-4">
                  {relatedArticles.slice(0, 5).map((item) => {
                    const fallbackImage = `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&sig=${item.id}`;
                    const imageUrl = item.featured_image || fallbackImage;
                    return (
                      <Link
                        key={item.id}
                        href={`/news/${item.slug}`}
                        className="group flex gap-3"
                      >
                        <div className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-terminal-bg-elevated">
                          <Image
                            src={imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-brand-violet">
                            {item.category?.name || "Analysis"}
                          </span>
                          <h4 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
                            {item.title}
                          </h4>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {formatDate(item.published_at)}
                          </span>
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

      {/* Lightbox — full-screen overlay for clicked article images. Click the
          backdrop or press ESC to close. Preserves any caption so readers
          keep context. */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            aria-label="Close image preview"
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <figure
            className="max-w-full max-h-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Using a plain img (not next/image) so the natural dimensions
                drive sizing — we want the full-res original in preview. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt={lightbox.alt || ""}
              className="max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-md"
            />
            {lightbox.caption && (
              <figcaption className="text-sm text-white/80 italic text-center max-w-2xl">
                {lightbox.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </MainLayout>
  );
}
