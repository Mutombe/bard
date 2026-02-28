"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Pause,
  Clock,
  Calendar,
  Headphones,
  Eye,
  ThumbsUp,
  RefreshCw,
  X,
  ChevronRight,
  Mic,
  Radio,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useYouTubeSearch } from "@/hooks";
import { YouTubeVideo } from "@/services/media";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Podcast series (curated shows)
const podcastSeries = [
  {
    id: "cnbc-africa",
    title: "CNBC Africa",
    description: "Breaking business news and market analysis from Africa's leading business channel.",
    category: "Markets",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop",
    frequency: "Daily",
  },
  {
    id: "bloomberg-africa",
    title: "Bloomberg Africa",
    description: "In-depth coverage of African markets, economies, and business leaders.",
    category: "Economics",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop",
    frequency: "Weekly",
  },
  {
    id: "business-day",
    title: "Business Day TV",
    description: "South Africa's premier business publication with expert commentary and interviews.",
    category: "Analysis",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop",
    frequency: "Daily",
  },
];

export default function PodcastsPage() {
  const [selectedEpisode, setSelectedEpisode] = useState<YouTubeVideo | null>(null);

  // Fetch African finance podcasts from YouTube
  const { data: podcasts, isLoading, error, mutate } = useYouTubeSearch({
    q: "African finance podcast investment JSE market analysis",
    max_results: 12,
    region: "ZA",
  });

  return (
    <MainLayout>
      {/* Video Modal */}
      {selectedEpisode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedEpisode(null)}
        >
          <div className="w-full max-w-5xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative pb-[56.25%] bg-black rounded-lg overflow-hidden">
              <iframe
                src={`${selectedEpisode.embed_url}?autoplay=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 bg-terminal-bg-secondary rounded-lg p-6">
              <span className="label-uppercase text-primary mb-2 block">
                {selectedEpisode.channel_title}
              </span>
              <h3 className="headline text-xl mb-3">{selectedEpisode.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                {selectedEpisode.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatViewCount(selectedEpisode.view_count)} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedEpisode.duration_formatted || formatDuration(selectedEpisode.duration_seconds)}
                </span>
                {selectedEpisode.published_at && (
                  <span>{formatDate(selectedEpisode.published_at)}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedEpisode(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary">Podcasts & Media</span>
        </nav>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h1 className="headline-xl">Podcasts & Media</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Expert analysis, interviews, and market commentary from leading voices
            in African finance. Stay informed with our curated selection of business
            podcasts and video content.
          </p>
        </header>

        {/* Featured Episode */}
        {!isLoading && podcasts && podcasts.length > 0 && (
          <section className="mb-12">
            <h2 className="label-uppercase mb-4">Featured Episode</h2>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2 relative aspect-video md:aspect-auto md:min-h-[350px]">
                  <Image
                    src={podcasts[0].thumbnail_url}
                    alt={podcasts[0].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                  <button
                    onClick={() => setSelectedEpisode(podcasts[0])}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="h-7 w-7 ml-1" />
                    </div>
                  </button>
                </div>
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  <span className="label-uppercase text-primary mb-3">
                    {podcasts[0].channel_title}
                  </span>
                  <h2 className="headline text-2xl mb-4 line-clamp-2">
                    {podcasts[0].title}
                  </h2>
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {podcasts[0].description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {podcasts[0].duration_formatted || formatDuration(podcasts[0].duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViewCount(podcasts[0].view_count)} views
                    </span>
                    {podcasts[0].published_at && (
                      <span>{formatDate(podcasts[0].published_at)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEpisode(podcasts[0])}
                    className="btn-primary w-fit flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Watch Episode
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Latest Episodes */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="headline text-xl">Latest Episodes</h2>
                <button
                  onClick={() => mutate()}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg bg-terminal-bg-secondary">
                      <Skeleton className="w-32 h-20 rounded flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg">
                  <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="headline text-lg mb-2">Unable to Load Episodes</h3>
                  <p className="text-muted-foreground mb-4">
                    Please try again later or check your connection.
                  </p>
                  <button onClick={() => mutate()} className="btn-primary">
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {podcasts?.slice(1).map((episode) => (
                    <div
                      key={episode.video_id}
                      onClick={() => setSelectedEpisode(episode)}
                      className="flex gap-4 p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border hover:border-primary/50 transition-colors cursor-pointer group"
                    >
                      <div className="relative w-32 h-20 rounded overflow-hidden flex-shrink-0 bg-terminal-bg-elevated">
                        <Image
                          src={episode.thumbnail_url}
                          alt={episode.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 text-xs bg-black/80 text-white rounded">
                          {episode.duration_formatted || formatDuration(episode.duration_seconds)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="label-uppercase text-primary text-xs">
                          {episode.channel_title}
                        </span>
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mt-1">
                          {episode.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatViewCount(episode.view_count)}
                          </span>
                          {episode.published_at && (
                            <span>{formatDate(episode.published_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Featured Shows */}
            <section>
              <h3 className="label-uppercase mb-4">Featured Shows</h3>
              <div className="space-y-4">
                {podcastSeries.map((series) => (
                  <div
                    key={series.id}
                    className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={series.image}
                          alt={series.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-primary">{series.category}</span>
                        <h4 className="font-semibold">{series.title}</h4>
                        <span className="text-xs text-muted-foreground">{series.frequency}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {series.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Newsletter */}
            <section className="relative overflow-hidden p-6 rounded-lg bg-primary/5 border border-primary/20">
              <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="podcast-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#podcast-grid)"/></svg></div>
              <h3 className="relative headline text-lg mb-2">Media Digest</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get weekly roundups of the best podcasts and videos on African finance.
              </p>
              <Link href="/subscribe" className="relative btn-primary w-full text-center block">
                Subscribe
              </Link>
            </section>

            {/* Other Media */}
            <section className="p-6 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h3 className="label-uppercase mb-4">More Media</h3>
              <div className="space-y-3">
                <Link
                  href="/videos"
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-terminal-bg-elevated transition-colors"
                >
                  <Radio className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Videos</span>
                </Link>
                <Link
                  href="/webinars"
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-terminal-bg-elevated transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Webinars</span>
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
