"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Building2,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface SearchResult {
  id: string;
  type: "article" | "company" | "person" | "index";
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  date?: string;
  image?: string;
  meta?: Record<string, any>;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "article",
    title: "JSE All Share Index Hits Record High Amid Global Rally",
    subtitle: "Markets • 2 hours ago",
    description: "The Johannesburg Stock Exchange's All Share Index reached unprecedented levels today, driven by strong performance in mining and financial stocks.",
    url: "/news/jse-record-high",
    date: "2025-01-24",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
  },
  {
    id: "2",
    type: "company",
    title: "Naspers Ltd",
    subtitle: "NPN • JSE",
    url: "/companies/npn",
    meta: { price: 3245.67, change: 2.83 },
  },
  {
    id: "3",
    type: "person",
    title: "Phuthi Mahanyele-Dabengwa",
    subtitle: "CEO, Naspers South Africa",
    url: "/people/phuthi-mahanyele",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    type: "article",
    title: "Central Bank of Nigeria Holds Interest Rates Steady",
    subtitle: "Economics • 4 hours ago",
    description: "The Monetary Policy Committee decided to maintain the benchmark rate, citing inflation concerns.",
    url: "/news/cbn-rates-decision",
    date: "2025-01-24",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop",
  },
  {
    id: "5",
    type: "company",
    title: "MTN Group Ltd",
    subtitle: "MTN • JSE",
    url: "/companies/mtn",
    meta: { price: 156.78, change: 6.41 },
  },
  {
    id: "6",
    type: "index",
    title: "JSE Top 40",
    subtitle: "J200 • JSE",
    url: "/markets/indices/j200",
    meta: { value: 68234.56, change: 0.67 },
  },
  {
    id: "7",
    type: "person",
    title: "Aliko Dangote",
    subtitle: "Chairman, Dangote Group",
    url: "/people/aliko-dangote",
    image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
  },
  {
    id: "8",
    type: "article",
    title: "Mining Sector Outlook: Opportunities in African Resources",
    subtitle: "Analysis • 1 day ago",
    description: "Expert analysis on the African mining sector and investment opportunities in 2025.",
    url: "/news/mining-outlook",
    date: "2025-01-23",
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=200&fit=crop",
  },
];

const filters = {
  types: [
    { id: "all", label: "All" },
    { id: "article", label: "Articles" },
    { id: "company", label: "Companies" },
    { id: "person", label: "People" },
    { id: "index", label: "Indices" },
  ],
  timeRange: [
    { id: "any", label: "Any time" },
    { id: "day", label: "Past 24 hours" },
    { id: "week", label: "Past week" },
    { id: "month", label: "Past month" },
    { id: "year", label: "Past year" },
  ],
  sortBy: [
    { id: "relevance", label: "Relevance" },
    { id: "date", label: "Date" },
    { id: "popularity", label: "Popularity" },
  ],
};

function getTypeIcon(type: SearchResult["type"]) {
  switch (type) {
    case "article":
      return <Newspaper className="h-4 w-4 text-brand-orange" />;
    case "company":
      return <Building2 className="h-4 w-4 text-blue-400" />;
    case "person":
      return <User className="h-4 w-4 text-purple-400" />;
    case "index":
      return <TrendingUp className="h-4 w-4 text-market-up" />;
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTime, setSelectedTime] = useState("any");
  const [selectedSort, setSelectedSort] = useState("relevance");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, selectedType, selectedTime, selectedSort]);

  const performSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      const filtered = mockResults.filter((result) => {
        const matchesQuery =
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase());
        const matchesType = selectedType === "all" || result.type === selectedType;
        return matchesQuery && matchesType;
      });
      setResults(query ? filtered : []);
      setIsSearching(false);
    }, 500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Advanced Search</h1>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, companies, people, indices..."
              className="w-full pl-12 pr-4 py-3 bg-terminal-bg-secondary border border-terminal-border rounded-lg text-lg focus:outline-none focus:border-brand-orange"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.types.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                selectedType === type.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="px-3 py-1.5 bg-terminal-bg-secondary border border-terminal-border rounded text-sm focus:outline-none focus:border-brand-orange"
          >
            {filters.timeRange.map((time) => (
              <option key={time.id} value={time.id}>
                {time.label}
              </option>
            ))}
          </select>

          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="px-3 py-1.5 bg-terminal-bg-secondary border border-terminal-border rounded text-sm focus:outline-none focus:border-brand-orange"
          >
            {filters.sortBy.map((sort) => (
              <option key={sort.id} value={sort.id}>
                Sort: {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {isSearching ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-brand-orange border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      ) : query && results.length === 0 ? (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            No results found for &quot;{query}&quot;. Try different keywords.
          </p>
        </div>
      ) : query ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Found {results.length} results for &quot;{query}&quot;
          </p>

          <div className="space-y-4">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="block bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 hover:border-brand-orange transition-colors"
              >
                <div className="flex gap-4">
                  {result.image && result.type === "article" && (
                    <div className="relative w-48 h-28 rounded overflow-hidden flex-shrink-0 hidden md:block">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {result.image && result.type === "person" && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(result.type)}
                      <span className="text-xs text-muted-foreground capitalize">
                        {result.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 hover:text-brand-orange transition-colors">
                      {result.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.subtitle}
                    </p>
                    {result.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                    )}
                    {result.meta && result.type === "company" && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="font-mono">
                          {result.meta.price?.toFixed(2)}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm",
                            result.meta.change >= 0
                              ? "text-market-up"
                              : "text-market-down"
                          )}
                        >
                          {result.meta.change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {result.meta.change >= 0 ? "+" : ""}
                          {result.meta.change?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {result.meta && result.type === "index" && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="font-mono">
                          {result.meta.value?.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm",
                            result.meta.change >= 0
                              ? "text-market-up"
                              : "text-market-down"
                          )}
                        >
                          {result.meta.change >= 0 ? "+" : ""}
                          {result.meta.change?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Search Bard Global Finance Institute</h3>
          <p className="text-muted-foreground">
            Enter a search term to find articles, companies, people, and more.
          </p>
        </div>
      )}
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Advanced Search</h1>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="w-full h-12 bg-terminal-bg-secondary border border-terminal-border rounded-lg animate-pulse" />
          </div>
          <div className="w-24 h-12 bg-terminal-bg-secondary rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="h-8 w-48 bg-terminal-bg-secondary rounded animate-pulse" />
      </div>
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-brand-orange border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={<SearchLoading />}>
        <SearchContent />
      </Suspense>
    </MainLayout>
  );
}
