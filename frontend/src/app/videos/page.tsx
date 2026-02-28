"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Play,
  Search,
  Eye,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { mediaService, YouTubeVideo } from "@/services/media";

const categories = ["All", "Africa", "South Africa", "Nigeria", "Kenya", "Global"];

const categorySearchMap: Record<string, string> = {
  "All": "africa",
  "Africa": "africa",
  "South Africa": "south_africa",
  "Nigeria": "nigeria",
  "Kenya": "kenya",
  "Global": "global",
};

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const fetchVideos = async (region: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mediaService.getYouTubeFinanceVideos({
        region,
        max_results: 12,
      });
      setVideos(data);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      setError("Failed to load videos. Please try again later.");
      // Set fallback data if API fails
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const searchVideos = async (query: string) => {
    if (!query.trim()) {
      fetchVideos(categorySearchMap[selectedCategory]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await mediaService.searchYouTube({
        q: query,
        max_results: 12,
      });
      setVideos(data);
    } catch (err) {
      console.error("Failed to search videos:", err);
      setError("Failed to search videos. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(categorySearchMap[selectedCategory]);
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchVideos(searchQuery);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const featuredVideo = videos[0];
  const regularVideos = videos.slice(1);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Play className="h-6 w-6 text-brand-orange" />
              Videos
            </h1>
            <p className="text-muted-foreground">
              Market updates, analysis, and financial news from YouTube.
            </p>
          </div>
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </form>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchQuery("");
              }}
              className={cn(
                "px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => fetchVideos(categorySearchMap[selectedCategory])}
            disabled={loading}
            className="ml-auto px-3 py-2 text-sm rounded-md bg-terminal-bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-market-down/10 border border-market-down/30 rounded-lg p-6 text-center mb-8">
            <p className="text-market-down mb-4">{error}</p>
            <button
              onClick={() => fetchVideos(categorySearchMap[selectedCategory])}
              className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setSelectedVideo(null)}>
            <div className="w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative pb-[56.25%] bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`${selectedVideo.embed_url}?autoplay=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 bg-terminal-bg-secondary rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedVideo.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedVideo.channel_title}</span>
                  <span>{formatViews(selectedVideo.view_count)} views</span>
                  <span>{formatDate(selectedVideo.published_at)}</span>
                  <span>{selectedVideo.duration_formatted}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Featured Video */}
        {!loading && featuredVideo && (
          <div className="mb-8">
            <div
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors cursor-pointer"
              onClick={() => setSelectedVideo(featuredVideo)}
            >
              <div className="flex flex-col lg:flex-row">
                <div className="relative lg:w-2/3 aspect-video">
                  <Image
                    src={featuredVideo.thumbnail_url || "/placeholder-video.jpg"}
                    alt={featuredVideo.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                    <div className="h-16 w-16 rounded-full bg-brand-orange flex items-center justify-center">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/70 rounded text-sm font-mono">
                    {featuredVideo.duration_formatted}
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-brand-orange text-white text-xs font-medium rounded">
                      Latest
                    </span>
                  </div>
                </div>
                <div className="p-6 lg:w-1/3 flex flex-col justify-center">
                  <span className="text-xs text-brand-orange font-medium mb-2">
                    {featuredVideo.channel_title}
                  </span>
                  <h2 className="text-xl font-bold mb-3 line-clamp-2">
                    {featuredVideo.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                    {featuredVideo.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViews(featuredVideo.view_count)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featuredVideo.published_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        {!loading && regularVideos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularVideos.map((video) => (
              <div
                key={video.video_id}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video">
                  <Image
                    src={video.thumbnail_url || "/placeholder-video.jpg"}
                    alt={video.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-brand-orange/90 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs font-mono">
                    {video.duration_formatted}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-brand-orange font-medium">
                    {video.channel_title}
                  </span>
                  <h3 className="font-semibold mt-1 mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViews(video.view_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(video.published_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && videos.length === 0 && !error && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
