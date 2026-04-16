"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  MagnifyingGlass,
  Clock,
  ArrowRight,
  ChatText,
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

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function OpinionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    newsService
      .getArticles({ content_type: "opinion", page_size: 30, search: searchQuery || undefined } as any)
      .then((r: any) => setArticles(r.results || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-2">
              BGFI Editorial
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Opinions</h1>
            <p className="text-muted-foreground max-w-2xl">
              Expert perspectives on African markets, economies, and policy from BGFI&apos;s editorial team and contributors.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search opinions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-secondary border border-terminal-border text-sm focus:outline-none focus:border-brand-coral"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-96 bg-terminal-bg-secondary animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-terminal-bg-secondary animate-pulse" />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-terminal-bg-secondary border border-terminal-border p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold mb-2">No opinion pieces yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search."
                : "Editorial opinion pieces will appear here as our team publishes them."}
            </p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark"
            >
              Browse all articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Opinion */}
            {featured && (
              <Link href={`/news/${featured.slug}`} className="block mb-8 group">
                <article className="border border-terminal-border bg-terminal-bg-secondary overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-video lg:aspect-auto bg-terminal-bg-elevated overflow-hidden">
                      {(featured.featured_image_url || featured.featured_image) && (
                        <Image
                          src={featured.featured_image_url || featured.featured_image || ""}
                          alt={featured.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          unoptimized
                        />
                      )}
                      <div className="absolute top-0 left-0 bg-brand-coral text-white text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-2">
                        Featured Opinion
                      </div>
                    </div>
                    <div className="p-6 md:p-10 flex flex-col justify-center">
                      <div className="text-xs font-medium uppercase tracking-wider text-brand-violet mb-3">
                        {featured.category?.name || "Opinion"}
                      </div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 leading-tight group-hover:text-brand-coral transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-muted-foreground mb-5 line-clamp-3 font-serif-body leading-relaxed">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-brand-plum text-white flex items-center justify-center font-serif font-bold text-sm">
                          {getInitials(featured.author?.full_name || "BGFI")}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{featured.author?.full_name || "BGFI Editorial"}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{formatDate(featured.published_at)}</span>
                            {featured.read_time_minutes ? (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {featured.read_time_minutes} min
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rest.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group">
                  <article className="bg-terminal-bg-secondary border border-terminal-border p-6 h-full hover:border-brand-violet/40 transition-colors">
                    <div className="text-xs font-medium uppercase tracking-wider text-brand-violet mb-2">
                      {article.category?.name || "Opinion"}
                    </div>
                    <h3 className="font-serif text-lg font-bold mb-3 leading-snug group-hover:text-brand-coral transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 font-serif-body">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-brand-plum text-white flex items-center justify-center font-serif font-bold text-xs">
                          {getInitials(article.author?.full_name || "BGFI")}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{article.author?.full_name || "BGFI Editorial"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(article.published_at)}</span>
                        {article.read_time_minutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {article.read_time_minutes} min
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
