"use client";

import { useState } from "react";
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

// Podcast series (static branding)
const podcastSeries = [
  {
    id: "market-pulse",
    title: "Market Pulse Africa",
    description: "Daily analysis of African markets, covering equities, forex, and commodities.",
    host: "CNBC Africa",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop",
  },
  {
    id: "business-day",
    title: "Business Day Live",
    description: "In-depth business news and interviews from South Africa's leading business publication.",
    host: "Business Day",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop",
  },
  {
    id: "economic-outlook",
    title: "African Economic Review",
    description: "Weekly analysis of macroeconomic trends and investment opportunities across Africa.",
    host: "Bloomberg Africa",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop",
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
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Video Modal */}
        {selectedEpisode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setSelectedEpisode(null)}>
            <div className="w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative pb-[56.25%] bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`${selectedEpisode.embed_url}?autoplay=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 bg-terminal-bg-secondary rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedEpisode.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedEpisode.channel_title}</span>
                  <span>{formatViewCount(selectedEpisode.view_count)} views</span>
                  <span>{selectedEpisode.duration_formatted || formatDuration(selectedEpisode.duration_seconds)}</span>
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Headphones className="h-6 w-6 text-brand-orange" />
              Podcasts
            </h1>
            <p className="text-muted-foreground">
              Stay informed with expert analysis and interviews on African markets and business.
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-terminal-bg-elevated border border-terminal-border rounded-md hover:border-brand-orange transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Featured Episode */}
        {!isLoading && podcasts && podcasts.length > 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:w-1/2 relative aspect-video md:aspect-auto md:min-h-[300px]">
                <Image
                  src={podcasts[0].thumbnail_url}
                  alt={podcasts[0].title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 md:hidden">
                  <span className="px-2 py-1 text-xs bg-brand-orange text-white rounded">
                    Latest Episode
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <span className="hidden md:inline-block px-2 py-1 text-xs bg-brand-orange text-white rounded w-fit mb-4">
                  Latest Episode
                </span>
                <span className="text-sm text-brand-orange mb-2">{podcasts[0].channel_title}</span>
                <h2 className="text-xl font-bold mb-3 line-clamp-2">{podcasts[0].title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-3">{podcasts[0].description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {podcasts[0].duration_formatted || formatDuration(podcasts[0].duration_seconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatViewCount(podcasts[0].view_count)} views
                  </span>
                  {podcasts[0].published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(podcasts[0].published_at).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEpisode(podcasts[0])}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors w-fit"
                >
                  <Play className="h-5 w-5" />
                  Watch Episode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Series */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Featured Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {podcastSeries.map((series) => (
              <div
                key={series.id}
                className="group bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors"
              >
                <div className="relative aspect-square">
                  <Image
                    src={series.image}
                    alt={series.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-brand-orange transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {series.host}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {series.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Episodes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Latest Episodes</h2>

          {isLoading ? (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border divide-y divide-terminal-border">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
              <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Unable to load podcasts</h3>
              <p className="text-muted-foreground mb-4">
                Please try again later or check your connection.
              </p>
              <button
                onClick={() => mutate()}
                className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border divide-y divide-terminal-border">
              {podcasts?.slice(1).map((episode) => (
                <div
                  key={episode.video_id}
                  className="flex items-center gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors cursor-pointer"
                  onClick={() => setSelectedEpisode(episode)}
                >
                  <button
                    className="flex-shrink-0 h-12 w-12 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors"
                  >
                    <Play className="h-5 w-5 ml-0.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-brand-orange">{episode.channel_title}</span>
                      {episode.published_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(episode.published_at).toLocaleDateString("en-ZA", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <span className="font-medium truncate block hover:text-brand-orange">
                      {episode.title}
                    </span>
                    <p className="text-sm text-muted-foreground truncate">{episode.description}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViewCount(episode.view_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {episode.duration_formatted || formatDuration(episode.duration_seconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscribe Section */}
        <div className="mt-8 bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h2 className="text-lg font-semibold mb-2">Subscribe to Financial Podcasts</h2>
          <p className="text-muted-foreground mb-4">
            Follow these channels for the latest African market insights.
          </p>
          <div className="flex flex-wrap gap-3">
            {["CNBC Africa", "Business Day TV", "Bloomberg Africa", "MoneywebNOW"].map((platform) => (
              <a
                key={platform}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(platform)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm hover:border-brand-orange transition-colors"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
