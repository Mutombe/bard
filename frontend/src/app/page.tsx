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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { mediaService, YouTubeVideo } from "@/services/media";
import apiClient from "@/services/api/client";

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
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
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
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
            {article.category?.name || "News"}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo(article.published_at)}</span>
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
              {article.category?.name || "News"}
            </span>
            {article.is_premium && (
              <span className="px-1.5 py-0.5 bg-brand-orange/20 text-brand-orange text-[10px] font-semibold rounded">
                PREMIUM
              </span>
            )}
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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
            {article.category?.name || "News"}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(article.published_at)}
          </span>
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
      <div className="text-xs text-muted-foreground mb-1">{index.name}</div>
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

  if (!video) return null;

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
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                VIDEO
              </span>
              <span className="text-xs text-muted-foreground">
                {video.channel_title}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
              {video.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{video.view_count.toLocaleString()} views</span>
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand-orange hover:text-brand-orange-light"
              >
                Watch on YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState<YouTubeVideo | null>(null);
  const [featuredArticles, setFeaturedArticles] = useState<NewsArticle[]>([]);
  const [latestArticles, setLatestArticles] = useState<NewsArticle[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [topGainers, setTopGainers] = useState<Company[]>([]);
  const [topLosers, setTopLosers] = useState<Company[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!mounted) return;

      setLoading(true);

      try {
        // Fetch YouTube video
        try {
          const videos = await mediaService.getYouTubeFinanceVideos({
            region: "southern_africa",
            max_results: 1,
          });
          if (videos && videos.length > 0) {
            setFeaturedVideo(videos[0]);
          } else {
            // Fallback to global
            const globalVideos = await mediaService.getYouTubeFinanceVideos({
              region: "global",
              max_results: 1,
            });
            if (globalVideos && globalVideos.length > 0) {
              setFeaturedVideo(globalVideos[0]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch video:", err);
        }

        // Fetch news articles
        try {
          const newsResponse = await apiClient.get("/news/articles/", {
            params: { page_size: 15 }
          });
          const articles = newsResponse.data.results || newsResponse.data || [];
          if (articles.length > 0) {
            setFeaturedArticles(articles.slice(0, 3));
            setLatestArticles(articles.slice(3, 12));
          }
        } catch (err) {
          console.error("Failed to fetch news:", err);
        }

        // Fetch market indices
        try {
          const indicesResponse = await apiClient.get("/markets/indices/");
          const indices = indicesResponse.data.results || indicesResponse.data || [];
          setMarketIndices(indices.slice(0, 5));
        } catch (err) {
          console.error("Failed to fetch indices:", err);
        }

        // Fetch top gainers
        try {
          const gainersResponse = await apiClient.get("/markets/companies/gainers/");
          const gainers = gainersResponse.data.results || gainersResponse.data || [];
          setTopGainers(gainers.slice(0, 5));
        } catch (err) {
          console.error("Failed to fetch gainers:", err);
        }

        // Fetch top losers
        try {
          const losersResponse = await apiClient.get("/markets/companies/losers/");
          const losers = losersResponse.data.results || losersResponse.data || [];
          setTopLosers(losers.slice(0, 5));
        } catch (err) {
          console.error("Failed to fetch losers:", err);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Featured Stories */}
              {featuredArticles.length > 0 ? (
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
                  <p>No articles available yet. Create your first article in the Admin CMS.</p>
                  <Link href="/admin/articles/new" className="text-brand-orange hover:underline mt-2 inline-block">
                    Create Article
                  </Link>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-terminal-border" />

              {/* Featured YouTube Video - Second item after news */}
              {featuredVideo && (
                <>
                  <FeaturedVideoSection video={featuredVideo} />
                  <div className="border-t border-terminal-border" />
                </>
              )}

              {/* Latest News Grid */}
              {latestArticles.length > 0 && (
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
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
                              {article.category?.name || "News"}
                            </span>
                            <span className="text-xs text-muted-foreground">{timeAgo(article.published_at)}</span>
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

                {marketIndices.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {marketIndices.map((index) => (
                      <MarketIndexCard key={index.code} index={index} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Market data loading...
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
                      Market movers loading...
                    </p>
                  )}
                </div>
              </section>

              {/* Latest Headlines */}
              {latestArticles.length > 0 && (
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
              <section className="p-4 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
                <h3 className="font-bold mb-2">Morning Briefing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the day&apos;s top stories and market analysis delivered to your inbox every morning.
                </p>
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2 text-sm bg-terminal-bg border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-md hover:bg-brand-orange-dark transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </section>
            </aside>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
