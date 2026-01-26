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
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  date: string;
  image: string;
  audio: string;
  series: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  host: string;
  episodes: number;
  image: string;
}

const podcastSeries: Series[] = [
  {
    id: "market-pulse",
    title: "Market Pulse",
    description: "Daily analysis of African markets, covering equities, forex, and commodities.",
    host: "Thabo Mokoena",
    episodes: 245,
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop",
  },
  {
    id: "ceo-conversations",
    title: "CEO Conversations",
    description: "In-depth interviews with Africa's top business leaders and entrepreneurs.",
    host: "Amara Obi",
    episodes: 89,
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop",
  },
  {
    id: "economic-outlook",
    title: "Economic Outlook",
    description: "Weekly deep-dives into macroeconomic trends shaping the continent.",
    host: "Dr. Fatima Hassan",
    episodes: 156,
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop",
  },
];

const latestEpisodes: Episode[] = [
  {
    id: "1",
    title: "JSE Hits Record High: What's Driving the Rally?",
    description: "We analyze the factors behind the JSE's recent surge and what investors should watch for in the coming weeks.",
    duration: "32:45",
    date: "2025-01-24",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    audio: "/audio/episode1.mp3",
    series: "Market Pulse",
  },
  {
    id: "2",
    title: "Interview: Aliko Dangote on Africa's Industrial Future",
    description: "Africa's richest man shares his vision for manufacturing and industrialization across the continent.",
    duration: "58:20",
    date: "2025-01-22",
    image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=400&fit=crop",
    audio: "/audio/episode2.mp3",
    series: "CEO Conversations",
  },
  {
    id: "3",
    title: "Central Bank Decisions: Impact on African Currencies",
    description: "A comprehensive look at recent monetary policy decisions and their effects on the Rand, Naira, and other African currencies.",
    duration: "45:15",
    date: "2025-01-20",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
    audio: "/audio/episode3.mp3",
    series: "Economic Outlook",
  },
  {
    id: "4",
    title: "MTN's Q4 Results: Breaking Down the Numbers",
    description: "Detailed analysis of MTN Group's quarterly performance and outlook for the telecom sector.",
    duration: "28:30",
    date: "2025-01-19",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
    audio: "/audio/episode4.mp3",
    series: "Market Pulse",
  },
  {
    id: "5",
    title: "The Rise of African Tech: VC Trends in 2025",
    description: "Exploring the venture capital landscape and promising startups across the African tech ecosystem.",
    duration: "51:40",
    date: "2025-01-17",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
    audio: "/audio/episode5.mp3",
    series: "CEO Conversations",
  },
];

export default function PodcastsPage() {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Headphones className="h-6 w-6 text-brand-orange" />
            Podcasts
          </h1>
          <p className="text-muted-foreground">
            Stay informed with our expert analysis and interviews on African markets and business.
          </p>
        </div>

        {/* Featured Episode */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/2 relative aspect-video md:aspect-auto">
              <Image
                src={latestEpisodes[0].image}
                alt={latestEpisodes[0].title}
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
              <span className="text-sm text-brand-orange mb-2">{latestEpisodes[0].series}</span>
              <h2 className="text-xl font-bold mb-3">{latestEpisodes[0].title}</h2>
              <p className="text-muted-foreground mb-4">{latestEpisodes[0].description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {latestEpisodes[0].duration}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(latestEpisodes[0].date).toLocaleDateString("en-ZA", {
                    month: "short",
                    day: "numeric"
                  })}
                </span>
              </div>
              <button
                onClick={() => setPlaying(playing === "1" ? null : "1")}
                className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors w-fit"
              >
                {playing === "1" ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Play Episode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Series */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Podcast Series</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {podcastSeries.map((series) => (
              <Link
                key={series.id}
                href={`/podcasts/${series.id}`}
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
                    Hosted by {series.host}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {series.description}
                  </p>
                  <span className="text-xs text-brand-orange">
                    {series.episodes} episodes
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Episodes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All Episodes</h2>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border divide-y divide-terminal-border">
            {latestEpisodes.map((episode) => (
              <div
                key={episode.id}
                className="flex items-center gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors"
              >
                <button
                  onClick={() => setPlaying(playing === episode.id ? null : episode.id)}
                  className="flex-shrink-0 h-12 w-12 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors"
                >
                  {playing === episode.id ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-brand-orange">{episode.series}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(episode.date).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="font-medium truncate">{episode.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{episode.description}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {episode.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="mt-8 bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
          <h2 className="text-lg font-semibold mb-2">Subscribe to Our Podcasts</h2>
          <p className="text-muted-foreground mb-4">
            Listen on your favorite platform and never miss an episode.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Apple Podcasts", "Spotify", "Google Podcasts", "RSS Feed"].map((platform) => (
              <a
                key={platform}
                href="#"
                className="flex items-center gap-2 px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm hover:border-brand-orange transition-colors"
              >
                {platform}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
