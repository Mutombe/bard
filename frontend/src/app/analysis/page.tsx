"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LineChart,
  Search,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Analysis {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  type: "technical" | "fundamental" | "sector" | "macro";
  category: string;
  sentiment: "bullish" | "bearish" | "neutral";
  publishedAt: string;
  readTime: string;
  image: string;
  slug: string;
}

const mockAnalyses: Analysis[] = [
  {
    id: "1",
    title: "JSE All Share: Technical Outlook for Q1 2025",
    excerpt: "Key support and resistance levels to watch as the index approaches all-time highs. Our technical analysis suggests...",
    author: "Technical Research Team",
    type: "technical",
    category: "Markets",
    sentiment: "bullish",
    publishedAt: "2025-01-24T08:00:00Z",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop",
    slug: "jse-technical-outlook-q1-2025",
  },
  {
    id: "2",
    title: "Naspers: Deep Dive Valuation Analysis",
    excerpt: "Is the Tencent discount justified? We break down the sum-of-parts valuation and identify key catalysts for re-rating.",
    author: "Equity Research",
    type: "fundamental",
    category: "Companies",
    sentiment: "bullish",
    publishedAt: "2025-01-23T10:00:00Z",
    readTime: "15 min",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    slug: "naspers-valuation-analysis",
  },
  {
    id: "3",
    title: "African Banking Sector: Navigating Rate Cuts",
    excerpt: "How will declining interest rates impact net interest margins across Africa's major banks? Sector outlook and top picks.",
    author: "Sector Research",
    type: "sector",
    category: "Financials",
    sentiment: "neutral",
    publishedAt: "2025-01-22T09:00:00Z",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    slug: "african-banking-rate-cuts",
  },
  {
    id: "4",
    title: "South African Economy: GDP Forecast Update",
    excerpt: "Revised growth projections for 2025 and analysis of key economic drivers including manufacturing, mining, and services.",
    author: "Economics Team",
    type: "macro",
    category: "Economics",
    sentiment: "neutral",
    publishedAt: "2025-01-21T11:00:00Z",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop",
    slug: "south-africa-gdp-forecast",
  },
  {
    id: "5",
    title: "Gold Price: Fibonacci Levels Point to Further Upside",
    excerpt: "Technical analysis of gold's recent breakout and key price levels for African mining companies to watch.",
    author: "Technical Research Team",
    type: "technical",
    category: "Commodities",
    sentiment: "bullish",
    publishedAt: "2025-01-20T14:00:00Z",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&h=400&fit=crop",
    slug: "gold-price-technical-analysis",
  },
  {
    id: "6",
    title: "Nigerian Consumer Sector Under Pressure",
    excerpt: "Inflation and currency weakness weighing on consumer companies. Our analysis of winners and losers in the NGX consumer space.",
    author: "Sector Research",
    type: "sector",
    category: "Consumer",
    sentiment: "bearish",
    publishedAt: "2025-01-19T10:00:00Z",
    readTime: "11 min",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    slug: "nigerian-consumer-sector-pressure",
  },
];

const analysisTypes = ["All", "Technical", "Fundamental", "Sector", "Macro"];

export default function AnalysisPage() {
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnalyses = mockAnalyses.filter((analysis) => {
    const matchesSearch =
      analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "All" || analysis.type === selectedType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const getSentimentColor = (sentiment: Analysis["sentiment"]) => {
    switch (sentiment) {
      case "bullish": return "text-market-up bg-market-up/20";
      case "bearish": return "text-market-down bg-market-down/20";
      default: return "text-blue-400 bg-blue-400/20";
    }
  };

  const getSentimentIcon = (sentiment: Analysis["sentiment"]) => {
    switch (sentiment) {
      case "bullish": return <TrendingUp className="h-3 w-3" />;
      case "bearish": return <TrendingDown className="h-3 w-3" />;
      default: return <BarChart3 className="h-3 w-3" />;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <LineChart className="h-6 w-6 text-brand-orange" />
              Analysis
            </h1>
            <p className="text-muted-foreground">
              In-depth technical and fundamental analysis of African markets.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search analysis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {analysisTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors",
                selectedType === type
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnalyses.map((analysis) => (
            <Link key={analysis.id} href={`/news/${analysis.slug}`}>
              <article className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden hover:border-brand-orange transition-colors h-full flex flex-col">
                <div className="relative aspect-video">
                  <Image
                    src={analysis.image}
                    alt={analysis.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-1 bg-terminal-bg/90 rounded text-xs font-medium capitalize">
                      {analysis.type}
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium capitalize flex items-center gap-1",
                      getSentimentColor(analysis.sentiment)
                    )}>
                      {getSentimentIcon(analysis.sentiment)}
                      {analysis.sentiment}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-xs text-brand-orange font-medium">
                    {analysis.category}
                  </span>
                  <h3 className="font-semibold mt-1 mb-2 line-clamp-2 hover:text-brand-orange transition-colors">
                    {analysis.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {analysis.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{analysis.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {analysis.readTime}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No analysis found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
