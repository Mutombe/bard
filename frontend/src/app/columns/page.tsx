"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Newspaper,
  Search,
  Clock,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Columnist {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  columnName: string;
  frequency: string;
  slug: string;
}

interface Column {
  id: string;
  title: string;
  excerpt: string;
  columnist: Columnist;
  publishedAt: string;
  readTime: string;
  slug: string;
}

const columnists: Columnist[] = [
  {
    id: "1",
    name: "Thabo Mokoena",
    title: "Senior Markets Editor",
    bio: "20 years covering African markets. Former Reuters correspondent.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    columnName: "Market Pulse",
    frequency: "Daily",
    slug: "thabo-mokoena",
  },
  {
    id: "2",
    name: "Dr. Amara Okafor",
    title: "Chief Economist",
    bio: "PhD Economics, London School of Economics. Specialist in African monetary policy.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop",
    columnName: "Economic Outlook",
    frequency: "Weekly",
    slug: "amara-okafor",
  },
  {
    id: "3",
    name: "Sipho Ndaba",
    title: "Investment Analyst",
    bio: "CFA Charterholder. 15 years in asset management across Africa.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    columnName: "Investment Ideas",
    frequency: "Bi-weekly",
    slug: "sipho-ndaba",
  },
  {
    id: "4",
    name: "Fatima Hassan",
    title: "Tech & Fintech Editor",
    bio: "Covering Africa's tech revolution since 2010. Stanford Knight Fellow.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    columnName: "Tech Frontiers",
    frequency: "Weekly",
    slug: "fatima-hassan",
  },
];

const recentColumns: Column[] = [
  {
    id: "1",
    title: "Why the Rand's Resilience Defies Conventional Wisdom",
    excerpt: "Despite global headwinds, the South African currency has shown remarkable strength. Here's what's really driving the rally.",
    columnist: columnists[0],
    publishedAt: "2025-01-24T06:00:00Z",
    readTime: "5 min",
    slug: "rand-resilience-2025",
  },
  {
    id: "2",
    title: "The Inflation Puzzle: Why Rate Cuts May Come Sooner Than Expected",
    excerpt: "Central banks across Africa are signaling a pivot. My analysis suggests markets are underpricing the pace of easing.",
    columnist: columnists[1],
    publishedAt: "2025-01-23T09:00:00Z",
    readTime: "8 min",
    slug: "inflation-puzzle-rate-cuts",
  },
  {
    id: "3",
    title: "Three Undervalued JSE Stocks for Long-Term Investors",
    excerpt: "In a market obsessed with mega-caps, these overlooked gems offer compelling risk-reward profiles.",
    columnist: columnists[2],
    publishedAt: "2025-01-22T10:00:00Z",
    readTime: "7 min",
    slug: "undervalued-jse-stocks",
  },
  {
    id: "4",
    title: "M-Pesa at 15: Lessons for Africa's Next Fintech Wave",
    excerpt: "As mobile money turns 15, what can the continent's aspiring fintech unicorns learn from its success?",
    columnist: columnists[3],
    publishedAt: "2025-01-21T11:00:00Z",
    readTime: "6 min",
    slug: "mpesa-15-lessons",
  },
  {
    id: "5",
    title: "Gold's Golden Era: Why African Miners Stand to Gain",
    excerpt: "With gold testing new highs, African producers are uniquely positioned to benefit. Here's how to play the theme.",
    columnist: columnists[0],
    publishedAt: "2025-01-20T06:00:00Z",
    readTime: "5 min",
    slug: "gold-african-miners",
  },
];

export default function ColumnsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredColumns = recentColumns.filter((column) =>
    column.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    column.columnist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-brand-orange" />
              Columns
            </h1>
            <p className="text-muted-foreground">
              Regular commentary from our expert analysts and editors.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Columnists */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Our Columnists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {columnists.map((columnist) => (
              <Link
                key={columnist.id}
                href={`/people/${columnist.slug}`}
                className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 hover:border-brand-orange transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden">
                    <Image
                      src={columnist.avatar}
                      alt={columnist.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{columnist.name}</h3>
                    <p className="text-xs text-muted-foreground">{columnist.title}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-brand-orange">{columnist.columnName}</span>
                  <span className="text-xs text-muted-foreground ml-2">({columnist.frequency})</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{columnist.bio}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Columns */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Columns</h2>
          <div className="space-y-4">
            {filteredColumns.map((column) => (
              <Link key={column.id} href={`/news/${column.slug}`}>
                <article className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 hover:border-brand-orange transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image
                          src={column.columnist.avatar}
                          alt={column.columnist.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{column.columnist.name}</div>
                        <div className="text-xs text-brand-orange">{column.columnist.columnName}</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 hover:text-brand-orange transition-colors">
                        {column.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {column.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(column.publishedAt).toLocaleDateString("en-ZA", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {column.readTime}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {filteredColumns.length === 0 && (
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No columns found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
