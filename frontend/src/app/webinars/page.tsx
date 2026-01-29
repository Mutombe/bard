"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  Calendar,
  Clock,
  Video,
  Play,
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

export default function WebinarsPage() {
  const [filter, setFilter] = useState("all");
  const [selectedWebinar, setSelectedWebinar] = useState<YouTubeVideo | null>(null);

  // Fetch African finance webinars from YouTube
  const { data: webinars, isLoading, error, mutate } = useYouTubeSearch({
    q: "African investment webinar JSE stock market trading education South Africa",
    max_results: 12,
    region: "ZA",
  });

  // Simulate upcoming webinars (static for now)
  const upcomingWebinars = [
    {
      id: "upcoming-1",
      title: "2026 African Market Outlook: Investment Opportunities",
      presenter: "CNBC Africa",
      date: "2026-02-15",
      time: "14:00 SAST",
      thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop",
    },
    {
      id: "upcoming-2",
      title: "Technical Analysis Masterclass: JSE Trading Strategies",
      presenter: "JSE Learning Academy",
      date: "2026-02-22",
      time: "10:00 SAST",
      thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    },
  ];

  const filteredWebinars = filter === "upcoming" ? [] : (webinars || []);

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Video Modal */}
        {selectedWebinar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setSelectedWebinar(null)}>
            <div className="w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative pb-[56.25%] bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`${selectedWebinar.embed_url}?autoplay=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 bg-terminal-bg-secondary rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedWebinar.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedWebinar.channel_title}</span>
                  <span>{formatViewCount(selectedWebinar.view_count)} views</span>
                  <span>{selectedWebinar.duration_formatted || formatDuration(selectedWebinar.duration_seconds)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedWebinar(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Video className="h-6 w-6 text-brand-orange" />
              Webinars
            </h1>
            <p className="text-muted-foreground">
              Live sessions and on-demand recordings from market experts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["all", "upcoming", "recorded"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-sm rounded-full capitalize transition-colors",
                  filter === f
                    ? "bg-brand-orange text-white"
                    : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
            <button
              onClick={() => mutate()}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-terminal-bg-elevated border border-terminal-border rounded-full hover:border-brand-orange transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Upcoming Webinars */}
        {filter !== "recorded" && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              Upcoming Webinars
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingWebinars.map((webinar) => (
                <div
                  key={webinar.id}
                  className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={webinar.thumbnail}
                      alt={webinar.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Upcoming
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{webinar.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-brand-orange">{webinar.presenter}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(webinar.date).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {webinar.time}
                      </span>
                    </div>
                    <button className="w-full py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors">
                      Set Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recorded Webinars from YouTube */}
        {filter !== "upcoming" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5" />
              On-Demand Recordings
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
                    <Skeleton className="aspect-video" />
                    <div className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Unable to load webinars</h3>
                <p className="text-muted-foreground mb-4">
                  Please try again later.
                </p>
                <button
                  onClick={() => mutate()}
                  className="px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWebinars.map((webinar) => (
                  <div
                    key={webinar.video_id}
                    onClick={() => setSelectedWebinar(webinar)}
                    className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors cursor-pointer group"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={webinar.thumbnail_url}
                        alt={webinar.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <div className="h-14 w-14 rounded-full bg-brand-orange flex items-center justify-center transform group-hover:scale-110 transition-transform">
                          <Play className="h-7 w-7 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-terminal-bg/90 text-xs font-medium rounded flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Recorded
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs font-mono">
                        {webinar.duration_formatted || formatDuration(webinar.duration_seconds)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-brand-orange transition-colors">
                        {webinar.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-brand-orange">{webinar.channel_title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatViewCount(webinar.view_count)} views
                        </span>
                        {webinar.like_count > 0 && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {formatViewCount(webinar.like_count)}
                          </span>
                        )}
                        {webinar.published_at && (
                          <span>
                            {new Date(webinar.published_at).toLocaleDateString("en-ZA", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-10 bg-gradient-to-r from-brand-orange/20 to-brand-orange/5 rounded-lg border border-brand-orange/30 p-6 text-center">
          <Video className="h-10 w-10 text-brand-orange mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Learn More About African Markets</h2>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            Subscribe to our partner channels for the latest webinars, tutorials, and market analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "JSE Learning", url: "https://www.youtube.com/@JSELearning" },
              { name: "CNBC Africa", url: "https://www.youtube.com/@CNBCAfrica" },
              { name: "Business Day TV", url: "https://www.youtube.com/@BusinessDayTV" },
            ].map((channel) => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-terminal-bg text-sm rounded-md hover:bg-brand-orange hover:text-white transition-colors"
              >
                {channel.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
