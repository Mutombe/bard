"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  countryCode: string;
  event: string;
  impact: "high" | "medium" | "low";
  actual?: string;
  forecast?: string;
  previous?: string;
}

const mockEvents: EconomicEvent[] = [
  { id: "1", time: "08:00", country: "South Africa", countryCode: "ZA", event: "Manufacturing PMI", impact: "high", actual: "52.4", forecast: "51.8", previous: "51.2" },
  { id: "2", time: "09:30", country: "South Africa", countryCode: "ZA", event: "Trade Balance", impact: "medium", forecast: "R15.2B", previous: "R12.8B" },
  { id: "3", time: "10:00", country: "Nigeria", countryCode: "NG", event: "Inflation Rate YoY", impact: "high", forecast: "28.5%", previous: "28.2%" },
  { id: "4", time: "11:00", country: "Egypt", countryCode: "EG", event: "Non-Oil Private Sector PMI", impact: "medium", forecast: "48.5", previous: "47.8" },
  { id: "5", time: "14:00", country: "Kenya", countryCode: "KE", event: "Central Bank Rate Decision", impact: "high", forecast: "12.50%", previous: "12.50%" },
  { id: "6", time: "15:30", country: "South Africa", countryCode: "ZA", event: "SARB Interest Rate Decision", impact: "high" },
  { id: "7", time: "16:00", country: "Ghana", countryCode: "GH", event: "GDP Growth Rate QoQ", impact: "medium", forecast: "1.2%", previous: "0.9%" },
];

const countries = ["All", "South Africa", "Nigeria", "Kenya", "Egypt", "Ghana"];
const impacts = ["All", "High", "Medium", "Low"];

export default function EconomicCalendarPage() {
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedImpact, setSelectedImpact] = useState("All");
  const [currentDate, setCurrentDate] = useState(new Date());

  const filteredEvents = mockEvents.filter((event) => {
    const matchesCountry =
      selectedCountry === "All" || event.country === selectedCountry;
    const matchesImpact =
      selectedImpact === "All" || event.impact === selectedImpact.toLowerCase();
    return matchesCountry && matchesImpact;
  });

  const getImpactColor = (impact: EconomicEvent["impact"]) => {
    switch (impact) {
      case "high": return "bg-market-down";
      case "medium": return "bg-brand-orange";
      case "low": return "bg-market-up";
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-brand-orange" />
              Economic Calendar
            </h1>
            <p className="text-muted-foreground">
              Track key economic events and data releases across African markets.
            </p>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 hover:bg-terminal-bg-elevated rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {currentDate.toLocaleDateString("en-ZA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-sm text-brand-orange hover:text-brand-orange-light"
              >
                Today
              </button>
            </div>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 hover:bg-terminal-bg-elevated rounded-md transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            >
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="px-3 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            >
              {impacts.map((impact) => (
                <option key={impact} value={impact}>{impact} Impact</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-market-down"></span> High
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-orange"></span> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-market-up"></span> Low
            </span>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
            <div className="col-span-1">Time</div>
            <div className="col-span-2">Country</div>
            <div className="col-span-4">Event</div>
            <div className="col-span-1 text-center">Impact</div>
            <div className="col-span-1 text-right">Actual</div>
            <div className="col-span-1 text-right">Forecast</div>
            <div className="col-span-2 text-right">Previous</div>
          </div>

          {/* Events */}
          <div className="divide-y divide-terminal-border">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
              >
                <div className="col-span-1 font-mono text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {event.time}
                </div>
                <div className="col-span-2 text-sm">
                  <span className="font-medium">{event.countryCode}</span>
                  <span className="text-muted-foreground ml-2 hidden md:inline">{event.country}</span>
                </div>
                <div className="col-span-4">
                  <span className="font-medium">{event.event}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className={cn("h-2 w-2 rounded-full", getImpactColor(event.impact))} />
                </div>
                <div className="col-span-1 text-right font-mono text-sm">
                  {event.actual ? (
                    <span className={cn(
                      event.forecast && parseFloat(event.actual) > parseFloat(event.forecast)
                        ? "text-market-up"
                        : event.forecast && parseFloat(event.actual) < parseFloat(event.forecast)
                        ? "text-market-down"
                        : ""
                    )}>
                      {event.actual}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                <div className="col-span-1 text-right font-mono text-sm text-muted-foreground">
                  {event.forecast || "-"}
                </div>
                <div className="col-span-2 text-right font-mono text-sm text-muted-foreground">
                  {event.previous || "-"}
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground">
                No economic events match your filter criteria.
              </p>
            </div>
          )}
        </div>

        {/* Legend & Info */}
        <div className="mt-6 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <h3 className="font-semibold mb-3">Understanding the Calendar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Actual:</strong> The released value when available.
              Green indicates better than forecast, red indicates worse.
            </div>
            <div>
              <strong className="text-foreground">Forecast:</strong> The consensus estimate from
              economists before the release.
            </div>
            <div>
              <strong className="text-foreground">Previous:</strong> The value from the prior
              release period.
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
