"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Share2,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronLeft,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
}

interface RelatedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  publishedAt: string;
  category: string;
}

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  featuredImage?: string;
  featuredImageCaption?: string;
  author: Author;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  category: string;
  tags: string[];
  isPremium: boolean;
  relatedStocks: RelatedStock[];
  relatedArticles: RelatedArticle[];
}

interface ArticlePageProps {
  article: Article;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onShare?: () => void;
  canAccessPremium?: boolean;
  className?: string;
}

export function ArticlePage({
  article,
  isBookmarked = false,
  onBookmark,
  onShare,
  canAccessPremium = true,
  className,
}: ArticlePageProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <article className={cn("max-w-4xl mx-auto", className)}>
      {/* Back navigation */}
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to News
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        {/* Category & Premium Badge */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/news/category/${article.category.toLowerCase()}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {article.category}
          </Link>
          {article.isPremium && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-medium rounded">
              Premium
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-xl text-muted-foreground mb-6">
            {article.subtitle}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(article.publishedAt)}</span>
            <span>at {formatTime(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{article.readingTime} min read</span>
          </div>
          {article.updatedAt && article.updatedAt !== article.publishedAt && (
            <span className="text-xs">
              Updated {formatDate(article.updatedAt)}
            </span>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <Link
            href={`/columnists/${article.author.id}`}
            className="flex items-center gap-3 group"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={article.author.avatar} />
              <AvatarFallback>
                {article.author.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">
                {article.author.name}
              </div>
              {article.author.title && (
                <div className="text-sm text-muted-foreground">
                  {article.author.title}
                </div>
              )}
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Text-to-speech */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onBookmark}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.featuredImage && (
        <figure className="mb-8">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-terminal-elevated">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
          {article.featuredImageCaption && (
            <figcaption className="mt-2 text-sm text-muted-foreground text-center">
              {article.featuredImageCaption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Related Stocks Sidebar */}
      {article.relatedStocks.length > 0 && (
        <aside className="float-right ml-6 mb-6 w-64 hidden lg:block">
          <div className="card-terminal p-4 sticky top-24">
            <h3 className="text-sm font-semibold mb-3">Related Stocks</h3>
            <div className="space-y-3">
              {article.relatedStocks.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <Link
                    key={stock.symbol}
                    href={`/markets/stock/${stock.symbol}`}
                    className="flex items-center justify-between hover:bg-terminal-elevated p-2 -mx-2 rounded transition-colors"
                  >
                    <div>
                      <div className="font-mono font-medium text-sm">
                        {stock.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {stock.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm tabular-nums">
                        ${stock.price.toFixed(2)}
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-0.5 text-xs font-mono justify-end",
                          isPositive ? "text-up" : "text-down"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      )}

      {/* Article Content */}
      {!article.isPremium || canAccessPremium ? (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : (
        <PremiumPaywall />
      )}

      {/* Tags */}
      <div className="mt-8 pt-8 border-t border-border">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag}
              href={`/news/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
              className="px-3 py-1 bg-terminal-elevated hover:bg-muted rounded-full text-sm transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Author Bio */}
      {article.author.bio && (
        <div className="mt-8 p-6 bg-terminal-elevated rounded-lg">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={article.author.avatar} />
              <AvatarFallback>
                {article.author.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{article.author.name}</h3>
              {article.author.title && (
                <div className="text-sm text-muted-foreground mb-2">
                  {article.author.title}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{article.author.bio}</p>
              <Link
                href={`/columnists/${article.author.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                View all articles
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Related Articles */}
      {article.relatedArticles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {article.relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/news/${related.slug}`}
                className="group card-terminal p-4 hover:bg-terminal-elevated transition-colors"
              >
                <div className="flex gap-4">
                  {related.thumbnail && (
                    <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={related.thumbnail}
                        alt={related.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-primary mb-1">
                      {related.category}
                    </div>
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDate(related.publishedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/**
 * Premium content paywall component.
 */
function PremiumPaywall() {
  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="blur-sm select-none pointer-events-none">
        <p className="text-lg leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
          ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat...
        </p>
        <p className="text-lg leading-relaxed mt-4">
          Duis aute irure dolor in reprehenderit in voluptate velit esse
          cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
          cupidatat non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum...
        </p>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Bookmark className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
          <p className="text-muted-foreground mb-6">
            This article is available exclusively to Bard Global Finance Institute subscribers.
            Get unlimited access to all premium content.
          </p>
          <div className="space-y-3">
            <Button className="w-full" size="lg">
              Subscribe Now
            </Button>
            <Button variant="ghost" className="w-full">
              Sign in if you&apos;re already a subscriber
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Article card component for listings.
 */
interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    excerpt?: string;
    slug: string;
    thumbnail?: string;
    author: { name: string; avatar?: string };
    publishedAt: string;
    readingTime: number;
    category: string;
    isPremium: boolean;
  };
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function ArticleCard({
  article,
  variant = "default",
  className,
}: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (variant === "featured") {
    return (
      <Link
        href={`/news/${article.slug}`}
        className={cn(
          "group relative block overflow-hidden rounded-xl bg-terminal-elevated",
          className
        )}
      >
        {article.thumbnail && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-primary">
              {article.category}
            </span>
            {article.isPremium && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                Premium
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-white/70 line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span>{article.author.name}</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>{article.readingTime} min</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/news/${article.slug}`}
        className={cn(
          "group flex items-start gap-3 py-3 border-b border-border last:border-b-0",
          className
        )}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{formatDate(article.publishedAt)}</span>
            {article.isPremium && (
              <span className="text-amber-500">Premium</span>
            )}
          </div>
        </div>
        {article.thumbnail && (
          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={article.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/news/${article.slug}`}
      className={cn(
        "group block card-terminal overflow-hidden hover:bg-terminal-elevated transition-colors",
        className
      )}
    >
      {article.thumbnail && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary">
            {article.category}
          </span>
          {article.isPremium && (
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-medium rounded">
              Premium
            </span>
          )}
        </div>
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={article.author.avatar} />
              <AvatarFallback className="text-[8px]">
                {article.author.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span>{article.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{formatDate(article.publishedAt)}</span>
            <span>{article.readingTime} min</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
