"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Clock, User, Zap } from "lucide-react";
import { newsService } from "@/services/api/news";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NewsArticle } from "@/types";

export function LatestNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [breaking, setBreaking] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const [featured, breakingNews] = await Promise.all([
          newsService.getFeaturedArticles(),
          newsService.getBreakingNews(),
        ]);
        setArticles(featured);
        setBreaking(breakingNews);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-terminal-border rounded animate-pulse" />
          <div className="h-8 w-24 bg-terminal-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "card-terminal animate-pulse",
                i === 0 && "lg:col-span-2 lg:row-span-2"
              )}
            >
              <div className="aspect-video bg-terminal-border rounded-t-md" />
              <div className="p-4">
                <div className="h-4 w-20 bg-terminal-border rounded mb-3" />
                <div className="h-6 w-full bg-terminal-border rounded mb-2" />
                <div className="h-4 w-3/4 bg-terminal-border rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const [mainArticle, ...sideArticles] = articles;

  return (
    <div>
      {/* Breaking News Banner */}
      {breaking.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-market-down-bg border border-market-down/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-market-down">
              <Zap className="h-5 w-5 animate-pulse" />
              <span className="font-bold uppercase text-sm">Breaking</span>
            </div>
            <Link
              href={`/news/${breaking[0].slug}`}
              className="text-foreground hover:text-brand-orange transition-colors"
            >
              {breaking[0].title}
            </Link>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Latest News</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Market insights and analysis
          </p>
        </div>
        <Link href="/news">
          <Button variant="ghost" size="sm" className="gap-2">
            All News
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Featured Article */}
        {mainArticle && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 lg:row-span-2"
          >
            <Link
              href={`/news/${mainArticle.slug}`}
              className="group block card-terminal overflow-hidden hover:border-terminal-border-light transition-colors"
            >
              {/* Image */}
              {mainArticle.featured_image && (
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={mainArticle.featured_image}
                    alt={mainArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {mainArticle.is_premium && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="default">Premium</Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant="outline"
                    style={{ borderColor: mainArticle.category.color }}
                  >
                    {mainArticle.category.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(mainArticle.published_at)}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-brand-orange transition-colors line-clamp-2">
                  {mainArticle.title}
                </h3>

                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {mainArticle.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {mainArticle.author?.full_name || "Editorial Team"}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {mainArticle.read_time_minutes} min read
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>
        )}

        {/* Side Articles */}
        {sideArticles.slice(0, 3).map((article, i) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.1 }}
          >
            <Link
              href={`/news/${article.slug}`}
              className="group block card-terminal overflow-hidden hover:border-terminal-border-light transition-colors h-full"
            >
              {/* Image */}
              {article.featured_image && (
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={article.featured_image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {article.is_premium && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs">
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: article.category.color }}
                  >
                    {article.category.name}
                  </Badge>
                </div>

                <h3 className="font-semibold mb-2 group-hover:text-brand-orange transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatRelativeTime(article.published_at)}</span>
                  <span>{article.read_time_minutes} min</span>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
