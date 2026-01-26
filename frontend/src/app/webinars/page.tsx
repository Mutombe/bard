"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Calendar,
  Clock,
  Video,
  Bell,
  Play,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Webinar {
  id: string;
  title: string;
  description: string;
  presenter: {
    name: string;
    title: string;
    avatar: string;
  };
  date: string;
  time: string;
  duration: string;
  status: "upcoming" | "live" | "recorded";
  attendees?: number;
  category: string;
  image: string;
}

const mockWebinars: Webinar[] = [
  {
    id: "1",
    title: "2025 African Market Outlook: Opportunities and Risks",
    description: "Join our chief strategist for an in-depth look at what lies ahead for African markets in 2025, including key themes, sector picks, and risk factors to watch.",
    presenter: { name: "Dr. Amara Okafor", title: "Chief Economist", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop" },
    date: "2025-01-30",
    time: "14:00 SAST",
    duration: "60 min",
    status: "upcoming",
    attendees: 245,
    category: "Strategy",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Technical Analysis Masterclass: Reading African Markets",
    description: "Learn essential technical analysis techniques tailored for African equity markets, including pattern recognition and indicator usage.",
    presenter: { name: "Thabo Mokoena", title: "Senior Technical Analyst", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    date: "2025-02-05",
    time: "10:00 SAST",
    duration: "90 min",
    status: "upcoming",
    attendees: 189,
    category: "Education",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
  },
  {
    id: "3",
    title: "Mining Sector Deep Dive: Navigating the Green Transition",
    description: "Exploration of how African mining companies are positioning for the energy transition and the investment implications.",
    presenter: { name: "Sipho Ndaba", title: "Sector Analyst", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
    date: "2025-01-15",
    time: "15:00 SAST",
    duration: "75 min",
    status: "recorded",
    attendees: 412,
    category: "Sector",
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&h=400&fit=crop",
  },
  {
    id: "4",
    title: "Fintech Revolution: Investment Opportunities in African Digital Finance",
    description: "An exploration of the rapidly evolving African fintech landscape and how to identify winning companies.",
    presenter: { name: "Fatima Hassan", title: "Tech & Fintech Editor", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop" },
    date: "2025-01-10",
    time: "11:00 SAST",
    duration: "60 min",
    status: "recorded",
    attendees: 356,
    category: "Sector",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop",
  },
];

export default function WebinarsPage() {
  const [filter, setFilter] = useState("all");

  const upcomingWebinars = mockWebinars.filter((w) => w.status === "upcoming");
  const recordedWebinars = mockWebinars.filter((w) => w.status === "recorded");

  const filteredWebinars = filter === "upcoming" ? upcomingWebinars :
                          filter === "recorded" ? recordedWebinars :
                          mockWebinars;

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
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
          </div>
        </div>

        {/* Featured Upcoming Webinar */}
        {upcomingWebinars.length > 0 && filter !== "recorded" && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              Next Webinar
            </h2>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="relative lg:w-1/2 aspect-video lg:aspect-auto lg:min-h-[300px]">
                  <Image
                    src={upcomingWebinars[0].image}
                    alt={upcomingWebinars[0].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-market-up text-white text-xs font-medium rounded flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Upcoming
                    </span>
                  </div>
                </div>
                <div className="p-6 lg:w-1/2 flex flex-col justify-center">
                  <span className="text-xs text-brand-orange font-medium mb-2">
                    {upcomingWebinars[0].category}
                  </span>
                  <h3 className="text-xl font-bold mb-3">
                    {upcomingWebinars[0].title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {upcomingWebinars[0].description}
                  </p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={upcomingWebinars[0].presenter.avatar}
                        alt={upcomingWebinars[0].presenter.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{upcomingWebinars[0].presenter.name}</div>
                      <div className="text-sm text-muted-foreground">{upcomingWebinars[0].presenter.title}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(upcomingWebinars[0].date).toLocaleDateString("en-ZA", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {upcomingWebinars[0].time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {upcomingWebinars[0].attendees} registered
                    </span>
                  </div>

                  <button className="w-full md:w-auto px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors font-medium">
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Webinar Grid */}
        <div>
          {filter !== "recorded" && upcomingWebinars.length > 1 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4">More Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingWebinars.slice(1).map((webinar) => (
                  <div key={webinar.id} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors">
                    <div className="relative aspect-video">
                      <Image
                        src={webinar.image}
                        alt={webinar.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-market-up text-white text-xs font-medium rounded">
                          Upcoming
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-brand-orange font-medium">
                        {webinar.category}
                      </span>
                      <h3 className="font-semibold mt-1 mb-2 line-clamp-2">
                        {webinar.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative h-6 w-6 rounded-full overflow-hidden">
                          <Image
                            src={webinar.presenter.avatar}
                            alt={webinar.presenter.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{webinar.presenter.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(webinar.date).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {webinar.attendees} registered
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filter !== "upcoming" && recordedWebinars.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Play className="h-5 w-5" />
                On-Demand Recordings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recordedWebinars.map((webinar) => (
                  <div key={webinar.id} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors cursor-pointer">
                    <div className="relative aspect-video">
                      <Image
                        src={webinar.image}
                        alt={webinar.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                        <div className="h-12 w-12 rounded-full bg-brand-orange flex items-center justify-center">
                          <Play className="h-6 w-6 text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-terminal-bg/90 text-xs font-medium rounded flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Recorded
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs font-mono">
                        {webinar.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-brand-orange font-medium">
                        {webinar.category}
                      </span>
                      <h3 className="font-semibold mt-1 mb-2 line-clamp-2">
                        {webinar.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative h-6 w-6 rounded-full overflow-hidden">
                          <Image
                            src={webinar.presenter.avatar}
                            alt={webinar.presenter.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{webinar.presenter.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {webinar.attendees} watched
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredWebinars.length === 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No webinars found</h3>
            <p className="text-muted-foreground">
              Check back soon for upcoming sessions.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
