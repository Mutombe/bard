"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Play,
  Pause,
  Download,
  Share2,
  Clock,
  Calendar,
  User,
  Mic,
  ArrowRight,
  ExternalLink,
  Volume2,
  SkipBack,
  SkipForward,
  ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

// Mock podcast episodes data
const podcastEpisodes: Record<string, any> = {
  "african-markets-today-ep-245": {
    id: "1",
    title: "JSE Rally Continues Amid Global Uncertainty",
    showName: "African Markets Today",
    showSlug: "african-markets-today",
    episodeNumber: 245,
    season: 4,
    date: "January 24, 2025",
    duration: "32:45",
    durationSeconds: 1965,
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=800&fit=crop",
    audioUrl: "/podcasts/amt-245.mp3",
    description: `In this episode of African Markets Today, we analyze the continued rally in South African equities, examine the impact of global interest rate expectations on emerging markets, and discuss the latest corporate earnings from the banking sector.

Our panel of experts breaks down the key market movements and provides actionable insights for investors navigating the current environment.`,
    showNotes: `**Topics Covered:**
- JSE All Share Index performance analysis
- Banking sector Q4 earnings preview
- Rand outlook and FX implications
- Emerging market flows and positioning

**Companies Mentioned:**
- Standard Bank Group (SBK)
- FirstRand Limited (FSR)
- Naspers Ltd (NPN)
- MTN Group (MTN)

**Resources:**
- [BGFI Banking Sector Report](/research/african-banking-outlook-2025)
- [Weekly Market Summary](/news/weekly-market-summary)`,
    hosts: [
      {
        name: "Thabo Mokoena",
        role: "Host",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      },
    ],
    guests: [
      {
        name: "Dr. Fatima Hassan",
        role: "Chief Economist, BGFI",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop",
      },
      {
        name: "James Mwangi",
        role: "Senior Equity Analyst",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
      },
    ],
    transcript: `[00:00] THABO: Welcome to African Markets Today. I'm Thabo Mokoena, and today we're diving deep into the continued rally we've seen on the JSE this week...

[00:32] THABO: Joining me today is Dr. Fatima Hassan, our Chief Economist, and James Mwangi, Senior Equity Analyst. Welcome to the show.

[00:45] FATIMA: Thanks for having us, Thabo. It's been quite a week in the markets.

[01:02] JAMES: Absolutely. The momentum we're seeing in the financials space is particularly noteworthy...

[Full transcript available to subscribers]`,
    relatedEpisodes: [
      { title: "Banking Earnings Preview: What to Expect", slug: "banking-earnings-preview", episodeNumber: 244 },
      { title: "Central Bank Watch: SARB Decision Analysis", slug: "sarb-decision-analysis", episodeNumber: 243 },
      { title: "2025 Market Outlook Special", slug: "2025-market-outlook", episodeNumber: 242 },
    ],
    platforms: {
      spotify: "https://open.spotify.com/episode/...",
      apple: "https://podcasts.apple.com/...",
      youtube: "https://youtube.com/watch?v=...",
    },
    tags: ["Markets", "JSE", "Banking", "South Africa"],
  },
  "economic-briefing-ep-89": {
    id: "2",
    title: "Inflation Dynamics Across African Economies",
    showName: "BGFI Economic Briefing",
    showSlug: "economic-briefing",
    episodeNumber: 89,
    season: 2,
    date: "January 22, 2025",
    duration: "45:12",
    durationSeconds: 2712,
    thumbnail: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=800&fit=crop",
    audioUrl: "/podcasts/eb-89.mp3",
    description: `A deep dive into inflation trends across Africa's major economies, examining the divergent monetary policy responses from central banks and implications for investors.`,
    showNotes: `**Topics Covered:**
- South Africa CPI analysis
- Nigeria inflation trajectory
- Kenya monetary policy outlook
- Regional comparison and trends`,
    hosts: [
      {
        name: "Amara Obi",
        role: "Host",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop",
      },
    ],
    guests: [],
    transcript: `[Full transcript available to subscribers]`,
    relatedEpisodes: [],
    platforms: {
      spotify: "https://open.spotify.com/episode/...",
      apple: "https://podcasts.apple.com/...",
    },
    tags: ["Economics", "Inflation", "Central Banks", "Monetary Policy"],
  },
};

