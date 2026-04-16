"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChartLine,
  MagnifyingGlass,
  Clock,
  ArrowRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { newsService } from "@/services/api/news";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  featured_image_url?: string;
  category?: { name: string; slug: string };
  author?: { full_name: string };
  published_at?: string;
  read_time_minutes?: number;
  view_count?: number;
}

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    newsService
      .getArticles({ content_type: "analysis", page_size: 30, search: searchQuery || undefined } as any)
      .then((r: any) => setArticles(r.results || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-2">
              BGFI Editorial
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Analysis</h1>
            <p className="text-muted-foreground max-w-2xl">
              Sector deep-dives, fundamental research, and macroeconomic analysis on Africa&apos;s markets and economies.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search analysis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-secondary border border-terminal-border text-sm focus:outline-none focus:border-brand-coral"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-terminal-bg-secondary animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-terminal-bg-secondary border border-terminal-border p-12 text-center">
            <ChartLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold mb-2">No analysis pieces yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search."
                : "Analysis pieces from our research team will appear here as they're published."}
            </p>
            <Link
              href="/publications/finance-africa-quarterly"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark"
            >
              Read Finance Africa Quarterly
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`} className="group">
                <article className="bg-terminal-bg-secondary border border-terminal-border h-full hover:border-brand-violet/40 transition-colors overflow-hidden">
                  <div className="relative aspect-[16/10] bg-terminal-bg-elevated overflow-hidden">
                    {(article.featured_image_url || article.featured_image) && (
                      <Image
                        src={article.featured_image_url || article.featured_image || ""}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-medium uppercase tracking-wider text-brand-violet mb-2">
                      {article.category?.name || "Analysis"}
                    </div>
                    <h3 className="font-serif text-lg font-bold mb-2 leading-snug group-hover:text-brand-coral transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-serif-body">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{article.author?.full_name || "BGFI Research"}</span>
                      <span>·</span>
                      <span>{formatDate(article.published_at)}</span>
                      {article.read_time_minutes ? (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {article.read_time_minutes} min
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
