"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Video,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: "conference" | "webinar" | "workshop" | "networking";
  isVirtual: boolean;
  speakers: string[];
  image: string;
  registrationUrl: string;
  attendees?: number;
}

const events: Event[] = [
  {
    id: "1",
    title: "African Investment Summit 2025",
    description: "The premier gathering of investors, fund managers, and business leaders focused on African opportunities. Three days of insights, networking, and deal-making.",
    date: "2025-03-15",
    time: "09:00 - 18:00",
    location: "Cape Town International Convention Centre",
    type: "conference",
    isVirtual: false,
    speakers: ["Aliko Dangote", "Phuthi Mahanyele-Dabengwa", "Dr. Ngozi Okonjo-Iweala"],
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    registrationUrl: "#",
    attendees: 2500,
  },
  {
    id: "2",
    title: "Understanding African Currency Markets",
    description: "A deep-dive webinar on forex trading strategies for African currencies, featuring expert analysis on the Rand, Naira, and emerging market dynamics.",
    date: "2025-02-05",
    time: "14:00 - 15:30 SAST",
    location: "Online",
    type: "webinar",
    isVirtual: true,
    speakers: ["Dr. Fatima Hassan", "Thabo Mokoena"],
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
    registrationUrl: "#",
  },
  {
    id: "3",
    title: "ESG Investing in Africa Workshop",
    description: "Practical workshop on integrating ESG criteria into African investment portfolios. Learn from leading sustainable finance experts.",
    date: "2025-02-20",
    time: "10:00 - 16:00",
    location: "Johannesburg Stock Exchange",
    type: "workshop",
    isVirtual: false,
    speakers: ["Dr. Yemi Adegoke", "Sarah Mulondo"],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop",
    registrationUrl: "#",
    attendees: 80,
  },
  {
    id: "4",
    title: "Nigeria Market Outlook 2025",
    description: "Join our analysts as they break down the opportunities and risks in Nigeria's equity and fixed income markets for the year ahead.",
    date: "2025-01-30",
    time: "11:00 - 12:00 WAT",
    location: "Online",
    type: "webinar",
    isVirtual: true,
    speakers: ["Chidi Okonkwo", "Amara Obi"],
    image: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=800&h=400&fit=crop",
    registrationUrl: "#",
  },
  {
    id: "5",
    title: "Mining & Resources Networking Evening",
    description: "An exclusive networking event for professionals in the mining and resources sector. Connect with industry leaders over cocktails.",
    date: "2025-02-12",
    time: "18:00 - 21:00",
    location: "The Saxon Hotel, Johannesburg",
    type: "networking",
    isVirtual: false,
    speakers: [],
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop",
    registrationUrl: "#",
    attendees: 150,
  },
];

const eventTypes = [
  { id: "all", label: "All Events" },
  { id: "conference", label: "Conferences" },
  { id: "webinar", label: "Webinars" },
  { id: "workshop", label: "Workshops" },
  { id: "networking", label: "Networking" },
];

function getTypeColor(type: Event["type"]) {
  switch (type) {
    case "conference":
      return "bg-blue-500/20 text-blue-400";
    case "webinar":
      return "bg-purple-500/20 text-purple-400";
    case "workshop":
      return "bg-green-500/20 text-green-400";
    case "networking":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState("all");

  const filteredEvents = events.filter(
    (event) => selectedType === "all" || event.type === selectedType
  );

  const upcomingEvents = filteredEvents.filter(
    (event) => new Date(event.date) >= new Date()
  );

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-brand-orange" />
            Events
          </h1>
          <p className="text-muted-foreground">
            Conferences, webinars, and networking opportunities for African market professionals.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {eventTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedType === type.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Featured Event */}
        {upcomingEvents.length > 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:w-1/2 relative aspect-video md:aspect-auto md:min-h-[300px]">
                <Image
                  src={upcomingEvents[0].image}
                  alt={upcomingEvents[0].title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getTypeColor(upcomingEvents[0].type))}>
                    {upcomingEvents[0].type.charAt(0).toUpperCase() + upcomingEvents[0].type.slice(1)}
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <span className="text-sm text-brand-orange mb-2">Featured Event</span>
                <h2 className="text-xl font-bold mb-3">{upcomingEvents[0].title}</h2>
                <p className="text-muted-foreground mb-4">{upcomingEvents[0].description}</p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(upcomingEvents[0].date).toLocaleDateString("en-ZA", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {upcomingEvents[0].time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {upcomingEvents[0].isVirtual ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    {upcomingEvents[0].location}
                  </div>
                  {upcomingEvents[0].attendees && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {upcomingEvents[0].attendees.toLocaleString()} expected attendees
                    </div>
                  )}
                </div>

                {upcomingEvents[0].speakers.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Featured Speakers</div>
                    <div className="flex flex-wrap gap-2">
                      {upcomingEvents[0].speakers.map((speaker) => (
                        <span
                          key={speaker}
                          className="px-2 py-1 text-xs bg-terminal-bg-elevated rounded"
                        >
                          {speaker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={upcomingEvents[0].registrationUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors w-fit"
                >
                  Register Now
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* All Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.slice(1).map((event) => (
            <div
              key={event.id}
              className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors"
            >
              <div className="relative aspect-video">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={cn("px-2 py-1 rounded text-xs font-medium", getTypeColor(event.type))}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  {event.isVirtual && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Virtual
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {event.description}
                </p>
                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString("en-ZA", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
                <a
                  href={event.registrationUrl}
                  className="block w-full text-center py-2 border border-brand-orange text-brand-orange rounded-md hover:bg-brand-orange hover:text-white transition-colors text-sm"
                >
                  Register
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* No Events */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground">
              There are no {selectedType !== "all" && selectedType} events scheduled at this time.
            </p>
          </div>
        )}

        {/* Host Event CTA */}
        <div className="mt-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Want to host an event with us?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Partner with Bard Global Finance Institute to reach Africa&apos;s investment community. We offer sponsorship opportunities, speaking slots, and co-hosting arrangements.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
          >
            Contact Us
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