export default function PodcastEpisodePage() {
  const params = useParams();
  const slug = params.slug as string;
  const episode = podcastEpisodes[slug];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  if (!episode) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 text-center">
          <Mic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Episode Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The podcast episode you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/podcasts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Browse All Episodes
          </Link>
        </div>
      </MainLayout>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (currentTime / episode.durationSeconds) * 100;

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-terminal-bg-secondary border-b border-terminal-border">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/podcasts" className="hover:text-foreground">Podcasts</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/podcasts?show=${episode.showSlug}`} className="hover:text-foreground">
                {episode.showName}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Episode {episode.episodeNumber}</span>
            </nav>
          </div>
        </div>

        {/* Episode Header */}
        <div className="bg-gradient-to-b from-slate-900 to-terminal-bg">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Episode Art */}
              <div className="lg:col-span-1">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={episode.thumbnail}
                    alt={episode.title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                </div>
              </div>

              {/* Episode Info */}
              <div className="lg:col-span-2 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Link
                    href={`/podcasts?show=${episode.showSlug}`}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {episode.showName}
                  </Link>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">Episode {episode.episodeNumber}</span>
                  {episode.season && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400">Season {episode.season}</span>
                    </>
                  )}
                </div>

                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  {episode.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {episode.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {episode.duration}
                  </span>
                </div>

                {/* Audio Player */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6 text-white" fill="white" />
                      ) : (
                        <Play className="h-6 w-6 text-white ml-1" fill="white" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div
                          className="absolute left-0 top-0 h-full bg-primary rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{episode.duration}</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-white">
                        <SkipBack className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white">
                        <SkipForward className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white">
                        <Volume2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  {episode.platforms.spotify && (
                    <a
                      href={episode.platforms.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] rounded-lg text-sm text-white transition-colors"
                    >
                      Spotify
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {episode.platforms.apple && (
                    <a
                      href={episode.platforms.apple}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Apple Podcasts
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Description */}
              <section className="mb-12">
                <h2 className="font-serif text-xl font-bold mb-4">Episode Description</h2>
                <div className="prose-journal text-muted-foreground leading-relaxed whitespace-pre-line">
                  {episode.description}
                </div>
              </section>

              {/* Show Notes */}
              <section className="mb-12">
                <h2 className="font-serif text-xl font-bold mb-4">Show Notes</h2>
                <div className="prose-journal text-muted-foreground leading-relaxed whitespace-pre-line bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                  {episode.showNotes}
                </div>
              </section>

              {/* Transcript */}
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-bold">Transcript</h2>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    {showTranscript ? "Hide" : "Show"} Transcript
                  </button>
                </div>
                {showTranscript && (
                  <div className="prose-journal text-muted-foreground leading-relaxed whitespace-pre-line bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 max-h-96 overflow-y-auto">
                    {episode.transcript}
                  </div>
                )}
              </section>

              {/* Hosts & Guests */}
              <section>
                <h2 className="font-serif text-xl font-bold mb-4">
                  {episode.guests.length > 0 ? "Hosts & Guests" : "Hosted By"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {episode.hosts.map((host: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={host.image}
                          alt={host.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{host.name}</h4>
                        <p className="text-sm text-muted-foreground">{host.role}</p>
                      </div>
                    </div>
                  ))}
                  {episode.guests.map((guest: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={guest.image}
                          alt={guest.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{guest.name}</h4>
                        <p className="text-sm text-muted-foreground">{guest.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              {/* Tags */}
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 mb-6">
                <h3 className="font-semibold mb-4">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {episode.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/topics/${tag.toLowerCase().replace(/ /g, "-")}`}
                      className="px-3 py-1 text-sm bg-terminal-bg rounded-full border border-terminal-border hover:border-primary/50 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Related Episodes */}
              {episode.relatedEpisodes.length > 0 && (
                <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 mb-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ListMusic className="h-4 w-4" />
                    More Episodes
                  </h3>
                  <div className="space-y-4">
                    {episode.relatedEpisodes.map((related: any) => (
                      <Link
                        key={related.slug}
                        href={`/podcasts/${related.slug}`}
                        className="block group"
                      >
                        <p className="font-medium group-hover:text-primary transition-colors text-sm">
                          {related.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Episode {related.episodeNumber}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/podcasts?show=${episode.showSlug}`}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 mt-4"
                  >
                    All {episode.showName} episodes <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Subscribe Card */}
              <div className="relative overflow-hidden bg-primary/10 rounded-lg border border-primary/20 p-6">
                <div className="absolute inset-0 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="opacity-[0.07] dark:opacity-[0.10]"><defs><pattern id="episode-sub-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(355, 70%, 38%)" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#episode-sub-grid)"/></svg></div>
                <h3 className="relative font-semibold mb-2">Never Miss an Episode</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to get new episodes delivered automatically.
                </p>
                <div className="space-y-2">
                  {episode.platforms.spotify && (
                    <a
                      href={episode.platforms.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] rounded-lg text-sm text-white transition-colors"
                    >
                      Follow on Spotify
                    </a>
                  )}
                  {episode.platforms.apple && (
                    <a
                      href={episode.platforms.apple}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
                    >
                      Follow on Apple Podcasts
                    </a>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
